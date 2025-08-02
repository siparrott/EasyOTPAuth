const winston = require('winston');

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'easyotpauth' },
  transports: [
    // Console transport for all environments
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// In production, you might want to add file logging or external services
if (process.env.NODE_ENV === 'production') {
  // Add production logging transports here if needed
  // Example: Sentry, LogRocket, file logging, etc.
}

module.exports = logger;
