const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');

// In-memory storage for demo (replace with database in production)
const customers = new Map();
const usageLogs = new Map();

class CustomerManager {
  // Create a new customer
  async createCustomer({ stripeCustomerId, email, planType, status = 'active' }) {
    const customerId = uuidv4();
    const apiKey = await this.generateAPIKey(customerId);
    
    const customer = {
      id: customerId,
      stripeCustomerId,
      email,
      planType,
      status,
      apiKey,
      usageCount: 0,
      usageLimit: this.getUsageLimit(planType),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    customers.set(customerId, customer);
    logger.info(`Created customer: ${customerId} (${email}) on ${planType} plan`);
    
    return customer;
  }
  
  // Generate unique API key
  async generateAPIKey(customerId, planType) {
    const prefix = planType ? planType.substring(0, 3).toUpperCase() : 'API';
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 15);
    const hash = await bcrypt.hash(`${customerId}-${timestamp}`, 8);
    const shortHash = hash.replace(/[^a-zA-Z0-9]/g, '').substring(0, 8);
    
    return `${prefix}_${timestamp}_${random}_${shortHash}`;
  }
  
  // Get usage limit based on plan
  getUsageLimit(planType) {
    const limits = {
      starter: 1000,
      professional: 10000,
      enterprise: -1 // Unlimited
    };
    return limits[planType] || 1000;  
  }
  
  // Get customer by API key
  async getCustomerByAPIKey(apiKey) {
    for (const customer of customers.values()) {
      if (customer.apiKey === apiKey) {
        return customer;
      }
    }
    return null;
  }
  
  // Get customer by email
  async getCustomerByEmail(email) {
    for (const customer of customers.values()) {
      if (customer.email === email) {
        return customer;
      }
    }
    return null;
  }
  
  // Get customer by Stripe customer ID
  async getCustomerByStripeId(stripeCustomerId) {
    for (const customer of customers.values()) {
      if (customer.stripeCustomerId === stripeCustomerId) {
        return customer;
      }
    }
    return null;
  }
  
  // Set usage limits
  async setUsageLimits(apiKey, limits) {
    const customer = await this.getCustomerByAPIKey(apiKey);
    if (customer) {
      customer.usageLimit = limits.maxAuthentications;
      customer.updatedAt = new Date();
      customers.set(customer.id, customer);
      return customer;
    }
    return null;
  }
  
  // Log API usage
  async logUsage(customerId, apiKey, endpoint, ipAddress, success = true) {
    const logId = uuidv4();
    const logEntry = {
      id: logId,
      customerId,
      apiKey,
      endpoint,
      ipAddress,
      timestamp: new Date(),
      success
    };
    
    usageLogs.set(logId, logEntry);
    
    // Also increment usage counter
    await this.incrementUsage(customerId);
    
    return logEntry;
  }
  
  // Increment usage counter
  async incrementUsage(customerId) {
    const customer = customers.get(customerId);
    if (customer) {
      customer.usageCount += 1;
      customer.updatedAt = new Date();
      customers.set(customerId, customer);
    }
  }
  
  // Check if customer has exceeded usage limits
  async checkUsageLimits(apiKey) {
    const customer = await this.getCustomerByAPIKey(apiKey);
    if (!customer) {
      return { allowed: false, reason: 'Invalid API key' };
    }
    
    if (customer.status !== 'active') {
      return { allowed: false, reason: 'Account suspended' };
    }
    
    if (customer.usageLimit !== -1 && customer.usageCount >= customer.usageLimit) {
      return { 
        allowed: false, 
        reason: 'Usage limit exceeded',
        limit: customer.usageLimit,
        current: customer.usageCount
      };
    }
    
    return { allowed: true, customer };
  }
  
  // Get customer dashboard data
  async getDashboardData(customerId) {
    const customer = customers.get(customerId);
    if (!customer) return null;
    
    // Get usage logs for this customer
    const customerLogs = Array.from(usageLogs.values())
      .filter(log => log.customerId === customerId)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 100); // Last 100 requests
    
    return {
      customer: {
        id: customer.id,
        email: customer.email,
        planType: customer.planType,
        status: customer.status,
        createdAt: customer.createdAt
      },
      usage: {
        current: customer.usageCount,
        limit: customer.usageLimit,
        percentage: customer.usageLimit === -1 ? 0 : (customer.usageCount / customer.usageLimit) * 100
      },
      recentActivity: customerLogs.slice(0, 10),
      apiKey: customer.apiKey
    };
  }
  
  // Update customer plan
  async updateCustomerPlan(customerId, newPlanType) {
    const customer = customers.get(customerId);
    if (customer) {
      customer.planType = newPlanType;
      customer.usageLimit = this.getUsageLimit(newPlanType);
      customer.updatedAt = new Date();
      customers.set(customerId, customer);
      
      logger.info(`Updated customer ${customerId} to ${newPlanType} plan`);
      return customer;
    }
    return null;
  }
  
  // Deactivate customer (subscription cancelled)
  async deactivateCustomer(customerId) {
    const customer = customers.get(customerId);
    if (customer) {
      customer.status = 'cancelled';
      customer.updatedAt = new Date();
      customers.set(customerId, customer);
      
      logger.info(`Deactivated customer: ${customerId}`);
      return customer;
    }
    return null;
  }
  
  // Get all customers (admin)
  async getAllCustomers() {
    return Array.from(customers.values());
  }
  
  // Reset usage counts (monthly reset)
  async resetUsageCounts() {
    const resetCount = customers.size;
    for (const customer of customers.values()) {
      customer.usageCount = 0;
      customer.updatedAt = new Date();
      customers.set(customer.id, customer);
    }
    
    logger.info(`Reset usage counts for ${resetCount} customers`);
    return resetCount;
  }
}

module.exports = new CustomerManager();
