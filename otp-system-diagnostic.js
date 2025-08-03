/**
 * EasyOTPAuth System Diagnostic Tool (Standalone)
 * Following the comprehensive bug checklist
 */

const fs = require('fs');
const path = require('path');

async function runDiagnostics() {
  console.log('🔍 EasyOTPAuth System Diagnostic Tool');
  console.log('=====================================\n');

  // 1️⃣ Environment Variables Check
  console.log('1️⃣ ENVIRONMENT VARIABLES CHECK');
  console.log('--------------------------------');
  
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
  
  const requiredVars = [
    'SMTP_HOST',
    'SMTP_PORT', 
    'SMTP_USER',
    'SMTP_PASS',
    'MAIL_FROM',
    'JWT_SECRET',
    'NODE_ENV'
  ];

  let envIssues = [];
  
  requiredVars.forEach(varName => {
    const value = envVars[varName];
    if (!value) {
      console.log(`❌ ${varName}: NOT SET`);
      envIssues.push(varName);
    } else if (value.includes('YOUR_') || value.includes('your-')) {
      console.log(`⚠️  ${varName}: "${value}" (PLACEHOLDER)`);
      envIssues.push(varName + ' (placeholder)');
    } else {
      console.log(`✅ ${varName}: SET`);
    }
  });

  if (envIssues.length > 0) {
    console.log(`\n🚨 ENVIRONMENT ISSUES: ${envIssues.join(', ')}`);
  } else {
    console.log('\n✅ All environment variables configured');
  }

  // 2️⃣ System Architecture Analysis
  console.log('\n2️⃣ SYSTEM ARCHITECTURE ANALYSIS');
  console.log('--------------------------------');
  
  console.log('📊 OTP Storage: In-Memory Map (global.otpStore)');
  console.log('📧 Email Service: Nodemailer with SMTP');
  console.log('🔐 OTP Generation: Math.floor(100000 + Math.random() * 900000)');
  console.log('⏰ OTP Expiry: 10 minutes (600,000ms)');
  console.log('🔒 OTP Comparison: Plain text string comparison');
  
  // 3️⃣ API Flow Analysis
  console.log('\n3️⃣ API FLOW ANALYSIS');
  console.log('---------------------');
  
  console.log('📍 /api/send-otp Flow:');
  console.log('   1. Validate email format');
  console.log('   2. Generate 6-digit OTP');
  console.log('   3. Store in global.otpStore with expiration');
  console.log('   4. Create SMTP transporter');
  console.log('   5. Send email with OTP');
  console.log('   6. Return JSON success response');
  
  console.log('\n📍 /api/verify-otp Flow:');
  console.log('   1. Get email and OTP from request');
  console.log('   2. Check global.otpStore for stored OTP');
  console.log('   3. Verify expiration time');
  console.log('   4. Compare OTP strings');
  console.log('   5. Generate JWT token');
  console.log('   6. Delete OTP from store');
  console.log('   7. Return success with token');

  // 4️⃣ Critical Analysis Points
  console.log('\n4️⃣ CRITICAL ANALYSIS POINTS');
  console.log('----------------------------');
  
  console.log('🔍 Based on your checklist:');
  
  // Check for SMTP placeholder values
  const smtpHost = envVars.SMTP_HOST;
  const smtpUser = envVars.SMTP_USER;
  const smtpPass = envVars.SMTP_PASS;
  
  if (!smtpHost || !smtpUser || !smtpPass) {
    console.log('❌ SMTP Configuration: MISSING');
    console.log('   → OTPs will NOT be sent via email');
  } else if (smtpUser.includes('YOUR_') || smtpPass.includes('YOUR_')) {
    console.log('❌ SMTP Configuration: PLACEHOLDER VALUES');
    console.log('   → Email sending will fail with authentication error');
  } else {
    console.log('✅ SMTP Configuration: APPEARS VALID');
  }
  
  // Check OTP storage mechanism
  console.log('\n💾 OTP Storage Analysis:');
  console.log('   - Uses global.otpStore (in-memory Map)');
  console.log('   - ⚠️  Data lost on server restart/cold start');
  console.log('   - ⚠️  Not shared between multiple server instances');
  console.log('   - ✅ Simple implementation for demo/development');

  // 5️⃣ Common Failure Scenarios
  console.log('\n5️⃣ COMMON FAILURE SCENARIOS');
  console.log('----------------------------');
  
  console.log('❌ Scenario 1: SMTP Authentication Failure');
  console.log('   Cause: Wrong SMTP credentials or placeholder values');
  console.log('   Symptom: "Email authentication failed" error');
  console.log('   Fix: Update .env with real SMTP credentials');
  
  console.log('\n❌ Scenario 2: OTP Not Found During Verification');
  console.log('   Cause: Server restart cleared global.otpStore');
  console.log('   Symptom: "No OTP found for this email" error');
  console.log('   Fix: Use persistent storage (Redis/Database)');
  
  console.log('\n❌ Scenario 3: OTP Expired');
  console.log('   Cause: More than 10 minutes passed since generation');
  console.log('   Symptom: "OTP has expired" error');
  console.log('   Fix: Request new OTP');
  
  console.log('\n❌ Scenario 4: Email Not Delivered');
  console.log('   Cause: SMTP server blocking, spam folder, wrong email');
  console.log('   Symptom: User never receives OTP email');
  console.log('   Fix: Check SMTP logs, test email delivery');

  // 6️⃣ Debugging Recommendations
  console.log('\n6️⃣ DEBUGGING RECOMMENDATIONS');
  console.log('-----------------------------');
  
  console.log('🧪 To debug OTP issues:');
  console.log('');
  console.log('1. Add debug logging to /api/send-otp.js:');
  console.log('   console.log("Generated OTP:", otp);');
  console.log('   console.log("Stored in global.otpStore:", global.otpStore);');
  console.log('');
  console.log('2. Add debug logging to /api/verify-otp.js:');
  console.log('   console.log("Looking for OTP for:", email);');
  console.log('   console.log("Found in store:", storedData);');
  console.log('   console.log("Comparing:", otp, "vs", storedData?.otp);');
  console.log('');
  console.log('3. Test SMTP independently:');
  console.log('   node test-smtp.js');
  console.log('');
  console.log('4. Check browser Network tab:');
  console.log('   - Verify API responses are JSON');
  console.log('   - Check for error messages');
  console.log('   - Confirm CORS headers');

  // 7️⃣ Quick Fix Suggestions
  console.log('\n7️⃣ IMMEDIATE ACTION ITEMS');
  console.log('==========================');
  
  let actionItems = [];
  
  if (envIssues.some(issue => issue.includes('SMTP'))) {
    actionItems.push('🔧 Configure real SMTP credentials in .env file');
  }
  
  if (!envVars.JWT_SECRET || envVars.JWT_SECRET.includes('change')) {
    actionItems.push('🔐 Set secure JWT_SECRET in .env');
  }
  
  if (actionItems.length === 0) {
    console.log('✅ Configuration looks good!');
    console.log('💡 If OTP still fails, check server logs and email delivery');
  } else {
    actionItems.forEach((item, index) => {
      console.log(`${index + 1}. ${item}`);
    });
  }
  
  console.log('\n📋 SUCCESS VERIFICATION:');
  console.log('1. Enter email in OTP widget');
  console.log('2. Check browser console for API call responses');
  console.log('3. Verify email arrives in inbox');
  console.log('4. Enter OTP and verify authentication success');
  
  console.log('\n🎯 DIAGNOSIS COMPLETE');
}

// Run diagnostics
runDiagnostics().catch(console.error);
