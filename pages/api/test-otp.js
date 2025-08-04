// pages/api/test-otp.js
export default async function handler(req, res) {
  const testEmail = "siparrott@yahoo.co.uk"; // replace with your test address

  try {
    // Check if environment variables are wired in
    const smtpHost = process.env.SMTP_HOST;
    const smtpUser = process.env.SMTP_USER;
    const mailFrom = process.env.MAIL_FROM;
    const smtpPass = process.env.SMTP_PASS;
    const smtpPort = process.env.SMTP_PORT;

    if (!smtpHost || !smtpUser || !mailFrom || !smtpPass) {
      return res.status(500).json({ 
        error: "SMTP env variables missing or undefined.",
        missing: {
          SMTP_HOST: !smtpHost,
          SMTP_USER: !smtpUser,
          MAIL_FROM: !mailFrom,
          SMTP_PASS: !smtpPass,
          SMTP_PORT: !smtpPort
        }
      });
    }

    // Simulate your OTP function here — replace with your real logic if needed
    console.log("TESTING OTP SYSTEM...");
    console.log("SMTP HOST:", smtpHost);
    console.log("SMTP PORT:", smtpPort);
    console.log("SMTP USER:", smtpUser);
    console.log("MAIL FROM:", mailFrom);
    console.log("Sending test email to:", testEmail);

    // Test actual SMTP connection
    const nodemailer = require('nodemailer');
    
    const transporter = nodemailer.createTransporter({
      host: smtpHost,
      port: parseInt(smtpPort || '465'),
      secure: process.env.SMTP_SECURE !== 'false',
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });

    // Verify SMTP connection
    await transporter.verify();
    console.log("✅ SMTP connection verified");

    // Optionally send a real test email
    if (req.method === 'POST' && req.body?.sendEmail) {
      await transporter.sendMail({
        from: mailFrom,
        to: testEmail,
        subject: '🧪 EasyOTPAuth Test Email from Vercel',
        html: `
          <h2>🎯 EasyOTPAuth Vercel Test</h2>
          <p>This test email was sent from your Vercel deployment.</p>
          <p><strong>Test Time:</strong> ${new Date().toISOString()}</p>
          <p><strong>Environment:</strong> Vercel Production</p>
          <p>✅ SMTP configuration is working correctly!</p>
        `,
        text: 'EasyOTPAuth Vercel test - SMTP working correctly!'
      });

      return res.status(200).json({
        connected: true,
        smtpConfigured: true,
        emailSent: true,
        targetEmail: testEmail,
        message: "✅ SMTP connection verified and test email sent successfully!",
        config: {
          host: smtpHost,
          port: smtpPort,
          user: smtpUser,
          from: mailFrom
        }
      });
    }

    return res.status(200).json({
      connected: true,
      smtpConfigured: true,
      emailSent: false,
      targetEmail: testEmail,
      message: "✅ SMTP connection verified (no email sent - use POST with sendEmail:true to send test email)",
      config: {
        host: smtpHost,
        port: smtpPort,
        user: smtpUser,
        from: mailFrom
      }
    });

  } catch (err) {
    console.error("Test failed:", err);
    return res.status(500).json({ 
      error: "Server crashed while testing OTP system.",
      details: err.message,
      stack: err.stack
    });
  }
}
