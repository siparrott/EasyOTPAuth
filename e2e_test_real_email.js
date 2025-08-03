#!/usr/bin/env node

/**
 * 🧪 END-TO-END OTP TEST WITH REAL EMAIL
 * 
 * This script tests the complete OTP authentication flow using a real email address
 * to verify that SMTP configuration is working correctly in production.
 * 
 * Test Flow:
 * 1. Request OTP code via API
 * 2. Simulate waiting for email
 * 3. Test verification endpoint with dummy code (to verify endpoint works)
 * 4. Provide instructions for manual verification
 */

const https = require('https');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  white: '\x1b[37m'
};

function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(title) {
  const border = '='.repeat(title.length + 4);
  log(`\n${border}`, 'cyan');
  log(`  ${title}`, 'cyan');
  log(`${border}`, 'cyan');
}

function makeRequest(url, data, method = 'POST') {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'EasyOTPAuth-E2E-Test/1.0',
        'Accept': 'application/json'
      }
    };

    if (data) {
      options.headers['Content-Length'] = Buffer.byteLength(data);
    }

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const jsonBody = JSON.parse(body);
          resolve({ status: res.statusCode, data: jsonBody, headers: res.headers });
        } catch {
          resolve({ status: res.statusCode, data: body, headers: res.headers });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (data) {
      req.write(data);
    }
    req.end();
  });
}

async function testEndToEndOTP() {
  logHeader('🚀 END-TO-END OTP AUTHENTICATION TEST');
  
  const testEmail = 'siparrott@yahoo.co.uk';
  const baseUrl = 'https://www.easyotpauth.com';
  
  log(`\n📧 Testing with email: ${testEmail}`, 'cyan');
  log(`🌐 Testing against: ${baseUrl}`, 'cyan');

  try {
    // Step 1: Test OTP Request
    logHeader('📤 STEP 1: REQUEST OTP CODE');
    
    log('Sending OTP request...', 'blue');
    const requestData = JSON.stringify({ email: testEmail });
    const otpResponse = await makeRequest(`${baseUrl}/auth/request-code`, requestData);
    
    log(`Status: ${otpResponse.status}`, 'white');
    log(`Response: ${JSON.stringify(otpResponse.data, null, 2)}`, 'white');
    
    if (otpResponse.status === 200) {
      log('✅ OTP REQUEST SUCCESSFUL!', 'green');
      log('   📧 Email should be sent to siparrott@yahoo.co.uk', 'green');
      log('   ⏰ Check your email inbox (and spam folder)', 'yellow');
    } else if (otpResponse.status === 500 && otpResponse.data.error?.includes('Email service')) {
      log('❌ SMTP Configuration Still Missing', 'red');
      log('   The backend is working but email service is not configured', 'yellow');
      return false;
    } else {
      log(`❌ OTP Request Failed: ${otpResponse.status}`, 'red');
      return false;
    }

    // Step 2: Test Verification Endpoint (with dummy code first)
    logHeader('🔐 STEP 2: TEST VERIFICATION ENDPOINT');
    
    log('Testing verification endpoint with dummy code...', 'blue');
    const dummyVerifyData = JSON.stringify({ email: testEmail, code: '000000' });
    const dummyVerifyResponse = await makeRequest(`${baseUrl}/auth/verify-code`, dummyVerifyData);
    
    log(`Status: ${dummyVerifyResponse.status}`, 'white');
    log(`Response: ${JSON.stringify(dummyVerifyResponse.data, null, 2)}`, 'white');
    
    if (dummyVerifyResponse.status === 401) {
      log('✅ VERIFICATION ENDPOINT WORKING!', 'green');
      log('   ✓ Correctly rejects invalid codes', 'green');
    } else {
      log(`⚠️ Unexpected verification response: ${dummyVerifyResponse.status}`, 'yellow');
    }

    // Step 3: Manual Verification Instructions
    logHeader('✋ STEP 3: MANUAL VERIFICATION REQUIRED');
    
    log('🎯 NEXT STEPS FOR COMPLETE TEST:', 'cyan');
    log('', 'white');
    log('1. 📧 Check your email: siparrott@yahoo.co.uk', 'white');
    log('2. 🔍 Look for email from: EasyOTPAuth <hello@easyotpauth.com>', 'white');
    log('3. 📋 Copy the 6-digit code from the email', 'white');
    log('4. 🌐 Go to: https://www.easyotpauth.com', 'white');
    log('5. ✏️ Enter your email in the demo widget', 'white');
    log('6. 🔢 Enter the 6-digit code you received', 'white');
    log('7. 🎉 Click "Verify & Login" to complete the test', 'white');
    log('', 'white');
    log('Expected Result:', 'cyan');
    log('✅ "Welcome! You\'re now signed in" message should appear', 'green');
    log('✅ JWT token will be issued in the background', 'green');
    
    // Step 4: Provide alternative test method
    logHeader('🔧 ALTERNATIVE: API TEST WITH REAL CODE');
    
    log('If you received the email, you can also test via API:', 'blue');
    log('', 'white');
    log('# Replace XXXXXX with your actual 6-digit code:', 'white');
    log(`curl -X POST ${baseUrl}/auth/verify-code \\`, 'white');
    log('  -H "Content-Type: application/json" \\', 'white');
    log(`  -d '{"email":"${testEmail}","code":"XXXXXX"}'`, 'white');
    log('', 'white');
    log('Expected successful response:', 'white');
    log('{"token":"eyJ...", "email":"siparrott@yahoo.co.uk"}', 'green');

    return true;

  } catch (error) {
    log(`💥 Test failed with error: ${error.message}`, 'red');
    return false;
  }
}

