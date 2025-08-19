import nodemailer from "nodemailer";
import { otpStore } from "../utils/supabase-otp.js";

export default async function handler(req, res) {
  try {
    // Enable CORS for client integration
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'OPTIONS') {
      return res.status(200).json({ success: true });
    }

const nodemailer = require('nodemailer');

function required(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { email } = req.body || {};
    if (!email || !/.+@.+\..+/.test(email)) {
      return res.status(400).json({ error: 'Invalid email' });
    }

    // Generate a 6-digit code
    const code = String(Math.floor(100000 + Math.random() * 900000));

    // SMTP transport (Easyname)
    const transporter = nodemailer.createTransport({
      host: required('SMTP_HOST'),               // smtp.easyname.com
      port: Number(required('SMTP_PORT')),       // 587
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: required('SMTP_USER'),             // mailbox ID, e.g. 30840mail16
        pass: required('SMTP_PASS')
      }
    });

    const from = process.env.MAIL_FROM || 'EasyOTPAuth <hello@easyotpauth.com>';

    const text = `Your EasyOTPAuth code is ${code}. It expires in 10 minutes.`;
    const html = `
      <div style="font-family:system-ui,Segoe UI,Roboto,Arial">
        <h2>EasyOTPAuth</h2>
        <p>Your sign-in code:</p>
        <div style="font-size:28px;font-weight:700;letter-spacing:6px">${code}</div>
        <p style="color:#555">Expires in 10 minutes.</p>
      </div>
    `;

    await transporter.sendMail({
      from, to: email, subject: 'Your Magic Code', text, html
    });

    // Optionally: store code in a cache/DB tied to the email.
    // For now, return it so you can wire your verify step (remove in prod).
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('send-otp error:', err);
    return res.status(500).json({ error: 'Failed to send', detail: String(err.message || err) });
  }
};
}
