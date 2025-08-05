import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required' });
  }

  try {
    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Create a beautiful HTML email
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Magic Login Code</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 20px; background: #f8f9fa; }
            .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-align: center; padding: 40px 20px; }
            .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
            .header p { margin: 10px 0 0; opacity: 0.9; }
            .content { padding: 40px 30px; text-align: center; }
            .otp-code { font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #667eea; background: #f8f9ff; padding: 20px; border-radius: 12px; border: 2px solid #e0e7ff; margin: 30px 0; }
            .message { color: #4b5563; line-height: 1.6; margin-bottom: 30px; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
            .security-note { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 20px 0; font-size: 14px; color: #92400e; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🔐 Magic Login Code</h1>
                <p>Your secure access code is ready</p>
            </div>
            <div class="content">
                <div class="otp-code">${otp}</div>
                <div class="message">
                    Enter this 6-digit code to complete your sign-in to <strong>EasyOTPAuth</strong>. 
                    This code will expire in 10 minutes for security.
                </div>
                <div class="security-note">
                    🛡️ <strong>Security Note:</strong> Never share this code with anyone. 
                    We will never ask for your code via phone or email.
                </div>
            </div>
            <div class="footer">
                If you didn't request this code, please ignore this email.<br>
                <strong>EasyOTPAuth</strong> - Passwordless Authentication Made Simple
            </div>
        </div>
    </body>
    </html>`;

    await transporter.sendMail({
      from: process.env.MAIL_FROM,
      to: email,
      subject: `Your login code: ${otp}`,
      html: htmlContent,
      text: `Your EasyOTPAuth login code is: ${otp}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this code, please ignore this email.`
    });

    // In a real app, you'd store the OTP in a database with expiration
    console.log(`✅ OTP sent to ${email}: ${otp}`);

    return res.status(200).json({ success: true, message: 'Magic code sent successfully!' });
  } catch (error) {
    console.error('❌ Email send error:', error);
    return res.status(500).json({ success: false, message: 'Failed to send magic code. Please try again.' });
  }
}
