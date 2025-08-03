/**
 * Simple Node.js test script to demonstrate EasyOTPAuth API integration
 * 
 * Usage:
 *   node test-client-integration.js <email>
 * 
 * Example:
 *   node test-client-integration.js siparrott@yahoo.co.uk
 */

const https = require('https');
const readline = require('readline');

const API_BASE = 'https://www.easyotpauth.com/api';

// Simple HTTP request helper
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          resolve({ status: res.statusCode, data: result });
        } catch (err) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Send OTP to email
async function sendOTP(email) {
  console.log(`\n📧 Sending OTP to: ${email}`);
  
  const options = {
    hostname: 'www.easyotpauth.com',
    port: 443,
    path: '/api/send-otp',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  };

  try {
    const response = await makeRequest(options, { email });
    
    if (response.status === 200 && response.data.success) {
      console.log('✅ OTP sent successfully!');
      console.log('📱 Check your email for the 6-digit code');
      return true;
    } else {
      console.log('❌ Failed to send OTP:', response.data.error || 'Unknown error');
      return false;
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
    return false;
  }
}

// Verify OTP
async function verifyOTP(email, otp) {
  console.log(`\n🔐 Verifying OTP: ${otp} for ${email}`);
  
  const options = {
    hostname: 'www.easyotpauth.com',
    port: 443,
    path: '/api/verify-otp',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  };

  try {
    const response = await makeRequest(options, { email, otp });
    
    if (response.status === 200 && response.data.success) {
      console.log('🎉 Authentication successful!');
      console.log('👤 User:', response.data.user.email);
      console.log('🔑 JWT Token:', response.data.token.substring(0, 50) + '...');
      return response.data;
    } else {
      console.log('❌ Verification failed:', response.data.error || 'Unknown error');
      return null;
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
    return null;
  }
}

// Get user input
function askQuestion(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

// Main test function
async function runTest() {
  console.log('🔐 EasyOTPAuth Client Integration Test');
  console.log('=====================================\n');

  // Get email from command line or ask user
  let email = process.argv[2];
  
  if (!email) {
    email = await askQuestion('📧 Enter your email address: ');
  }

  // Validate email
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.log('❌ Invalid email address format');
    process.exit(1);
  }

  console.log(`\n🎯 Testing with email: ${email}`);

  // Step 1: Send OTP
  const otpSent = await sendOTP(email);
  
  if (!otpSent) {
    console.log('\n❌ Test failed: Could not send OTP');
    process.exit(1);
  }

  // Step 2: Get OTP from user
  const otp = await askQuestion('\n🔢 Enter the 6-digit OTP from your email: ');

  if (!/^\d{6}$/.test(otp)) {
    console.log('❌ Invalid OTP format. Must be 6 digits.');
    process.exit(1);
  }

  // Step 3: Verify OTP
  const authResult = await verifyOTP(email, otp);

  if (authResult) {
    console.log('\n✅ Test completed successfully!');
    console.log('🚀 Your EasyOTPAuth integration is working perfectly!');
    
    // Show integration example
    console.log('\n📋 Quick Integration Example:');
    console.log('```javascript');
    console.log('// Send OTP');
    console.log(`fetch('${API_BASE}/send-otp', {`);
    console.log('  method: "POST",');
    console.log('  headers: { "Content-Type": "application/json" },');
    console.log(`  body: JSON.stringify({ email: "${email}" })`);
    console.log('});');
    console.log('');
    console.log('// Verify OTP');
    console.log(`fetch('${API_BASE}/verify-otp', {`);
    console.log('  method: "POST",');
    console.log('  headers: { "Content-Type": "application/json" },');
    console.log(`  body: JSON.stringify({ email: "${email}", otp: "123456" })`);
    console.log('});');
    console.log('```');
  } else {
    console.log('\n❌ Test failed: Authentication unsuccessful');
    process.exit(1);
  }
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.log('\n❌ Unexpected error:', error.message);
  process.exit(1);
});

// Run the test
runTest().catch(console.error);
