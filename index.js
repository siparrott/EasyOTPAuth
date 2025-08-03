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

const branding = JSON.parse(fs.readFileSync(path.join(__dirname, 'branding.json'), 'utf8'));

const logger = winston.createLogger({
  level: 'info',
  transports: [
    new winston.transports.Console({ stderrLevels: ['error'] })
  ]
});

// licensing check
if (process.env.LICENSE_KEYS) {
  const valid = process.env.LICENSE_KEYS.split(',');
  if (!valid.includes(process.env.LICENSE)) {
    logger.error('❌ Invalid license');
    process.exit(1);
  }
}

const app = express();
app.use(express.json());
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use(morgan('combined'));

let redisClient;
if (process.env.REDIS_URL) {
  redisClient = createClient({ url: process.env.REDIS_URL });
  redisClient.connect().catch(err => logger.error('Redis error', err));
}

// In-memory OTP store fallback
const otps = new Map();

const storeOtp = async (email, hash) => {
  if (redisClient) {
    await redisClient.set(`otp:${email}`, hash, { EX: 600 });
  } else {
    otps.set(email, { hash, expires: Date.now() + 600000 });
  }
};

const fetchOtp = async (email) => {
  if (redisClient) {
    const hash = await redisClient.get(`otp:${email}`);
    await redisClient.del(`otp:${email}`);
    return hash ? { hash } : null;
  }
  const record = otps.get(email);
  if (!record || Date.now() > record.expires) return null;
  otps.delete(email);
  return record;
};

// Rate limiter
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => (req.body && req.body.email) || req.ip,
  message: { error: 'Too many OTP requests. Please try again later.' }
});

// Mail transport
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const htmlTemplateSrc = fs.readFileSync(path.join(__dirname, 'templates/email/otp.html.hbs'), 'utf8');
const textTemplateSrc = fs.readFileSync(path.join(__dirname, 'templates/email/otp.txt.hbs'), 'utf8');
const otpHtmlTemplate = hbs.compile(htmlTemplateSrc);
const otpTextTemplate = hbs.compile(textTemplateSrc);

const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

// Serve homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve email test page
app.get('/email-test', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'email-test.html'));
});

// Serve personal test page
app.get('/personal-test', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'personal-test.html'));
});

// Serve E2E test page
app.get('/e2e-test', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'e2e-test.html'));
});

// Serve client demo page
app.get('/client-demo', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'client-demo.html'));
});

// Serve client integration script with proper MIME type
app.get('/client-integration.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.sendFile(path.join(__dirname, 'client-integration.js'));
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', branding });
});

// Diagnostic endpoint for email configuration
app.get('/email-config-test', (req, res) => {
  const config = {
    smtp_host: process.env.SMTP_HOST ? 'configured' : 'missing',
    smtp_port: process.env.SMTP_PORT ? process.env.SMTP_PORT : 'missing',
    smtp_secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE : 'missing',
    smtp_user: process.env.SMTP_USER ? 'configured' : 'missing',
    smtp_pass: process.env.SMTP_PASS ? 'configured' : 'missing',
    mail_from: process.env.MAIL_FROM ? process.env.MAIL_FROM : 'missing'
  };
  
  res.json({
    status: 'Email configuration check',
    config,
    issues: Object.entries(config).filter(([key, value]) => value === 'missing').map(([key]) => key)
  });
});

// Email test endpoint
app.post('/test-email', async (req, res) => {
  const { email } = req.body || {};
  
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return res.status(400).json({ error: 'Valid email required.' });
  }

  try {
    // Test SMTP connection first
    await transporter.verify();
    logger.info('SMTP connection verified successfully');
    
    // Send test email
    const result = await transporter.sendMail({
      from: process.env.MAIL_FROM || '"EasyOTPAuth" <hello@easyotpauth.com>',
      to: email,
      subject: 'EasyOTPAuth - Email Test',
      html: `
        <h2>Email Configuration Test</h2>
        <p>If you received this email, your SMTP configuration is working correctly!</p>
        <p>Timestamp: ${new Date().toISOString()}</p>
        <p>Server: ${process.env.SMTP_HOST || 'Not configured'}</p>
      `,
      text: `EasyOTPAuth Email Test - If you received this, SMTP is working! Timestamp: ${new Date().toISOString()}`
    });
    
    logger.info('Test email sent successfully:', result.messageId);
    res.json({ 
      success: true, 
      message: 'Test email sent successfully',
      messageId: result.messageId 
    });
    
  } catch (err) {
    logger.error('Email test failed:', err);
    res.status(500).json({ 
      error: 'Email test failed',
      details: {
        message: err.message,
        code: err.code,
        command: err.command,
        response: err.response
      }
    });
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
    logger.error(err);
    res.status(500).json({ error: 'Activation failed' });
  });

  request.write(data);
  request.end();
});

