require('dotenv').config();
const fs = require('fs');
const path = require('path');
const express = require('express');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const hbs = require('handlebars');
const { createClient } = require('redis');
const morgan = require('morgan');
const winston = require('winston');
const https = require('https');

// Stripe integration
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Handle path resolution for serverless environment
const getUtilPath = (utilName) => {
  const possiblePaths = [
    path.join(process.cwd(), 'services', utilName),
    path.join(process.cwd(), 'middleware', utilName),
    path.join(process.cwd(), 'utils', utilName),
    path.join(__dirname, '..', 'services', utilName),
    path.join(__dirname, '..', 'middleware', utilName),
    path.join(__dirname, '..', 'utils', utilName)
  ];
  
  for (const possiblePath of possiblePaths) {
    try {
      if (fs.existsSync(possiblePath + '.js')) {
        return possiblePath;
      }
    } catch (e) {
      // Continue to next path
    }
  }
  return null;
};

// Try to load Stripe services (graceful fallback if not available)
let stripeService = null;
let customerManager = null;
let authMiddleware = null;

try {
  const stripeServicePath = getUtilPath('stripeService');
  const customerManagerPath = getUtilPath('customerManager');
  const authMiddlewarePath = getUtilPath('auth');
  
  if (stripeServicePath) stripeService = require(stripeServicePath);
  if (customerManagerPath) customerManager = require(customerManagerPath);
  if (authMiddlewarePath) authMiddleware = require(authMiddlewarePath);
} catch (error) {
  logger.warn('Stripe integration modules not found, payment features disabled:', error.message);
}

// Initialize app
const app = express();

// Load branding configuration
const getBranding = () => {
  try {
    const brandingPath = path.join(process.cwd(), 'branding.json');
    return JSON.parse(fs.readFileSync(brandingPath, 'utf8'));
  } catch (error) {
    // Fallback branding if file doesn't exist
    return {
      appName: "EasyOTPAuth",
      logoUrl: "/logo.png",
      supportEmail: "support@easyotpauth.com"
    };
  }
};

const branding = getBranding();

const logger = winston.createLogger({
  level: 'info',
  transports: [
    new winston.transports.Console({ stderrLevels: ['error'] })
  ]
});

// Middleware
app.use(express.json());

// Add CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-API-Key');
  res.header('Access-Control-Expose-Headers', 'X-RateLimit-Limit, X-RateLimit-Used, X-RateLimit-Remaining');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use('/public', express.static(path.join(process.cwd(), 'public')));

// Raw body parser for Stripe webhooks
app.use('/api/stripe-webhook', express.raw({type: 'application/json'}));

// Only use morgan in development
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('combined'));
}

// Redis client setup (for Vercel, we'll use a connection pool or external Redis)
let redisClient;
if (process.env.REDIS_URL) {
  redisClient = createClient({ 
    url: process.env.REDIS_URL,
    socket: {
      connectTimeout: 5000,
      lazyConnect: true
    }
  });
  
  redisClient.on('error', (err) => {
    logger.error('Redis connection error:', err);
  });
  
  // Connect only when needed
  const connectRedis = async () => {
    if (!redisClient.isOpen && !redisClient.isReady) {
      try {
        await redisClient.connect();
      } catch (err) {
        logger.error('Failed to connect to Redis:', err);
      }
    }
  };
  
  // Ensure connection before first use
  connectRedis();
}

// In-memory OTP store fallback (note: this won't persist across serverless invocations)
const otps = new Map();

const storeOtp = async (email, hash) => {
  if (redisClient && redisClient.isReady) {
    try {
      await redisClient.set(`otp:${email}`, hash, { EX: 600 });
    } catch (err) {
      logger.error('Redis store error:', err);
      // Fallback to memory
      otps.set(email, { hash, expires: Date.now() + 600000 });
    }
  } else {
    otps.set(email, { hash, expires: Date.now() + 600000 });
  }
};

