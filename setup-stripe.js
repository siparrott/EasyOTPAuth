#!/usr/bin/env node

/**
 * EasyOTPAuth Stripe Setup Script
 * Run this after getting your Stripe API keys to automatically create products
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const PRODUCTS = {
  starter: {
    name: 'EasyOTPAuth Starter',
    description: 'Perfect for small applications and testing',
    price: 2900, // $29.00 in cents
    features: [
      'Up to 1,000 authentications per month',
      'Email support within 24 hours', 
      'Basic usage analytics',
      'Standard integrations',
      '14-day free trial'
    ]
  },
  professional: {
    name: 'EasyOTPAuth Professional',
    description: 'For growing businesses and production apps',
    price: 14900, // $149.00 in cents
    features: [
      'Up to 10,000 authentications per month',
      'Priority support within 4 hours',
      'Advanced analytics dashboard',
      'Custom branding options',
      '99.9% uptime SLA',
      'Webhook notifications',
      '14-day free trial'
    ]
  },
  enterprise: {
    name: 'EasyOTPAuth Enterprise',
    description: 'Custom solutions for large organizations',
    price: 99900, // $999.00 in cents (placeholder)
    features: [
      'Unlimited authentications',
      'Dedicated support manager',
      'Custom integrations and features',
      'On-premise deployment options',
      'White-label solution',
      'Custom SLA agreements',
      'Priority feature requests'
    ]
  }
};

async function createStripeProducts() {
  console.log('🚀 Setting up EasyOTPAuth Stripe products...\n');

  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('❌ Error: STRIPE_SECRET_KEY environment variable not set');
    console.log('Please set your Stripe secret key:');
    console.log('export STRIPE_SECRET_KEY=sk_test_your_key_here');
    process.exit(1);
  }

  const results = {};

  try {
    for (const [planKey, config] of Object.entries(PRODUCTS)) {
      console.log(`📦 Creating ${config.name}...`);

      // Create product
      const product = await stripe.products.create({
        name: config.name,
        description: config.description,
        metadata: {
          plan: planKey,
          features: JSON.stringify(config.features)
        }
      });

      console.log(`✅ Product created: ${product.id}`);

      // Create price
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: config.price,
        currency: 'usd',
        recurring: {
          interval: 'month',
          trial_period_days: 14
        },
        metadata: {
          plan: planKey
        }
      });

      console.log(`💰 Price created: ${price.id}`);

      results[planKey] = {
        product_id: product.id,
        price_id: price.id,
        amount: config.price
      };

      console.log('');
    }

    console.log('🎉 All products created successfully!\n');
    console.log('📋 COPY THESE VALUES TO YOUR .env FILE:\n');
    console.log('# Stripe Product Price IDs');
    console.log(`STRIPE_PRICE_STARTER=${results.starter.price_id}`);
    console.log(`STRIPE_PRICE_PROFESSIONAL=${results.professional.price_id}`);
    console.log(`STRIPE_PRICE_ENTERPRISE=${results.enterprise.price_id}`);
    console.log('');

    console.log('📊 PRICING SUMMARY:');
    console.log(`Starter: $${results.starter.amount / 100}/month (${results.starter.price_id})`);
    console.log(`Professional: $${results.professional.amount / 100}/month (${results.professional.price_id})`);
    console.log(`Enterprise: $${results.enterprise.amount / 100}/month (${results.enterprise.price_id})`);
    console.log('');

    console.log('🔗 NEXT STEPS:');
    console.log('1. Copy the price IDs above to your .env file');
    console.log('2. Set up your webhook endpoint in Stripe dashboard');
    console.log('3. Update your website with the new price IDs');
    console.log('4. Test the payment flow');
    console.log('');

    console.log('🌐 WEBHOOK ENDPOINT:');
    console.log('Add this to your Stripe webhooks:');
    console.log('URL: https://your-domain.vercel.app/api/stripe-webhook');
    console.log('Events: checkout.session.completed, customer.subscription.deleted, invoice.payment_succeeded, invoice.payment_failed');
    console.log('');

  } catch (error) {
    console.error('❌ Error creating products:', error.message);
    
    if (error.code === 'authentication_required') {
      console.log('Please check your Stripe API key is correct and has the right permissions.');
    }
    
    process.exit(1);
  }
}

// Run the setup
if (require.main === module) {
  createStripeProducts();
}

module.exports = { createStripeProducts, PRODUCTS };
