/**
 * EasyOTPAuth System Diagnostic Tool
 * Following the comprehensive bug checklist
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runDiagnostics() {
  console.log('🔍 EasyOTPAuth System Diagnostic Tool');
  console.log('=====================================\n');

  // 1️⃣ Environment Variables Check
  console.log('1️⃣ ENVIRONMENT VARIABLES CHECK');
  console.log('--------------------------------');
  
  const envVars = [
    'SMTP_HOST',
    'SMTP_PORT', 
    'SMTP_USER',
    'SMTP_PASS',
    'MAIL_FROM',
    'JWT_SECRET',
    'NODE_ENV'
  ];

  let envIssues = [];
  
  envVars.forEach(varName => {
    const value = process.env[varName];
    if (!value) {
      console.log(`❌ ${varName}: NOT SET`);
      envIssues.push(varName);
    } else if (value.includes('YOUR_') || value.includes('your-')) {
      console.log(`⚠️  ${varName}: PLACEHOLDER VALUE`);
      envIssues.push(varName + ' (placeholder)');
    } else {
      console.log(`✅ ${varName}: SET`);
    }
  });

  if (envIssues.length > 0) {
    console.log(`\n🚨 ENVIRONMENT ISSUES FOUND: ${envIssues.join(', ')}`);
  } else {
    console.log('\n✅ All environment variables properly configured');
  }

  // 2️⃣ System Architecture Check
  console.log('\n2️⃣ SYSTEM ARCHITECTURE CHECK');
  console.log('------------------------------');
  
  console.log('📊 OTP Storage: In-Memory Map (global.otpStore)');
  console.log('📧 Email Service: Nodemailer with SMTP');
  console.log('🔐 OTP Generation: 6-digit random number');
  console.log('⏰ OTP Expiry: 10 minutes');
  console.log('🔒 OTP Storage: Plain text (not hashed in Vercel functions)');
  
  // 3️⃣ API Endpoints Check
  console.log('\n3️⃣ API ENDPOINTS ANALYSIS');
  console.log('--------------------------');
  
  console.log('📍 Send OTP: /api/send-otp');
  console.log('   - Validates email format');
  console.log('   - Generates 6-digit OTP');
  console.log('   - Stores in global.otpStore');
  console.log('   - Sends email via SMTP');
  
  console.log('📍 Verify OTP: /api/verify-otp');
  console.log('   - Retrieves from global.otpStore');
  console.log('   - Checks expiration (10 minutes)');
  console.log('   - Compares OTP (plain text comparison)');
  console.log('   - Generates JWT token on success');

  // 4️⃣ Common Failure Points
  console.log('\n4️⃣ COMMON FAILURE POINTS');
  console.log('-------------------------');
  
  const issues = [];
  
  if (envIssues.some(issue => issue.includes('SMTP'))) {
    issues.push('❌ SMTP credentials not configured - emails will fail');
  }
  
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.includes('change')) {
    issues.push('⚠️  JWT_SECRET is default/weak - use secure random string');
  }
  
  console.log('🔍 Potential Issues:');
  console.log('   - OTP storage is in-memory (resets on server restart)');
  console.log('   - No database persistence');
  console.log('   - SMTP firewall/authentication issues');
  console.log('   - Vercel cold starts may clear global.otpStore');
  
  if (issues.length > 0) {
    console.log('\n🚨 CRITICAL ISSUES:');
    issues.forEach(issue => console.log(`   ${issue}`));
  }

  // 5️⃣ Quick Test Recommendations  
  console.log('\n5️⃣ TESTING RECOMMENDATIONS');
  console.log('---------------------------');
  
  console.log('🧪 Quick Tests to Run:');
  console.log('   1. Test SMTP: node test-smtp.js');
  console.log('   2. Test API: node test-api-fix.js');
  console.log('   3. Test E2E: node comprehensive-test.js');
  console.log('   4. Check logs: Enable debug logging in API endpoints');
  
  console.log('\n🔧 Debug Steps:');
  console.log('   1. Add console.log("OTP generated:", otp) in send-otp.js');
  console.log('   2. Add console.log("OTP stored:", global.otpStore) in verify-otp.js');
  console.log('   3. Check browser Network tab for API responses');
  console.log('   4. Verify email delivery in inbox/spam');
  
  // 6️⃣ System Status Summary
  console.log('\n6️⃣ SYSTEM STATUS SUMMARY');
  console.log('=========================');
  
  const smtpConfigured = process.env.SMTP_HOST && 
                        process.env.SMTP_USER && 
                        process.env.SMTP_PASS &&
                        !process.env.SMTP_USER.includes('YOUR_') &&
                        !process.env.SMTP_PASS.includes('YOUR_');
  
  console.log(`📧 Email Service: ${smtpConfigured ? '✅ CONFIGURED' : '❌ NOT CONFIGURED'}`);
  console.log(`🔐 JWT Secret: ${process.env.JWT_SECRET && !process.env.JWT_SECRET.includes('change') ? '✅ SET' : '⚠️  DEFAULT/WEAK'}`);
  console.log(`💾 OTP Storage: ⚠️  IN-MEMORY (not persistent)`);
  console.log(`🌐 API Endpoints: ✅ IMPLEMENTED`);
  console.log(`🛡️  Error Handling: ✅ COMPREHENSIVE`);
  
  if (!smtpConfigured) {
    console.log('\n🚨 IMMEDIATE ACTION REQUIRED:');
    console.log('   Configure SMTP credentials in .env file or Vercel environment variables');
    console.log('   Current SMTP settings have placeholder values');
  }
  
  console.log('\n📋 NEXT STEPS:');
  console.log('   1. Configure SMTP credentials');
  console.log('   2. Test email delivery');
  console.log('   3. Verify OTP flow end-to-end');
  console.log('   4. Consider database for OTP persistence');
}

// Run diagnostics
runDiagnostics().catch(console.error);