const fetchOtp = async (email) => {
  if (redisClient && redisClient.isReady) {
    try {
      const hash = await redisClient.get(`otp:${email}`);
      if (hash) {
        await redisClient.del(`otp:${email}`);
        return { hash };
      }
    } catch (err) {
      logger.error('Redis fetch error:', err);
    }
  }
  
  // Fallback to memory
  const record = otps.get(email);
  if (!record || Date.now() > record.expires) return null;
  otps.delete(email);
  return record;
};

// Rate limiter configuration for serverless
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => (req.body && req.body.email) || req.ip,
  message: { error: 'Too many OTP requests. Please try again later.' },
  skip: (req) => {
    // Skip rate limiting in development
    return process.env.NODE_ENV === 'development';
  }
});

// Mail transport setup
const getTransporter = () => {
  if (!process.env.SMTP_HOST) {
    logger.warn('SMTP configuration missing');
    return null;
  }
  
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

// Load email templates
const getEmailTemplates = () => {
  try {
    const htmlTemplatePath = path.join(process.cwd(), 'templates/email/otp.html.hbs');
    const textTemplatePath = path.join(process.cwd(), 'templates/email/otp.txt.hbs');
    
    const htmlTemplateSrc = fs.readFileSync(htmlTemplatePath, 'utf8');
    const textTemplateSrc = fs.readFileSync(textTemplatePath, 'utf8');
    
    return {
      html: hbs.compile(htmlTemplateSrc),
      text: hbs.compile(textTemplateSrc)
    };
  } catch (error) {
    logger.error('Failed to load email templates:', error);
    // Return simple fallback templates
    return {
      html: hbs.compile('<p>Your verification code is: {{code}}</p>'),
      text: hbs.compile('Your verification code is: {{code}}')
    };
  }
};

const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

// Routes
app.get('/', (req, res) => {
  try {
    const indexPath = path.join(process.cwd(), 'public', 'index.html');
    res.sendFile(indexPath);
  } catch (error) {
    res.status(500).json({ error: 'Failed to serve homepage' });
  }
});

// Serve test pages
app.get('/personal-test', (req, res) => {
  try {
    const testPath = path.join(process.cwd(), 'public', 'personal-test.html');
    res.sendFile(testPath);
  } catch (error) {
    res.status(500).json({ error: 'Failed to serve test page' });
  }
});

app.get('/e2e-test', (req, res) => {
  try {
    const testPath = path.join(process.cwd(), 'public', 'e2e-test.html');
    res.sendFile(testPath);
  } catch (error) {
    res.status(500).json({ error: 'Failed to serve test page' });
  }
});

app.get('/email-test', (req, res) => {
  try {
    const testPath = path.join(process.cwd(), 'public', 'email-test.html');
    res.sendFile(testPath);
  } catch (error) {
    res.status(500).json({ error: 'Failed to serve test page' });
  }
});

app.get('/client-demo', (req, res) => {
  try {
    const testPath = path.join(process.cwd(), 'public', 'client-demo.html');
    res.sendFile(testPath);
  } catch (error) {
    res.status(500).json({ error: 'Failed to serve client demo page' });
  }
});

// Serve client integration script with proper MIME type
app.get('/client-integration.js', (req, res) => {
  try {
    const scriptPath = path.join(process.cwd(), 'client-integration.js');
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.sendFile(scriptPath);
  } catch (error) {
    res.status(500).json({ error: 'Failed to serve client integration script' });
  }
});

// New API endpoints for client integration
app.post('/api/send-otp', trackAPIUsage, otpLimiter, async (req, res) => {
  const { email } = req.body || {};
  
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return res.status(400).json({ success: false, error: 'Invalid email address.' });
  }

  const code = generateCode();
  const hash = await bcrypt.hash(code, 10);
  await storeOtp(email.toLowerCase(), hash);

  const transporter = getTransporter();
  if (!transporter) {
    return res.status(500).json({ 
      success: false, 
      error: 'Email service not configured. Please set SMTP environment variables.' 
    });
  }

  try {
    const templates = getEmailTemplates();
    const html = templates.html({ code, branding });
    const text = templates.text({ code, branding });
    
    await transporter.sendMail({
      from: process.env.MAIL_FROM || `"${branding.appName}" <${branding.supportEmail}>`,
      to: email,
      subject: `Your ${branding.appName} login code`,
      text,
      html
    });

    logger.info(`OTP sent to ${email}`);
    res.json({ success: true, message: 'OTP sent successfully' });
  } catch (err) {
    logger.error('Email sending error:', err);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to send verification email.' 
    });
  }
});

