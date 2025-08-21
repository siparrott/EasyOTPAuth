// api/send-otp.js
const nodemailer = require('nodemailer');
const { storeOTP, listStoredOTPs } = require('../utils/otp-store');

function need(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    let body = '';
    for await (const chunk of req) body += chunk;
    const { email } = body ? JSON.parse(body) : {};
    if (!email || !/.+@.+\..+/.test(email)) {
      return res.status(400).json({ error: 'Invalid email' });
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    
    // Store OTP using shared store
    storeOTP(email, code);

    // Skip email sending for now if SMTP is not configured
    let emailSent = false;
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth: { 
          user: process.env.SMTP_USER || 'test@example.com', 
          pass: process.env.SMTP_PASS || 'testpass'
        }
      });

      const from = process.env.MAIL_FROM || 'EasyOTPAuth <hello@easyotpauth.com>';
      const subject = 'Your Magic Code';
      const text = `Your EasyOTPAuth code is ${code}. It expires in 10 minutes.`;
      const html = `
        <div style="font-family:system-ui,Segoe UI,Roboto,Arial">
          <h2>EasyOTPAuth</h2>
          <p>Your sign-in code:</p>
          <div style="font-size:28px;font-weight:700;letter-spacing:6px">${code}</div>
          <p style="color:#555">Expires in 10 minutes.</p>
        </div>`;

      await transporter.sendMail({ from, to: email, subject, text, html });
      emailSent = true;
    } catch (emailError) {
      console.warn('⚠️  Email sending failed (SMTP not configured):', emailError.message);
      // Continue anyway for development
    }

    listStoredOTPs(); // Debug: show all stored OTPs
    console.log(`✅ OTP generated for ${email}: ${code} (Email sent: ${emailSent})`);
    
    res.status(200).json({ 
      success: true,
      message: emailSent ? 'OTP sent to your email' : 'OTP generated (check console for development)',
      developmentCode: process.env.NODE_ENV === 'development' ? code : undefined
    });
  } catch (err) {
    console.error('send-otp error:', err);
    res.status(500).json({ error: 'Failed to send', detail: String(err.message || err) });
  }
};

