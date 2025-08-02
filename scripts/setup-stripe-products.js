#!/usr/bin/env node

/**
 * Stripe Products Setup Script
 * 
 * This script creates the required Stripe products and prices for EasyOTPAuth.
 * Run this once to setup your Stripe account with the correct pricing structure.
 * 
 * Usage:
 *   node scripts/setup-stripe-products.js
 * 
 * Environment Variables Required:
 *   STRIPE_SECRET_KEY - Your Stripe secret key (starts with sk_)
 */

require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const PRODUCTS_CONFIG = [
  {
    id: 'starter',
    name: 'EasyOTPAuth Starter',
    description: 'Perfect for small applications and getting started',
    price: 2900, // $29.00 in cents
    features: [
      'Up to 1,000 authentications per month',
      'Email support',
      'Basic analytics',
      'Standard integrations',
      '14-day free trial'
    ]
  },
  {
    id: 'professional',
    name: 'EasyOTPAuth Professional',
    description: 'For growing businesses that need more scale',
    price: 14900, // $149.00 in cents
    features: [
      'Up to 10,000 authentications per month',
      'Priority support',
      'Advanced analytics',
      'Custom branding',
      '99.9% uptime SLA',
      '14-day free trial'
    ]
  },
  {
    id: 'enterprise',
    name: 'EasyOTPAuth Enterprise',
    description: 'Custom solutions for large organizations',
    price: null, // Custom pricing - will be handled manually
    features: [
      'Unlimited authentications',
      'Dedicated support',
      'Custom integrations',
      'On-premise deployment',
      'White-label solution',
      'Custom SLA',
      '30-day free trial'
    ]
  }
];

async function createStripeProducts() {
  console.log('🚀 Setting up Stripe products for EasyOTPAuth...\n');

  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('❌ Error: STRIPE_SECRET_KEY environment variable is required');
    console.log('Please add your Stripe secret key to your .env file:');
    console.log('STRIPE_SECRET_KEY=sk_test_...\n');
    process.exit(1);
  }

  if (!process.env.STRIPE_SECRET_KEY.startsWith('sk_')) {
    console.error('❌ Error: Invalid Stripe secret key format');
    console.log('Stripe secret keys should start with "sk_test_" or "sk_live_"\n');
    process.exit(1);
  }

  const isLiveMode = process.env.STRIPE_SECRET_KEY.startsWith('sk_live_');
  console.log(`🔧 Mode: ${isLiveMode ? 'LIVE' : 'TEST'}`);
  
  if (isLiveMode) {
    console.log('⚠️  WARNING: You are using LIVE Stripe keys!');
    console.log('This will create real products in your Stripe account.\n');
  }

  const results = {
    products: [],
    prices: [],
    errors: []
  };

  for (const config of PRODUCTS_CONFIG) {
    try {
      console.log(`📦 Creating product: ${config.name}...`);
      
      // Create the product
      const product = await stripe.products.create({
        name: config.name,
        description: config.description,
        metadata: {
          plan_id: config.id,
          features: config.features.join('|')
        }
      });

      results.products.push(product);
      console.log(`   ✅ Product created: ${product.id}`);

      // Create monthly price (skip for enterprise)
      if (config.price !== null) {
        const monthlyPrice = await stripe.prices.create({
          product: product.id,
          unit_amount: config.price,
          currency: 'usd',
          recurring: { interval: 'month' },
          nickname: `${config.name} Monthly`,
          metadata: {
            plan_type: config.id,
            billing_interval: 'monthly'
          }
        });

        results.prices.push(monthlyPrice);
        console.log(`   ✅ Monthly price created: ${monthlyPrice.id} ($${config.price/100})`);

        // Create annual price (20% discount)
        const annualPrice = Math.round(config.price * 12 * 0.8); // 20% discount
        const yearlyPrice = await stripe.prices.create({
          product: product.id,
          unit_amount: annualPrice,
          currency: 'usd',
          recurring: { interval: 'year' },
          nickname: `${config.name} Yearly`,
          metadata: {
            plan_type: config.id,
            billing_interval: 'yearly',
            discount: '20'
          }
        });

        results.prices.push(yearlyPrice);
        console.log(`   ✅ Yearly price created: ${yearlyPrice.id} ($${annualPrice/100})`);
      } else {
        console.log(`   ℹ️  Enterprise plan - no prices created (custom pricing)`);
      }

      console.log('');
    } catch (error) {
      console.error(`   ❌ Error creating ${config.name}:`, error.message);
      results.errors.push({ product: config.name, error: error.message });
    }
  }

  // Generate environment variables
  console.log('📋 SETUP COMPLETE!\n');
  console.log('Add these environment variables to your .env file:\n');
  
  results.prices.forEach(price => {
    const planType = price.metadata.plan_type.toUpperCase();
    const interval = price.metadata.billing_interval.toUpperCase();
    console.log(`STRIPE_PRICE_${planType}_${interval}=${price.id}`);
  });

  console.log('\n🔗 Webhook endpoint to configure in Stripe Dashboard:');
  console.log(`${process.env.DOMAIN || 'https://your-domain.vercel.app'}/api/stripe-webhook`);
  
  console.log('\n📝 Required webhook events:');
  console.log('• checkout.session.completed');
  console.log('• customer.subscription.deleted');
  console.log('• invoice.payment_succeeded');
  console.log('• invoice.payment_failed');

  if (results.errors.length > 0) {
    console.log('\n⚠️  Errors encountered:');
    results.errors.forEach(error => {
      console.log(`• ${error.product}: ${error.error}`);
    });
  }

  console.log('\n🎉 Your Stripe integration is ready!');
  console.log('Next steps:');
  console.log('1. Add the environment variables above to your .env file');
  console.log('2. Configure the webhook endpoint in your Stripe Dashboard');
  console.log('3. Test the integration with test payments');
  console.log('4. Deploy to production when ready');
}

// Handle CLI execution
if (require.main === module) {
  createStripeProducts().catch(console.error);
}

module.exports = { createStripeProducts, PRODUCTS_CONFIG };