app.post('/api/verify-otp', trackAPIUsage, async (req, res) => {
  const { email, otp } = req.body || {};
  
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (!email || !otp) {
    return res.status(400).json({ success: false, error: 'Email and OTP are required.' });
  }

  if (!/^\d{6}$/.test(otp)) {
    return res.status(400).json({ success: false, error: 'OTP must be 6 digits.' });
  }

  const record = await fetchOtp(email.toLowerCase());
  if (!record) {
    return res.status(400).json({ success: false, error: 'Code expired or not found.' });
  }

  const match = await bcrypt.compare(otp, record.hash);
  if (!match) {
    return res.status(400).json({ success: false, error: 'Invalid verification code.' });
  }

  const jwtSecret = process.env.JWT_SECRET || 'dev-secret-change-in-production';
  const token = jwt.sign(
    { 
      email, 
      authenticated: true,
      timestamp: Date.now()
    }, 
    jwtSecret, 
    { expiresIn: '7d' }
  );
  
  logger.info(`User authenticated: ${email}`);
  res.json({ 
    success: true, 
    message: 'Authentication successful',
    token, 
    user: {
      email,
      authenticated: true
    }
  });
});

// Handle CORS preflight requests
app.options('/api/send-otp', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.status(200).end();
});

app.options('/api/verify-otp', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.status(200).end();
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    branding,
    timestamp: new Date().toISOString(),
    environment: process.env.VERCEL_ENV || 'development'
  });
});

// Serve end-to-end test page
app.get('/e2e-test', (req, res) => {
  try {
    const testPath = path.join(process.cwd(), 'public', 'e2e-test.html');
    res.sendFile(testPath);
  } catch (error) {
    res.status(500).json({ error: 'Failed to serve test page' });
  }
});

app.post('/license/activate', async (req, res) => {
  if (!process.env.LICENSE_SERVER) {
    return res.json({ active: true });
  }

  const data = JSON.stringify({ license: process.env.LICENSE });
  const url = new URL('/activate', process.env.LICENSE_SERVER);
  const opts = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  };

  const request = https.request(url, opts, (resp) => {
    let body = '';
    resp.on('data', (chunk) => (body += chunk));
    resp.on('end', () => {
      if (resp.statusCode === 200) {
        logger.info('License activated');
        res.json({ active: true });
      } else {
        logger.error('License activation failed');
        res.status(400).json({ error: 'Activation failed' });
      }
    });
  });

  request.on('error', (err) => {
    logger.error('License activation error:', err);
    res.status(500).json({ error: 'Activation failed' });
  });

  request.write(data);
  request.end();
});

// =============== STRIPE PAYMENT ENDPOINTS ===============

// Create checkout session for subscription
app.post('/api/create-checkout-session', async (req, res) => {
  if (!stripeService) {
    return res.status(503).json({ 
      error: 'Payment service not available',
      message: 'Stripe integration is not configured. Please contact support.'
    });
  }
  
  try {
    const { priceId, customerEmail, planType } = req.body;
    
    if (!priceId || !customerEmail || !planType) {
      return res.status(400).json({ 
        error: 'Missing required fields: priceId, customerEmail, planType' 
      });
    }
    
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({ 
        error: 'Stripe not configured. Please contact support.' 
      });
    }
    
    const session = await stripeService.createCheckoutSession({
      priceId,
      customerEmail,
      planType,
      trialDays: 14
    });
    
    res.json({ url: session.url });
  } catch (error) {
    logger.error('Checkout session creation failed:', error);
    res.status(500).json({ 
      error: 'Failed to create checkout session',
      message: error.message 
    });
  }
});

