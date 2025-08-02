// Stripe Product Configuration
const STRIPE_PRODUCTS = {
  starter: {
    priceId: process.env.STRIPE_PRICE_STARTER || 'price_starter_monthly',
    name: 'Starter Plan',
    price: 2900, // $29.00 in cents
    features: [
      'Up to 1,000 authentications',
      'Email support',
      'Basic analytics',
      'Standard integrations'
    ],
    limits: {
      maxAuthentications: 1000,
      supportLevel: 'email'
    }
  },
  professional: {
    priceId: process.env.STRIPE_PRICE_PROFESSIONAL || 'price_professional_monthly',
    name: 'Professional Plan', 
    price: 14900, // $149.00 in cents
    features: [
      'Up to 10,000 authentications',
      'Priority support',
      'Advanced analytics',
      'Custom branding',
      '99.9% uptime SLA'
    ],
    limits: {
      maxAuthentications: 10000,
      supportLevel: 'priority',
      customBranding: true
    }
  },
  enterprise: {
    priceId: process.env.STRIPE_PRICE_ENTERPRISE || 'price_enterprise_custom',
    name: 'Enterprise Plan',
    price: null, // Custom pricing
    features: [
      'Unlimited authentications',
      'Dedicated support',
      'Custom integrations',
      'On-premise deployment',
      'White-label solution'
    ],
    limits: {
      maxAuthentications: -1, // Unlimited
      supportLevel: 'dedicated',
      customBranding: true,
      onPremise: true
    }
  }
};

// Payment Models
const PAYMENT_MODELS = {
  // Monthly Subscriptions (Recommended)
  subscription: {
    billing: 'monthly',
    trial: 14, // 14-day free trial
    cancellation: 'immediate', // or 'end_of_period'
  },
  
  // Annual Subscriptions (20% discount)
  annual: {
    billing: 'yearly',
    discount: 0.2,
    trial: 30, // 30-day free trial for annual
  },
  
  // One-time Setup Fee + Monthly
  hybrid: {
    setupFee: 9900, // $99 one-time
    monthly: true,
    trial: 7
  }
};

module.exports = {
  STRIPE_PRODUCTS,
  PAYMENT_MODELS
};
