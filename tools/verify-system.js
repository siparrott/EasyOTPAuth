// tools/verify-system.js
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');

(async () => {
  console.log("🔍 EasyOTPAuth SYSTEM VERIFICATION START");

  // 1. ENV CHECK
  const required = [
    'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY',
    'MAIL_FROM', 'SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'
  ];
  console.log("\n🔐 Checking Environment Variables...");
  for (let key of required) {
    if (!process.env[key]) {
      return console.error(`❌ ENV MISSING: ${key}`);
    }
    console.log(`✅ ${key} exists`);
  }

  // 2. SUPABASE DB CONNECTIVITY
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const testEmail = 'diagnostic@example.com';
  console.log("\n🔌 Testing Supabase DB insert...");
  const { data, error } = await supabase
    .from('otp_codes')
    .insert([{ email: testEmail, code: '999999', created_at: new Date().toISOString() }]);

  if (error) return console.error("❌ Supabase insert error:", error);
  console.log("✅ Supabase insert success:", data);

  // 3. EMAIL / SMTP TEST
  console.log("\n📨 Testing SMTP email delivery...");
  const transporter = nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  try {
    const result = await transporter.sendMail({
      from: `"EasyOTPAuth" <${process.env.MAIL_FROM}>`,
      to: 'siparrott@yahoo.co.uk', // your real inbox
      subject: 'Test Magic Code',
      text: `Your magic login code is: 999999`
    });
    console.log("✅ Test email sent:", result.messageId);
  } catch (err) {
    console.error("❌ Failed to send email:", err);
  }

  console.log("\n✅ System check complete.\nIf no ❌ errors above, OTP flow is working.");
})();