// Handle Stripe webhooks
app.post('/api/stripe-webhook', async (req, res) => {
  if (!stripeService) {
    return res.status(503).json({ error: 'Payment service not available' });
  }
  
  const sig = req.headers['stripe-signature'];
  let event;
  
  try {
    event = stripeService.verifyWebhookSignature(
      req.body, 
      sig, 
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    logger.error('Webhook signature verification failed:', err);
    return res.status(400).send(`Webhook signature verification failed.`);
  }
  
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await stripeService.handleSuccessfulPayment(event.data.object);
        break;
        
      case 'customer.subscription.deleted':
        await stripeService.handleSubscriptionCancellation(event.data.object);
        break;
        
      case 'invoice.payment_succeeded':
        await stripeService.handleSuccessfulRenewal(event.data.object);
        break;
        
      case 'invoice.payment_failed':
        await stripeService.handleFailedPayment(event.data.object);
        break;
        
      default:
        logger.info(`Unhandled webhook event type: ${event.type}`);
    }
    
    res.json({received: true});
  } catch (error) {
    logger.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Customer dashboard data
app.get('/api/dashboard', async (req, res) => {
  if (!customerManager || !authMiddleware) {
    return res.status(503).json({ error: 'Customer service not available' });
  }
  
  // Simple API key authentication
  const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
  
  if (!apiKey) {
    return res.status(401).json({ 
      error: 'API key required',
      message: 'Please provide an API key in the X-API-Key header'
    });
  }

  try {
    const customer = await customerManager.getCustomerByAPIKey(apiKey);
    
    if (!customer) {
      return res.status(401).json({ error: 'Invalid API key' });
    }
    
    const dashboardData = await customerManager.getDashboardData(customer.id);
    
    if (!dashboardData) {
      return res.status(404).json({ error: 'Customer data not found' });
    }
    
    // Get Stripe subscription info if available
    let billing = null;
    if (stripeService && customer.stripeCustomerId) {
      try {
        const subscription = await stripeService.getSubscriptionInfo(customer.stripeCustomerId);
        if (subscription) {
          billing = {
            status: subscription.status,
            current_period_end: subscription.current_period_end,
            current_period_start: subscription.current_period_start,
            plan: {
              name: subscription.items.data[0]?.price?.nickname || customer.planType,
              amount: subscription.items.data[0]?.price?.unit_amount || 0
            }
          };
        }
      } catch (error) {
        logger.warn('Failed to get subscription info:', error);
      }
    }
    
    res.json({
      ...dashboardData,
      billing
    });
  } catch (error) {
    logger.error('Dashboard data error:', error);
    res.status(500).json({ error: 'Failed to load dashboard data' });
  }
});

// Create billing portal session
app.post('/api/create-portal-session', async (req, res) => {
  if (!stripeService || !customerManager) {
    return res.status(503).json({ error: 'Billing service not available' });
  }
  
  const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
  
  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }

  try {
    const customer = await customerManager.getCustomerByAPIKey(apiKey);
    
    if (!customer) {
      return res.status(401).json({ error: 'Invalid API key' });
    }
    
    const { returnUrl } = req.body;
    const portalUrl = returnUrl || `${process.env.DOMAIN}/dashboard?key=${customer.apiKey}`;
    
    const session = await stripeService.createPortalSession(
      customer.stripeCustomerId,
      portalUrl
    );
    
    res.json({ url: session.url });
  } catch (error) {
    logger.error('Portal session creation failed:', error);
    res.status(500).json({ error: 'Failed to create portal session' });
  }
});

// Get usage statistics
app.get('/api/usage', async (req, res) => {
  if (!stripeService || !customerManager) {
    return res.status(503).json({ error: 'Usage service not available' });
  }
  
  const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
  
  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }

  try {
    const customer = await customerManager.getCustomerByAPIKey(apiKey);
    
    if (!customer) {
      return res.status(401).json({ error: 'Invalid API key' });
    }
    
    const usageStats = await stripeService.getCustomerUsageStats(customer.stripeCustomerId);
    res.json(usageStats);
  } catch (error) {
    logger.error('Usage stats error:', error);
    res.status(500).json({ error: 'Failed to get usage statistics' });
  }
});

