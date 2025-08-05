// File: scripts/send-otp-debug.js

require('dotenv').config();
const nodemailer = require('nodemailer');

// Step 1: Load SMTP credentials from .env
const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  MAIL_FROM
} = process.env;

// Step 2: Create nodemailer transporter
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT),
  secure: true, // use TLS
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

// Step 3: Generate random 6-digit OTP
const otp = Math.floor(100000 + Math.random() * 900000).toString();

// Step 4: Compose test message
const mailOptions = {
  from: MAIL_FROM,
  to: 'siparrott@yahoo.co.uk', // You can replace with your test email
  subject: 'EasyOTP Test Code',
  text: `Your OTP code is: ${otp}`,
};

// Step 5: Send and log results
transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    console.error('❌ OTP Email Failed:', error);
  } else {
    console.log('✅ OTP Email Sent:', info.response);
    console.log('👉 Sent Code:', otp);
  }
});
