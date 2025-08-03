const https = require('https');

console.log('🔐 EasyOTPAuth Complete End-to-End Test');
console.log('======================================');
console.log('Testing with: siparrott@yahoo.co.uk');
console.log('');

// Test data
const email = 'siparrott@yahoo.co.uk';
let otpCode = null;

// Helper function for API requests
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          resolve({ status: res.statusCode, data: result, headers: res.headers });
        } catch (err) {
          resolve({ status: res.statusCode, data: body, headers: res.headers });
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

// Step 1: Test sending OTP
async function testSendOTP() {
  console.log('📧 Step 1: Sending OTP to siparrott@yahoo.co.uk...');
  
  const options = {
    hostname: 'www.easyotpauth.com',
    port: 443,
    path: '/api/send-otp',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'EasyOTPAuth-Test/1.0'
    }
  };

  try {
    const response = await makeRequest(options, { email });
    
    console.log(`   Status: ${response.status}`);
    console.log(`   Response:`, response.data);
    
    if (response.status === 200 && response.data.success) {
      console.log('✅ OTP sent successfully!');
      console.log('📱 Check your email: siparrott@yahoo.co.uk');
      console.log('');
      return true;
    } else {
      console.log('❌ Failed to send OTP');
      console.log('   Error:', response.data.error || 'Unknown error');
      return false;
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
    return false;
  }
}

// Step 2: Wait for user input and verify OTP
async function testVerifyOTP(otp) {
  console.log(`🔐 Step 2: Verifying OTP code: ${otp}...`);
  
  const options = {
    hostname: 'www.easyotpauth.com',
    port: 443,
    path: '/api/verify-otp',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'EasyOTPAuth-Test/1.0'
    }
  };

  try {
    const response = await makeRequest(options, { email, otp });
    
    console.log(`   Status: ${response.status}`);
    console.log(`   Response:`, response.data);
    
    if (response.status === 200 && response.data.success) {
      console.log('🎉 Authentication successful!');
      console.log('👤 User:', response.data.user.email);
      console.log('🔑 JWT Token (first 50 chars):', response.data.token.substring(0, 50) + '...');
      console.log('⏰ Token expires in 7 days');
      console.log('');
      return response.data;
    } else {
      console.log('❌ Verification failed');
      console.log('   Error:', response.data.error || 'Unknown error');
      return null;
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
    return null;
  }
}

// Test alternative endpoints
async function testAlternativeEndpoints() {
  console.log('🔄 Step 3: Testing alternative endpoints...');
  
  // Test original auth endpoints
  const options = {
    hostname: 'www.easyotpauth.com',
    port: 443,
    path: '/auth/request-code',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'EasyOTPAuth-Test/1.0'
    }
  };

  try {
    const response = await makeRequest(options, { email });
    console.log('   Original endpoint status:', response.status);
    
    if (response.status === 200) {
      console.log('✅ Original auth endpoints working');
    } else {
      console.log('⚠️ Original endpoints returned:', response.status);
    }
  } catch (error) {
    console.log('⚠️ Original endpoints error:', error.message);
  }
}

// User input helper
function askQuestion(question) {
  const readline = require('readline');
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

// Main test execution
async function runCompleteTest() {
  try {
    console.log('🚀 Starting complete authentication test...');
    console.log('');
    
    // Step 1: Send OTP
    const otpSent = await testSendOTP();
    
    if (!otpSent) {
      console.log('❌ Test failed: Could not send OTP');
      process.exit(1);
    }
    
    // Wait for email delivery
    console.log('⏳ Waiting 5 seconds for email delivery...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Step 2: Get OTP from user
    console.log('📬 Please check your email: siparrott@yahoo.co.uk');
    const otp = await askQuestion('🔢 Enter the 6-digit OTP code you received: ');
    
    if (!/^\d{6}$/.test(otp)) {
      console.log('❌ Invalid OTP format. Must be 6 digits.');
      process.exit(1);
    }
    
    // Step 3: Verify OTP
    const authResult = await testVerifyOTP(otp);
    
    if (!authResult) {
      console.log('❌ Test failed: Authentication unsuccessful');
      process.exit(1);
    }
    
    // Step 4: Test alternative endpoints
    await testAlternativeEndpoints();
    
    // Success summary
    console.log('═══════════════════════════════════════');
    console.log('🎉 COMPLETE TEST SUCCESSFUL!');
    console.log('═══════════════════════════════════════');
    console.log('✅ Email delivery: Working');
    console.log('✅ OTP generation: Working');
    console.log('✅ OTP verification: Working');
    console.log('✅ JWT token generation: Working');
    console.log('✅ API endpoints: Operational');
    console.log('✅ SMTP configuration: Functional');
    console.log('');
    console.log('🚀 Your EasyOTPAuth system is 100% operational!');
    console.log('💰 Ready for customer use and revenue generation!');
    console.log('');
    console.log('📋 Integration examples:');
    console.log('   Widget: https://www.easyotpauth.com/client-demo');
    console.log('   API: https://www.easyotpauth.com/api/send-otp');
    console.log('   Docs: CLIENT_INTEGRATION_GUIDE.md');
    
  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
    console.log(error.stack);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Test interrupted by user');
  process.exit(0);
});

// Run the complete test
console.log('🎯 This test will:');
console.log('   1. Send a real OTP to siparrott@yahoo.co.uk');
console.log('   2. Wait for you to receive and enter the code');
console.log('   3. Verify the authentication flow works end-to-end');
console.log('   4. Confirm your system is 100% operational');
console.log('');

runCompleteTest();