// =============== AUTHENTICATION ENDPOINTS (Updated with API Key Support) ===============

// Simple API key tracking middleware
const trackAPIUsage = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
  
  if (apiKey && customerManager) {
    try {
      const customer = await customerManager.getCustomerByAPIKey(apiKey);
      if (customer) {
        // Check usage limits
        const usageCheck = await customerManager.checkUsageLimits(apiKey);
        
        if (!usageCheck.allowed) {
          const statusCode = usageCheck.reason === 'Usage limit exceeded' ? 429 : 403;
          return res.status(statusCode).json({
            error: usageCheck.reason,
            message: usageCheck.reason === 'Usage limit exceeded' 
              ? `You have exceeded your monthly limit of ${usageCheck.limit} requests.`
              : usageCheck.reason
          });
        }
        
        // Log usage
        await customerManager.logUsage(customer.id, apiKey, req.path, req.ip, true);
        
        // Add usage headers
        res.set({
          'X-RateLimit-Limit': customer.usageLimit === -1 ? 'unlimited' : customer.usageLimit.toString(),
          'X-RateLimit-Used': customer.usageCount.toString(),
          'X-RateLimit-Remaining': customer.usageLimit === -1 ? 'unlimited' : Math.max(0, customer.usageLimit - customer.usageCount).toString()
        });
        
        req.customer = customer;
      }
    } catch (error) {
      logger.warn('API usage tracking error:', error);
    }
  }
  
  next();
};

app.post('/auth/request-code', trackAPIUsage, otpLimiter, async (req, res) => {
  const { email } = req.body || {};
  
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email address.' });
  }

  const code = generateCode();
  const hash = await bcrypt.hash(code, 10);
  await storeOtp(email.toLowerCase(), hash);

  const transporter = getTransporter();
  if (!transporter) {
    return res.status(500).json({ error: 'Email service not configured.' });
  }

  try {
    const templates = getEmailTemplates();
    const html = templates.html({ code, branding });
    const text = templates.text({ code, branding });
    
    await transporter.sendMail({
      from: process.env.MAIL_FROM || `"${branding.appName}" <${branding.supportEmail}>`,
      to: email,
      subject: `Your ${branding.appName} login code`,
      text,
      html
    });

    logger.info(`OTP sent to ${email}`);
    res.json({ message: 'OTP sent successfully' });
  } catch (err) {
    logger.error('Email sending error:', err);
    return res.status(500).json({ error: 'Failed to send verification email.' });
  }
});

app.post('/auth/verify-code', trackAPIUsage, async (req, res) => {
  const { email, code } = req.body || {};
  
  if (!email || !code) {
    return res.status(400).json({ error: 'Email and code are required.' });
  }

  const record = await fetchOtp(email.toLowerCase());
  if (!record) {
    return res.status(401).json({ error: 'Code expired or not found.' });
  }

  const match = await bcrypt.compare(code, record.hash);
  if (!match) {
    return res.status(401).json({ error: 'Invalid verification code.' });
  }

  const jwtSecret = process.env.JWT_SECRET || 'dev-secret-change-in-production';
  const token = jwt.sign(
    { sub: email, iat: Math.floor(Date.now() / 1000) }, 
    jwtSecret, 
    { expiresIn: '7d' }
  );
  
  logger.info(`User authenticated: ${email}`);
  res.json({ token, email });
});

app.get('/protected', (req, res) => {
  const auth = req.headers.authorization || '';
  const [, token] = auth.split(' ');
  
  if (!token) {
    return res.status(401).json({ error: 'Authorization token required.' });
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || 'dev-secret-change-in-production';
    const payload = jwt.verify(token, jwtSecret);
    res.json({ 
      ok: true, 
      user: payload.sub,
      expires: new Date(payload.exp * 1000).toISOString()
    });
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Export for Vercel
module.exports = app;
