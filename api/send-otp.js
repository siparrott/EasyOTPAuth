// api/send-otp.js
const nodemailer = require('nodemailer');

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

    const transporter = nodemailer.createTransport({
      host: need('SMTP_HOST'),
      port: Number(need('SMTP_PORT')),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: need('SMTP_USER'), pass: need('SMTP_PASS') }
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

    // TODO: persist { email, code, expiresAt } to DB/Redis for real verification
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('send-otp error:', err);
    res.status(500).json({ error: 'Failed to send', detail: String(err.message || err) });
  }
};

