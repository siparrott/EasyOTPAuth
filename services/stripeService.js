const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { STRIPE_PRODUCTS } = require('../config/stripe-products');
const customerManager = require('./customerManager');
const logger = require('../utils/logger');

class StripeService {
  // Create checkout session
  async createCheckoutSession({ priceId, customerEmail, planType, trialDays = 14 }) {
    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        customer_email: customerEmail,
        line_items: [{
          price: priceId,
          quantity: 1,
        }],
        mode: 'subscription',
        success_url: `${process.env.DOMAIN}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.DOMAIN}/pricing`,
        metadata: {
          planType,
          customerEmail
        },
        subscription_data: {
          trial_period_days: trialDays,
        },
        allow_promotion_codes: true,
      });
      
      logger.info(`Created checkout session for ${customerEmail}: ${session.id}`);
      return session;
    } catch (error) {
      logger.error('Failed to create checkout session:', error);
      throw error;
    }
  }
  
  // Handle successful payment
  async handleSuccessfulPayment(session) {
    try {
      const { customer: stripeCustomerId, metadata } = session;
      const { planType, customerEmail } = metadata;
      
      // Check if customer already exists
      let customer = await customerManager.getCustomerByEmail(customerEmail);
      
      if (!customer) {
        // Create new customer
        customer = await customerManager.createCustomer({
          stripeCustomerId,
          email: customerEmail,
          planType,
          status: 'active'
        });
      } else {
        // Update existing customer
        await customerManager.updateCustomerPlan(customer.id, planType);
      }
      
      // Send welcome email
      await this.sendWelcomeEmail(customer);
      
      logger.info(`Payment successful for customer: ${customer.id} (${customerEmail})`);
      return customer;
    } catch (error) {
      logger.error('Failed to handle successful payment:', error);
      throw error;
    }
  }
  
  // Handle subscription cancellation
  async handleSubscriptionCancellation(subscription) {
    try {
      const customer = await customerManager.getCustomerByStripeId(subscription.customer);
      
      if (customer) {
        await customerManager.deactivateCustomer(customer.id);
        logger.info(`Subscription cancelled for customer: ${customer.id}`);
      }
      
      return customer;
    } catch (error) {
      logger.error('Failed to handle subscription cancellation:', error);
      throw error;
    }
  }
  
  // Handle successful renewal
  async handleSuccessfulRenewal(invoice) {
    try {
      const customer = await customerManager.getCustomerByStripeId(invoice.customer);
      
      if (customer) {
        // Reset usage count for the new billing period
        customer.usageCount = 0;
        customer.updatedAt = new Date();
        logger.info(`Subscription renewed for customer: ${customer.id}`);
      }
      
      return customer;
    } catch (error) {
      logger.error('Failed to handle successful renewal:', error);
      throw error;
    }
  }
  
  // Handle failed payment
  async handleFailedPayment(invoice) {
    try {
      const customer = await customerManager.getCustomerByStripeId(invoice.customer);
      
      if (customer) {
        // You might want to send a payment failure email or suspend the account
        logger.warn(`Payment failed for customer: ${customer.id}`);
        
        // Optionally suspend account after multiple failures
        if (invoice.attempt_count >= 3) {
          customer.status = 'suspended';
          await customerManager.updateCustomer(customer.id, customer);
        }
      }
      
      return customer;
    } catch (error) {
      logger.error('Failed to handle failed payment:', error);
      throw error;
    }
  }
  
  // Get subscription info
  async getSubscriptionInfo(stripeCustomerId) {
    try {
      const subscriptions = await stripe.subscriptions.list({
        customer: stripeCustomerId,
        status: 'active',
        limit: 1
      });
      
      return subscriptions.data[0] || null;
    } catch (error) {
      logger.error('Failed to get subscription info:', error);
      return null;
    }
  }
  
  // Create customer portal session
  async createPortalSession(stripeCustomerId, returnUrl) {
    try {
      const session = await stripe.billingPortal.sessions.create({
        customer: stripeCustomerId,
        return_url: returnUrl,
      });
      
      return session;
    } catch (error) {
      logger.error('Failed to create portal session:', error);
      throw error;
    }
  }
  
  // Send welcome email (placeholder - implement with your email service)
  async sendWelcomeEmail(customer) {
    const fs = require('fs');
    const path = require('path');
    const hbs = require('handlebars');
    
    try {
      // Load email templates
      const htmlTemplatePath = path.join(process.cwd(), 'templates/email/welcome.html.hbs');
      const textTemplatePath = path.join(process.cwd(), 'templates/email/welcome.txt.hbs');
      
      let htmlTemplate, textTemplate;
      
      try {
        const htmlTemplateSrc = fs.readFileSync(htmlTemplatePath, 'utf8');
        const textTemplateSrc = fs.readFileSync(textTemplatePath, 'utf8');
        htmlTemplate = hbs.compile(htmlTemplateSrc);
        textTemplate = hbs.compile(textTemplateSrc);
      } catch (error) {
        logger.warn('Welcome email templates not found, using simple template');
        // Fallback to simple template
        htmlTemplate = hbs.compile(`
          <h1>Welcome to EasyOTPAuth!</h1>
          <p>Hi {{customerName}},</p>
          <p>Your {{planType}} plan is now active!</p>
          <p><strong>Your API Key:</strong> <code>{{apiKey}}</code></p>
          <p><a href="{{dashboardUrl}}">Access Your Dashboard</a></p>
          <p>Thank you for choosing EasyOTPAuth!</p>
        `);
        textTemplate = hbs.compile(`
Welcome to EasyOTPAuth!

Hi {{customerName}},

Your {{planType}} plan is now active!

Your API Key: {{apiKey}}

Dashboard: {{dashboardUrl}}

Thank you for choosing EasyOTPAuth!
        `);
      }
      
      // Prepare template data
      const customerName = customer.email.split('@')[0];
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 14);
      
      const templateData = {
        appName: 'EasyOTPAuth',
        customerName: customerName,
        planType: customer.planType,
        apiKey: customer.apiKey,
        dashboardUrl: `${process.env.DOMAIN}/dashboard?key=${customer.apiKey}`,
        apiEndpoint: `${process.env.DOMAIN}/auth`,
        usageLimit: customer.usageLimit === -1 ? 'unlimited' : customer.usageLimit.toLocaleString(),
        trialDays: 14,
        trialEndDate: trialEndDate.toLocaleDateString(),
        features: this.getPlanFeatures(customer.planType),
        logoUrl: process.env.BRANDING_LOGO_URL || `${process.env.DOMAIN}/logo.png`,
        supportEmail: process.env.BRANDING_SUPPORT_EMAIL || 'support@easyotpauth.com',
        responseTime: customer.planType === 'professional' ? 'Within 4 hours' : 'Within 24 hours',
        websiteUrl: process.env.DOMAIN || 'https://easyotpauth.com',
        docsUrl: `${process.env.DOMAIN}/docs`,
        examplesUrl: `${process.env.DOMAIN}/examples`,
        supportUrl: `${process.env.DOMAIN}/support`,
        unsubscribeUrl: `${process.env.DOMAIN}/unsubscribe`,
        privacyUrl: `${process.env.DOMAIN}/privacy`
      };
      
      const htmlContent = htmlTemplate(templateData);
      const textContent = textTemplate(templateData);
      
      // Email configuration
      const emailData = {
        to: customer.email,
        subject: `🎉 Welcome to EasyOTPAuth - Your ${customer.planType} plan is ready!`,
        html: htmlContent,
        text: textContent
      };
      
      logger.info(`Welcome email prepared for ${customer.email} (${customer.planType} plan)`);
      
      // TODO: Integrate with your existing nodemailer setup in api/index.js
      // For now, we'll just log the email data
      logger.info('Email data prepared:', {
        to: emailData.to,
        subject: emailData.subject,
        apiKey: customer.apiKey.substring(0, 10) + '...'
      });
      
      return emailData;
      
    } catch (error) {
      logger.error('Failed to prepare welcome email:', error);
      throw error;
    }
  }
  
  // Get plan features for email template
  getPlanFeatures(planType) {
    const features = {
      starter: [
        'Up to 1,000 authentications per month',
        'Email support',
        'Basic analytics',
        'Standard integrations',
        '14-day free trial'
      ],
      professional: [
        'Up to 10,000 authentications per month',
        'Priority support (4-hour response)',
        'Advanced analytics and reporting',
        'Custom branding options',
        '99.9% uptime SLA',
        '14-day free trial'
      ],
      enterprise: [
        'Unlimited authentications',
        'Dedicated support manager',
        'Custom integrations',
        'On-premise deployment options',
        'White-label solution',
        'Custom SLA',
        '30-day free trial'
      ]
    };
    
    return features[planType] || features.starter;
  }
  
  // Webhook signature verification
  verifyWebhookSignature(payload, signature, secret) {
    try {
      return stripe.webhooks.constructEvent(payload, signature, secret);
    } catch (error) {
      logger.error('Webhook signature verification failed:', error);
      throw error;
    }
  }
  
  // Get customer usage stats for billing
  async getCustomerUsageStats(stripeCustomerId) {
    const customer = await customerManager.getCustomerByStripeId(stripeCustomerId);
    
    if (!customer) return null;
    
    return {
      customerId: customer.id,
      email: customer.email,
      planType: customer.planType,
      usageCount: customer.usageCount,
      usageLimit: customer.usageLimit,
      usagePercentage: customer.usageLimit === -1 ? 0 : (customer.usageCount / customer.usageLimit) * 100
    };
  }
}

module.exports = new StripeService();
