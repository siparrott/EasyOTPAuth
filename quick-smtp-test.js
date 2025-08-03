/**
 * Quick SMTP Test - Following Checklist Item 4
 * Tests email sending independently
 */

const nodemailer = require('nodemailer');
const fs = require('fs');

async function testEmailSending() {
  console.log('📧 SMTP Email Sending Test');
  console.log('===========================\n');

  // Read .env file manually
  let envVars = {};
  try {
    const envContent = fs.readFileSync('.env', 'utf8');
    const lines = envContent.split('\n');
    
    lines.forEach(line => {
      if (line.trim() && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          envVars[key.trim()] = valueParts.join('=').trim().replace(/"/g, '');
        }
      }
    });
  } catch (error) {
    console.log('❌ Could not read .env file:', error.message);
    return;
  }

  // Check SMTP configuration
  console.log('🔍 SMTP Configuration Check:');
  console.log(`   Host: ${envVars.SMTP_HOST || 'NOT SET'}`);
  console.log(`   Port: ${envVars.SMTP_PORT || 'NOT SET'}`);
  console.log(`   User: ${envVars.SMTP_USER || 'NOT SET'}`);
  console.log(`   Pass: ${envVars.SMTP_PASS ? '[SET]' : 'NOT SET'}`);
  console.log(`   From: ${envVars.MAIL_FROM || 'NOT SET'}\n`);

  // Check for placeholder values
  if (!envVars.SMTP_HOST || !envVars.SMTP_USER || !envVars.SMTP_PASS) {
    console.log('❌ Missing SMTP configuration');
    console.log('💡 Update .env file with real SMTP credentials\n');
    return;
  }

  if (envVars.SMTP_USER.includes('YOUR_') || envVars.SMTP_PASS.includes('YOUR_')) {
    console.log('❌ SMTP credentials contain placeholder values');
    console.log('💡 Replace YOUR_SMTP_USERNAME and YOUR_SMTP_PASSWORD with real values\n');
    
    console.log('🔧 How to get SMTP credentials:');
    console.log('   1. Gmail: Use App Passwords (not regular password)');
    console.log('   2. Outlook: Use account password or App Password');
    console.log('   3. Custom SMTP: Get from your hosting provider');
    console.log('   4. SendGrid/Mailgun: Get API credentials\n');
    return;
  }

  // Test SMTP connection
  console.log('🧪 Testing SMTP connection...');
  
  try {
    const transporter = nodemailer.createTransporter({
      host: envVars.SMTP_HOST,
      port: parseInt(envVars.SMTP_PORT) || 465,
      secure: envVars.SMTP_SECURE === 'true' || true,
      auth: {
        user: envVars.SMTP_USER,
        pass: envVars.SMTP_PASS,
      },
      debug: true, // Enable debug logging
      logger: true  // Enable logger
    });

    // Verify connection
    await transporter.verify();
    console.log('✅ SMTP connection successful!\n');

    // Send test email
    console.log('📨 Sending test email...');
    
    const testOTP = '123456';
    const testEmail = envVars.SMTP_USER; // Send to self for testing
    
    const result = await transporter.sendMail({
      from: envVars.MAIL_FROM || `"EasyOTPAuth Test" <${envVars.SMTP_USER}>`,
      to: testEmail,
      subject: 'EasyOTPAuth - SMTP Test',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">🧪 SMTP Test Successful!</h2>
          <p>Your SMTP configuration is working correctly.</p>
          <div style="background: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
            <span style="font-size: 24px; font-weight: bold; color: #1f2937;">Test OTP: ${testOTP}</span>
          </div>
          <p style="color: #6b7280;">Timestamp: ${new Date().toISOString()}</p>
          <p style="color: #6b7280;">Server: ${envVars.SMTP_HOST}</p>
        </div>
      `,
      text: `EasyOTPAuth SMTP Test - Your configuration is working! Test OTP: ${testOTP}`
    });

    console.log('✅ Test email sent successfully!');
    console.log(`   Message ID: ${result.messageId}`);
    console.log(`   Sent to: ${testEmail}`);
    console.log('\n📧 Check your email inbox for the test message');
    console.log('🎯 SMTP is configured correctly and ready for OTP emails!');

  } catch (error) {
    console.log('❌ SMTP test failed:');
    console.log(`   Error: ${error.message}`);
    
    // Provide specific error guidance
    if (error.code === 'EAUTH') {
      console.log('\n💡 Authentication failed:');
      console.log('   - Check username and password');
      console.log('   - For Gmail: Use App Password, not regular password');
      console.log('   - Enable 2FA and generate App Password');
    } else if (error.code === 'ECONNECTION') {
      console.log('\n💡 Connection failed:');
      console.log('   - Check SMTP host and port');
      console.log('   - Verify firewall/network settings');
      console.log('   - Try different port (587 vs 465)');
    } else {
      console.log('\n💡 General troubleshooting:');
      console.log('   - Verify all SMTP settings');
      console.log('   - Check with your email provider');
      console.log('   - Try a different SMTP service');
    }
  }
}

// Run test
testEmailSending().catch(console.error);
