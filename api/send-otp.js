import nodemailer from "nodemailer";

export default async function handler(req, res) {
  // Enable CORS for client integration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const { email } = req.body;

  // Validate email
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false, error: "Valid email is required" });
  }

  const otp = Math.floor(100000 + Math.random() * 900000); // 6-digit OTP

  // Store OTP in global memory for demo (replace with Redis/DB in production)
  if (!global.otpStore) {
    global.otpStore = new Map();
  }
  
  // Store with expiration (10 minutes)
  global.otpStore.set(email, {
    otp: otp.toString(),
    expires: Date.now() + 10 * 60 * 1000 // 10 minutes
  });

  try {
    // Check if SMTP is configured
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      return res.status(500).json({ 
        success: false, 
        error: "Email service not configured. Please set SMTP environment variables." 
      });
    }

    const transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 465,
      secure: process.env.SMTP_SECURE === 'true' || true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Verify transporter configuration
    await transporter.verify();

    await transporter.sendMail({
      from: process.env.MAIL_FROM || `"EasyOTPAuth" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Your EasyOTPAuth Login Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Your EasyOTPAuth Login Code</h2>
          <p>Use this code to complete your authentication:</p>
          <div style="background: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
            <span style="font-size: 32px; font-weight: bold; color: #1f2937; letter-spacing: 4px;">${otp}</span>
          </div>
          <p style="color: #6b7280;">This code will expire in 10 minutes.</p>
          <p style="color: #6b7280; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
        </div>
      `,
      text: `Your EasyOTPAuth login code is: ${otp}. This code expires in 10 minutes.`,
    });

    console.log(`OTP sent to ${email}: ${otp}`);
    res.status(200).json({ success: true, message: "OTP sent successfully" });
  } catch (error) {
    console.error("Email sending error:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to send email. Please check your email configuration." 
    });
  }
}