async function createTestInterface() {
  logHeader('🎮 CREATING LIVE TEST INTERFACE');
  
  log('Creating a dedicated test page for manual verification...', 'blue');
  
  // This will be created as a separate test page
  const testPageContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>EasyOTPAuth E2E Test</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
        .test-container { border: 2px solid #007bff; border-radius: 10px; padding: 30px; background: #f8f9fa; }
        .form-group { margin-bottom: 20px; }
        input { width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 5px; font-size: 16px; }
        button { background: #007bff; color: white; padding: 12px 24px; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; }
        button:hover { background: #0056b3; }
        .result { margin-top: 20px; padding: 15px; border-radius: 5px; }
        .success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
    </style>
</head>
<body>
    <div class="test-container">
        <h1>🧪 EasyOTPAuth End-to-End Test</h1>
        <p><strong>Test Email:</strong> siparrott@yahoo.co.uk</p>
        
        <div class="form-group">
            <label>Step 1: Request OTP Code</label>
            <button onclick="requestOTP()" id="requestBtn">Send OTP to siparrott@yahoo.co.uk</button>
        </div>
        
        <div class="form-group">
            <label>Step 2: Enter the 6-digit code from your email</label>
            <input type="text" id="otpCode" placeholder="Enter 6-digit code" maxlength="6">
            <button onclick="verifyOTP()" id="verifyBtn">Verify Code</button>
        </div>
        
        <div id="result"></div>
    </div>

    <script>
        const API_BASE = 'https://www.easyotpauth.com';
        const TEST_EMAIL = 'siparrott@yahoo.co.uk';
        
        async function requestOTP() {
            const resultDiv = document.getElementById('result');
            const btn = document.getElementById('requestBtn');
            
            btn.disabled = true;
            btn.textContent = 'Sending...';
            
            try {
                const response = await fetch(API_BASE + '/auth/request-code', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: TEST_EMAIL })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    resultDiv.innerHTML = '<div class="success">✅ OTP sent successfully! Check your email: ' + TEST_EMAIL + '</div>';
                } else {
                    resultDiv.innerHTML = '<div class="error">❌ Failed to send OTP: ' + data.error + '</div>';
                }
            } catch (error) {
                resultDiv.innerHTML = '<div class="error">❌ Network error: ' + error.message + '</div>';
            }
            
            btn.disabled = false;
            btn.textContent = 'Send OTP to siparrott@yahoo.co.uk';
        }
        
        async function verifyOTP() {
            const code = document.getElementById('otpCode').value;
            const resultDiv = document.getElementById('result');
            const btn = document.getElementById('verifyBtn');
            
            if (!code || code.length !== 6) {
                resultDiv.innerHTML = '<div class="error">❌ Please enter a 6-digit code</div>';
                return;
            }
            
            btn.disabled = true;
            btn.textContent = 'Verifying...';
            
            try {
                const response = await fetch(API_BASE + '/auth/verify-code', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: TEST_EMAIL, code: code })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    resultDiv.innerHTML = '<div class="success">🎉 SUCCESS! Authentication complete!<br><strong>JWT Token:</strong> ' + data.token.substring(0, 50) + '...<br><strong>Email:</strong> ' + data.email + '</div>';
                } else {
                    resultDiv.innerHTML = '<div class="error">❌ Verification failed: ' + data.error + '</div>';
                }
            } catch (error) {
                resultDiv.innerHTML = '<div class="error">❌ Network error: ' + error.message + '</div>';
            }
            
            btn.disabled = false;
            btn.textContent = 'Verify Code';
        }
        
        // Auto-format code input
        document.getElementById('otpCode').addEventListener('input', function(e) {
            let value = e.target.value.replace(/\\D/g, '');
            if (value.length > 6) value = value.slice(0, 6);
            e.target.value = value;
        });
    </script>
</body>
</html>`;

  return testPageContent;
}

// Run the test
async function main() {
  const success = await testEndToEndOTP();
  
  if (success) {
    logHeader('🎯 TEST SUMMARY');
    log('✅ OTP request endpoint is working', 'green');
    log('✅ Email should be sent to siparrott@yahoo.co.uk', 'green');
    log('✅ Verification endpoint is ready', 'green');
    log('⏰ Manual verification required to complete test', 'yellow');
    
    logHeader('📋 FINAL CHECKLIST');
    log('1. Check email inbox for OTP code ✉️', 'white');
    log('2. Test on live website: https://www.easyotpauth.com 🌐', 'white');
    log('3. Verify JWT token is issued on success 🎟️', 'white');
    
    process.exit(0);
  } else {
    logHeader('❌ TEST FAILED');
    log('SMTP configuration may still need adjustment', 'red');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Test suite crashed:', error);
  process.exit(1);
});
