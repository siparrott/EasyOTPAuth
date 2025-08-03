import nodemailer from "nodemailer";

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

    if (req.method !== "POST") {
      return res.status(405).json({ success: false, error: "Method not allowed" });
    }

    // Validate request body
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ success: false, error: "Invalid request body" });
    }

    const { email } = req.body;

    // Validate email
    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, error: "Valid email is required" });
    }

    // Check SMTP configuration first
    const requiredEnvVars = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.error('Missing SMTP environment variables:', missingVars);
      return res.status(500).json({ 
        success: false, 
        error: "Email service not configured. Missing environment variables: " + missingVars.join(', ')
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000); // 6-digit OTP

    // Store OTP in global memory for demo (replace with Redis/DB in production)
    if (!global.otpStore) {
      global.otpStore = new Map();
    }
    
    // Store with expiration (10 minutes)
    global.otpStore.set(email.toLowerCase(), {
      otp: otp.toString(),
      expires: Date.now() + 10 * 60 * 1000 // 10 minutes
    });

    console.log(`🔄 Attempting to send OTP to: ${email}`);
    console.log(`📧 SMTP Config: ${process.env.SMTP_HOST}:${process.env.SMTP_PORT || 465}`);

    try {
      const transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 465,
        secure: process.env.SMTP_SECURE === 'true' || true,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
        debug: process.env.NODE_ENV === 'development',
        logger: process.env.NODE_ENV === 'development'
      });

      // Verify transporter configuration
      await transporter.verify();
      console.log('✅ SMTP connection verified');

      const mailResult = await transporter.sendMail({
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

      console.log(`✅ OTP sent to ${email}. MessageID: ${mailResult.messageId}`);
      return res.status(200).json({ 
        success: true, 
        message: "OTP sent successfully",
        messageId: mailResult.messageId 
      });

    } catch (emailError) {
      console.error('❌ Email sending failed:', {
        message: emailError.message,
        code: emailError.code,
        command: emailError.command,
        response: emailError.response,
        responseCode: emailError.responseCode
      });

      // Return specific error messages based on error type
      let errorMessage = "Failed to send email";
      
      if (emailError.code === 'EAUTH') {
        errorMessage = "Email authentication failed. Please check SMTP credentials.";
      } else if (emailError.code === 'ECONNECTION') {
        errorMessage = "Could not connect to email server. Please check SMTP settings.";
      } else if (emailError.code === 'EMESSAGE') {
        errorMessage = "Email message format error.";
      } else if (emailError.responseCode >= 500) {
        errorMessage = "Email server error. Please try again later.";
      } else if (emailError.responseCode >= 400) {
        errorMessage = "Email rejected by server. Please check the email address.";
      }

      return res.status(500).json({ 
        success: false, 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? emailError.message : undefined
      });
    }

  } catch (globalError) {
    console.error('❌ Unexpected error in send-otp handler:', globalError);
    return res.status(500).json({ 
      success: false, 
      error: "Internal server error",
      details: process.env.NODE_ENV === 'development' ? globalError.message : undefined
    });
  }
}