app.post('/auth/request-code', otpLimiter, async (req, res) => {
  const { email } = req.body || {};
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email.' });
  }
  const code = generateCode();
  const hash = await bcrypt.hash(code, 10);
  await storeOtp(email.toLowerCase(), hash);

  try {
    const html = otpHtmlTemplate({ code, branding });
    const text = otpTextTemplate({ code, branding });
    
    // Log email configuration for debugging
    logger.info(`Attempting to send email to: ${email}`);
    logger.info(`SMTP Host: ${process.env.SMTP_HOST || 'undefined'}`);
    logger.info(`SMTP Port: ${process.env.SMTP_PORT || 'undefined'}`);
    logger.info(`SMTP User: ${process.env.SMTP_USER || 'undefined'}`);
    logger.info(`Mail From: ${process.env.MAIL_FROM || `"${branding.appName}" <${branding.supportEmail}>`}`);
    
    await transporter.sendMail({
      from: process.env.MAIL_FROM || `"${branding.appName}" <${branding.supportEmail}>`,
      to: email,
      subject: `Your ${branding.appName} login code`,
      text,
      html
    });
    
    logger.info(`Email sent successfully to: ${email}`);
  } catch (err) {
    logger.error('Email sending failed:', err);
    logger.error('Error details:', {
      message: err.message,
      code: err.code,
      command: err.command,
      response: err.response
    });
    return res.status(500).json({ 
      error: 'Failed to send email.',
      details: process.env.NODE_ENV === 'development' ? err.message : 'Email service configuration error'
    });
  }

  res.json({ message: 'sent' });
});

app.post('/auth/verify-code', async (req, res) => {
  const { email, code } = req.body || {};
  if (!email || !code) return res.status(400).json({ error: 'Required.' });

  const record = await fetchOtp(email.toLowerCase());
  if (!record) {
    return res.status(401).json({ error: 'Code expired or not found.' });
  }

  const match = await bcrypt.compare(code, record.hash);
  if (!match) return res.status(401).json({ error: 'Invalid code.' });

  const token = jwt.sign({ sub: email }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });
  res.json({ token });
});

app.get('/protected', (req, res) => {
  const auth = req.headers.authorization || '';
  const [, token] = auth.split(' ');
  try {
    jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    res.json({ ok: true });
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

// New API endpoints for client integration
app.post('/api/send-otp', otpLimiter, async (req, res) => {
  try {
    const { email } = req.body || {};
    
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'application/json');
    
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return res.status(400).json({ success: false, error: 'Invalid email address.' });
    }

    const code = generateCode();
    const hash = await bcrypt.hash(code, 10);
    await storeOtp(email.toLowerCase(), hash);

    try {
      const html = otpHtmlTemplate({ code, branding });
      const text = otpTextTemplate({ code, branding });
      
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
        error: 'Failed to send verification email.',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  } catch (globalError) {
    logger.error('Global error in /api/send-otp:', globalError);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? globalError.message : undefined
    });
  }
});

app.post('/api/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body || {};
    
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'application/json');
    
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

    const token = jwt.sign(
      { 
        email: email.toLowerCase(), 
        authenticated: true,
        timestamp: Date.now()
      }, 
      process.env.JWT_SECRET || 'dev-secret', 
      { expiresIn: '7d' }
    );
    
    logger.info(`User authenticated: ${email}`);
    res.json({ 
      success: true, 
      message: 'Authentication successful',
      token, 
      user: {
        email: email.toLowerCase(),
        authenticated: true
      }
    });
  } catch (globalError) {
    logger.error('Global error in /api/verify-otp:', globalError);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? globalError.message : undefined
    });
  }
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

// Global error handler for API routes
app.use('/api/*', (err, req, res, next) => {
  console.error('API Error:', err);
  
  // Ensure CORS headers are set
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  // Don't expose internal errors in production
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message;
  
  res.status(500).json({
    success: false,
    error: message,
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Global 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  res.status(404).json({
    success: false,
    error: 'API endpoint not found',
    path: req.path
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => logger.info(`🚀 Server running on http://localhost:${PORT}`));