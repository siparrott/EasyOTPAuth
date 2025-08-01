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
      appName: "RapidAuth.pro",
      logoUrl: "https://i.postimg.cc/Qx8C6tgQ/Chat-GPT-Image-Jun-19-2025-02-30-24-PM.png",
      supportEmail: "support@rapidauth.pro"
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
app.use('/public', express.static(path.join(process.cwd(), 'public')));

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
  
  return nodemailer.createTransporter({
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

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    branding,
    timestamp: new Date().toISOString(),
    environment: process.env.VERCEL_ENV || 'development'
  });
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

app.post('/auth/request-code', otpLimiter, async (req, res) => {
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

app.post('/auth/verify-code', async (req, res) => {
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
