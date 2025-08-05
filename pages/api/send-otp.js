import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required' });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.MAIL_FROM,
      to: email,
      subject: 'Your Magic Login Link',
      html: '<p>Here is your magic link or one-time code. Please follow the link or enter the code on the website to log in securely.</p>',
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('❌ Email send error:', error);
    return res.status(500).json({ success: false, message: 'Email send failed' });
  }
}
