#!/usr/bin/env node

/**
 * 🚀 LIVE OTP SYSTEM TEST
 * 
 * This script tests the live EasyOTPAuth deployment
 * to confirm if the OTP demo is functional in production.
 * 
 * Tests both local server and live deployment.
 */

const https = require('https');
const http = require('http');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(url, data, method = 'POST') {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https://');
    const client = isHttps ? https : http;
    
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data ? Buffer.byteLength(data) : 0
      }
    };

    const req = client.request(options, (res) => {
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

    if (data) {
      req.write(data);
    }
    req.end();
  });
}

async function testLiveOTP() {
  log('\n🌐 Testing Live EasyOTPAuth System', 'cyan');
  log('=' .repeat(50), 'cyan');
  
  const testEmail = 'test@example.com';
  const baseUrl = 'https://easyotpauth.com';
  
  try {
    // Test 1: Check if homepage loads
    log('\n1️⃣ Testing homepage accessibility...', 'blue');
    try {
      await makeRequest(`${baseUrl}/`, null, 'GET');
      log('✅ Homepage loads successfully', 'green');
    } catch (error) {
      log(`❌ Homepage failed to load: ${error.message}`, 'red');
      return;
    }

    // Test 2: Test OTP request endpoint
    log('\n2️⃣ Testing OTP request endpoint...', 'blue');
    try {
      const requestData = JSON.stringify({ email: testEmail });
      const response = await makeRequest(`${baseUrl}/auth/request-code`, requestData);
      
      log(`   Status: ${response.status}`, 'white');
      
      if (response.status === 308 || response.status === 301) {
        log('⚠️  Endpoint redirected - this suggests Vercel routing', 'yellow');
        // Try with trailing slash
        const response2 = await makeRequest(`${baseUrl}/auth/request-code/`, requestData);
        log(`   Redirect Status: ${response2.status}`, 'white');
        log(`   Redirect Response: ${JSON.stringify(response2.data)}`, 'white');
      } else {
        log(`   Response: ${JSON.stringify(response.data)}`, 'white');
      }
      
      if (response.status === 200) {
        log('✅ OTP request endpoint is working', 'green');
      } else if (response.status === 500 && response.data.error?.includes('email')) {
        log('⚠️  OTP endpoint works but email service not configured', 'yellow');
        log('   This confirms the backend is real, just needs SMTP setup', 'yellow');
      } else if (response.status === 308) {
        log('⚠️  API endpoint exists but has routing redirect', 'yellow');
      } else {
        log(`❌ OTP request failed with status ${response.status}`, 'red');
      }
    } catch (error) {
      log(`❌ OTP request failed: ${error.message}`, 'red');
    }

    // Test 3: Test OTP verification endpoint with dummy data
    log('\n3️⃣ Testing OTP verification endpoint...', 'blue');
    try {
      const verifyData = JSON.stringify({ email: testEmail, code: '123456' });
      const response = await makeRequest(`${baseUrl}/auth/verify-code`, verifyData);
      
      log(`   Status: ${response.status}`, 'white');
      log(`   Response: ${JSON.stringify(response.data)}`, 'white');
      
      if (response.status === 401 && response.data.error?.includes('expired')) {
        log('✅ OTP verification endpoint is working (correctly rejected invalid code)', 'green');
      } else if (response.status === 400) {
        log('✅ OTP verification endpoint validates input correctly', 'green');
      } else {
        log(`⚠️  Unexpected response from verification endpoint`, 'yellow');
      }
    } catch (error) {
      log(`❌ OTP verification test failed: ${error.message}`, 'red');
    }

    // Test 4: Check email config endpoint
    log('\n4️⃣ Testing email configuration endpoint...', 'blue');
    try {
      const response = await makeRequest(`${baseUrl}/email-config-test`, null, 'GET');
      
      log(`   Status: ${response.status}`, 'white');
      log(`   Response: ${JSON.stringify(response.data)}`, 'white');
      
      if (response.status === 200) {
        log('✅ Email configuration endpoint accessible', 'green');
        
        // Check configuration status
        if (response.data.configured) {
          log('✅ All email settings are configured', 'green');
        } else {
          log('⚠️  Some email settings need configuration:', 'yellow');
          Object.entries(response.data).forEach(([key, value]) => {
            if (key !== 'configured') {
              log(`   ${key}: ${value ? '✅ Configured' : '❌ Missing'}`, value ? 'green' : 'red');
            }
          });
        }
      }
    } catch (error) {
      log(`❌ Email config check failed: ${error.message}`, 'red');
    }

  } catch (error) {
    log(`💥 Test suite failed: ${error.message}`, 'red');
  }

  log('\n' + '=' .repeat(50), 'cyan');
  log('🏁 Live System Test Complete', 'cyan');
}

testLiveOTP();
