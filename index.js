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

app.get('/health', (req, res) => {
  res.json({ status: 'ok', branding });
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
    await transporter.sendMail({
      from: process.env.MAIL_FROM || `"${branding.appName}" <${branding.supportEmail}>`,
      to: email,
      subject: `Your ${branding.appName} login code`,
      text,
      html
    });
  } catch (err) {
    logger.error(err);
    return res.status(500).json({ error: 'Failed to send email.' });
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => logger.info(`🚀 Server running on http://localhost:${PORT}`));