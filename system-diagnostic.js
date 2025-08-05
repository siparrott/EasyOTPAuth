/**
 * ✅ EasyOTPAuth Full System Diagnostic Tool
 * Tests: Env vars, Supabase connection, Tables, Email, Demo Auth flow
 */

const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');
const fetch = require('node-fetch');
require('dotenv').config();

(async () => {
  console.log('\n✅ Running EasyOTPAuth System Diagnostic Tool...');
  console.log('============================================\n');

  const requiredEnv = [
    'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY',
    'MAIL_FROM', 'SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'
  ];

  console.log('🔍 Checking environment variables...');
  let hasError = false;
  for (const key of requiredEnv) {
    const value = process.env[key];
    if (!value) {
      console.error(`❌ Missing environment variable: ${key}`);
      hasError = true;
    } else if (value.includes('YOUR_') || value.includes('your-')) {
      console.warn(`⚠️ Placeholder detected in ${key}`);
    } else {
      console.log(`✅ ${key} OK`);
    }
  }

  // ✅ Supabase connection
  console.log('\n🔗 Testing Supabase connection...');
  try {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      global: {
        fetch: fetch
      }
    });
    const { data, error } = await supabase.from('otps').select('*').limit(1);
    if (error) throw error;
    console.log('✅ Supabase connected & table query succeeded');
  } catch (err) {
    console.error('❌ Supabase connection failed:', err.message);
    hasError = true;
  }

  // ✅ SMTP Email test
  console.log('\n📧 Testing email transport...');
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    await transporter.verify();
    console.log('✅ SMTP email verified');
  } catch (err) {
    console.error('❌ SMTP email failed:', err.message);
    hasError = true;
  }

  // ✅ API check
  console.log('\n🌐 Testing OTP API endpoint...');
  try {
    const res = await fetch('http://localhost:3000/api/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com' })
    });
    const json = await res.json();
    if (res.ok) {
      console.log('✅ OTP API responded OK:', json);
    } else {
      console.error('❌ OTP API failed:', json);
      hasError = true;
    }
  } catch (err) {
    console.error('❌ OTP API not reachable:', err.message);
    hasError = true;
  }

  console.log('\n🎯 Test complete.');
  if (hasError) {
    console.log('❌ Issues found during diagnostics.');
    process.exit(1);
  } else {
    console.log('✅ All systems operational.');
    process.exit(0);
  }
})();
