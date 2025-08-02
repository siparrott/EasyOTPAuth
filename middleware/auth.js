const customerManager = require('../services/customerManager');
const logger = require('../utils/logger');

// Middleware to authenticate API key
const authenticateAPIKey = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
    
    if (!apiKey) {
      return res.status(401).json({ 
        error: 'API key required',
        message: 'Please provide an API key in the X-API-Key header or Authorization header'
      });
    }
    
    const customer = await customerManager.getCustomerByAPIKey(apiKey);
    
    if (!customer) {
      return res.status(401).json({ 
        error: 'Invalid API key',
        message: 'The provided API key is not valid'
      });
    }
    
    if (customer.status !== 'active') {
      return res.status(403).json({ 
        error: 'Account suspended',
        message: 'Your account has been suspended. Please contact support.'
      });
    }
    
    // Attach customer to request object
    req.customer = customer;
    req.apiKey = apiKey;
    
    next();
  } catch (error) {
    logger.error('API key authentication error:', error);
    res.status(500).json({ 
      error: 'Authentication error',
      message: 'Internal server error during authentication'
    });
  }
};

// Middleware to track usage and enforce limits
const trackUsage = async (req, res, next) => {
  try {
    const { customer, apiKey } = req;
    
    if (!customer) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Check usage limits
    const usageCheck = await customerManager.checkUsageLimits(apiKey);
    
    if (!usageCheck.allowed) {
      const statusCode = usageCheck.reason === 'Usage limit exceeded' ? 429 : 403;
      
      return res.status(statusCode).json({
        error: usageCheck.reason,
        message: usageCheck.reason === 'Usage limit exceeded' 
          ? `You have exceeded your monthly limit of ${usageCheck.limit} requests. Please upgrade your plan or wait for the next billing cycle.`
          : usageCheck.reason,
        usage: usageCheck.limit ? {
          current: usageCheck.current,
          limit: usageCheck.limit,
          percentage: Math.round((usageCheck.current / usageCheck.limit) * 100)
        } : undefined
      });
    }
    
    // Log the API usage
    await customerManager.logUsage(
      customer.id,
      apiKey,
      req.path,
      req.ip || req.connection.remoteAddress,
      true
    );
    
    // Add usage info to response headers
    res.set({
      'X-RateLimit-Limit': customer.usageLimit === -1 ? 'unlimited' : customer.usageLimit.toString(),
      'X-RateLimit-Used': customer.usageCount.toString(),
      'X-RateLimit-Remaining': customer.usageLimit === -1 ? 'unlimited' : Math.max(0, customer.usageLimit - customer.usageCount).toString()
    });
    
    next();
  } catch (error) {
    logger.error('Usage tracking error:', error);
    
    // Log failed request
    if (req.customer) {
      await customerManager.logUsage(
        req.customer.id,
        req.apiKey,
        req.path,
        req.ip || req.connection.remoteAddress,
        false
      );
    }
    
    res.status(500).json({ 
      error: 'Usage tracking error',
      message: 'Internal server error during usage tracking'
    });
  }
};

// Middleware for optional API key (doesn't block if missing)
const optionalAPIKey = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
    
    if (apiKey) {
      const customer = await customerManager.getCustomerByAPIKey(apiKey);
      if (customer && customer.status === 'active') {
        req.customer = customer;
        req.apiKey = apiKey;
      }
    }
    
    next();
  } catch (error) {
    logger.error('Optional API key check error:', error);
    // Don't block the request, just continue
    next();
  }
};

// Middleware to require specific plan types
const requirePlan = (allowedPlans) => {
  return (req, res, next) => {
    const { customer } = req;
    
    if (!customer) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'This endpoint requires authentication'
      });
    }
    
    if (!allowedPlans.includes(customer.planType)) {
      return res.status(403).json({
        error: 'Plan upgrade required',
        message: `This feature requires a ${allowedPlans.join(' or ')} plan. Your current plan: ${customer.planType}`,
        currentPlan: customer.planType,
        requiredPlans: allowedPlans
      });
    }
    
    next();
  };
};

// Middleware to add CORS headers for API
const corsMiddleware = (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-API-Key');
  res.header('Access-Control-Expose-Headers', 'X-RateLimit-Limit, X-RateLimit-Used, X-RateLimit-Remaining');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
};

module.exports = {
  authenticateAPIKey,
  trackUsage,
  optionalAPIKey,
  requirePlan,
  corsMiddleware
};
