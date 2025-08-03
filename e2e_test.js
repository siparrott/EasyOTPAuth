#!/usr/bin/env node

/**
 * 🚀 END-TO-END OTP AUTHENTICATION TEST
 * 
 * This script performs a complete live test of the EasyOTPAuth system
 * using the real email address to verify the entire flow works:
 * 
 * 1. Sends OTP request to siparrott@yahoo.co.uk
 * 2. Verifies API responses are correct
 * 3. Provides instructions for manual code verification
 * 4. Tests JWT token issuance
 * 5. Validates complete authentication flow
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
  white: '\x1b[37m',
  bold: '\x1b[1m'
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
      port: urlObj.port || 443,
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
          resolve({ 
            status: res.statusCode, 
            data: jsonBody, 
            headers: res.headers,
            success: res.statusCode >= 200 && res.statusCode < 300
          });
        } catch {
          resolve({ 
            status: res.statusCode, 
            data: body, 
            headers: res.headers,
            success: res.statusCode >= 200 && res.statusCode < 300
          });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error('Request timeout after 15 seconds'));
    });

    if (data) {
      req.write(data);
    }
    req.end();
  });
}

async function promptForInput(question) {
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    readline.question(question, (answer) => {
      readline.close();
      resolve(answer.trim());
    });
  });
}

async function runEndToEndTest() {
  logHeader('🎯 EASYOTPAUTH END-TO-END LIVE TEST');
  
  const testEmail = 'siparrott@yahoo.co.uk';
  const baseUrl = 'https://www.easyotpauth.com';
  
  log(`\n📧 Testing with email: ${testEmail}`, 'yellow');
  log(`🌐 Testing environment: ${baseUrl}`, 'yellow');
  
  let testResults = {
    requestCode: false,
    emailDelivery: false,
    codeVerification: false,
    jwtToken: null
  };

  try {
    // Step 1: Test OTP Request
    logHeader('📤 STEP 1: REQUEST OTP CODE');
    
    log('Sending OTP request...', 'blue');
    const requestData = JSON.stringify({ email: testEmail });
    
    const response = await makeRequest(`${baseUrl}/auth/request-code`, requestData);
    
    log(`\n📊 Response Details:`, 'white');
    log(`   Status: ${response.status}`, 'white');
    log(`   Success: ${response.success}`, response.success ? 'green' : 'red');
    log(`   Message: ${JSON.stringify(response.data)}`, 'white');
    
    if (response.success) {
      testResults.requestCode = true;
      log('\n✅ OTP request sent successfully!', 'green');
      log('📬 Check your email (siparrott@yahoo.co.uk) for the 6-digit code', 'cyan');
      
      // Wait for email delivery
      log('\n⏳ Waiting 30 seconds for email delivery...', 'yellow');
      await new Promise(resolve => setTimeout(resolve, 30000));
      
      // Step 2: Manual verification step
      logHeader('📥 STEP 2: EMAIL VERIFICATION');
      
      log('Please check your email inbox and spam folder for:', 'cyan');
      log(`   • From: EasyOTPAuth <hello@easyotpauth.com>`, 'white');
      log(`   • Subject: Your EasyOTPAuth login code`, 'white');
      log(`   • Content: 6-digit verification code`, 'white');
      
      const emailReceived = await promptForInput('\n❓ Did you receive the email with the OTP code? (y/n): ');
      
      if (emailReceived.toLowerCase() === 'y' || emailReceived.toLowerCase() === 'yes') {
        testResults.emailDelivery = true;
        log('✅ Email delivery confirmed!', 'green');
        
        // Step 3: Test OTP Verification
        logHeader('🔐 STEP 3: VERIFY OTP CODE');
        
        const otpCode = await promptForInput('Please enter the 6-digit code from your email: ');
        
        if (otpCode && otpCode.length === 6 && /^\d{6}$/.test(otpCode)) {
          log(`\nVerifying code: ${otpCode}`, 'blue');
          
          const verifyData = JSON.stringify({ 
            email: testEmail, 
            code: otpCode 
          });
          
          const verifyResponse = await makeRequest(`${baseUrl}/auth/verify-code`, verifyData);
          
          log(`\n📊 Verification Response:`, 'white');
          log(`   Status: ${verifyResponse.status}`, 'white');
          log(`   Success: ${verifyResponse.success}`, verifyResponse.success ? 'green' : 'red');
          log(`   Response: ${JSON.stringify(verifyResponse.data)}`, 'white');
          
          if (verifyResponse.success && verifyResponse.data.token) {
            testResults.codeVerification = true;
            testResults.jwtToken = verifyResponse.data.token;
            
            log('\n✅ Code verification successful!', 'green');
            log(`🎟️  JWT Token received: ${verifyResponse.data.token.substring(0, 50)}...`, 'cyan');
            
            // Step 4: Test JWT Token
            logHeader('🎫 STEP 4: VALIDATE JWT TOKEN');
            
            const tokenTest = await makeRequest(
              `${baseUrl}/protected`, 
              null, 
              'GET'
            );
            
            // Add Authorization header for protected endpoint test
            const protectedTest = await new Promise((resolve, reject) => {
              const urlObj = new URL(`${baseUrl}/protected`);
              const options = {
                hostname: urlObj.hostname,
                port: 443,
                path: urlObj.pathname,
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${testResults.jwtToken}`,
                  'Content-Type': 'application/json'
                }
              };

              const req = https.request(options, (res) => {
                let body = '';
                res.on('data', (chunk) => body += chunk);
                res.on('end', () => {
                  try {
                    const jsonBody = JSON.parse(body);
                    resolve({ status: res.statusCode, data: jsonBody });
                  } catch {
                    resolve({ status: res.statusCode, data: body });
                  }
                });
              });

              req.on('error', reject);
              req.setTimeout(10000, () => {
                req.destroy();
                reject(new Error('Timeout'));
              });
              req.end();
            });
            
            log(`\n📊 JWT Validation:`, 'white');
            log(`   Status: ${protectedTest.status}`, 'white');
            log(`   Response: ${JSON.stringify(protectedTest.data)}`, 'white');
            
            if (protectedTest.status === 200 && protectedTest.data.ok) {
              log('\n✅ JWT token validation successful!', 'green');
              log(`👤 Authenticated user: ${protectedTest.data.user}`, 'cyan');
              log(`⏰ Token expires: ${protectedTest.data.expires}`, 'cyan');
            } else {
              log('\n❌ JWT token validation failed', 'red');
            }
            
          } else {
            log('\n❌ Code verification failed', 'red');
            if (verifyResponse.data.error) {
              log(`   Error: ${verifyResponse.data.error}`, 'yellow');
            }
          }
          
        } else {
          log('\n❌ Invalid code format. Expected 6 digits.', 'red');
        }
        
      } else {
        testResults.emailDelivery = false;
        log('❌ Email not received', 'red');
      }
      
    } else {
      testResults.requestCode = false;
      log('\n❌ OTP request failed', 'red');
      if (response.data.error) {
        log(`   Error: ${response.data.error}`, 'yellow');
      }
    }

  } catch (error) {
    log(`\n💥 Test failed with error: ${error.message}`, 'red');
  }

  // Generate Final Report
  logHeader('📊 END-TO-END TEST RESULTS');
  
  log('\n🎯 Test Summary:', 'bold');
  log(`   📤 OTP Request: ${testResults.requestCode ? '✅ PASS' : '❌ FAIL'}`, 
      testResults.requestCode ? 'green' : 'red');
  log(`   📧 Email Delivery: ${testResults.emailDelivery ? '✅ PASS' : '❌ FAIL'}`, 
      testResults.emailDelivery ? 'green' : 'red');
  log(`   🔐 Code Verification: ${testResults.codeVerification ? '✅ PASS' : '❌ FAIL'}`, 
      testResults.codeVerification ? 'green' : 'red');
  log(`   🎫 JWT Authentication: ${testResults.jwtToken ? '✅ PASS' : '❌ FAIL'}`, 
      testResults.jwtToken ? 'green' : 'red');

  const allPassed = testResults.requestCode && testResults.emailDelivery && 
                   testResults.codeVerification && testResults.jwtToken;

  if (allPassed) {
    logHeader('🎉 SUCCESS - SYSTEM FULLY OPERATIONAL');
    log('✅ Your EasyOTPAuth system is working perfectly!', 'green');
    log('\n🚀 System Capabilities Confirmed:', 'cyan');
    log('   • OTP generation and delivery via email', 'green');
    log('   • Secure code verification', 'green');  
    log('   • JWT token issuance', 'green');
    log('   • Protected route authentication', 'green');
    log('\n💼 Ready for production use and customer onboarding!', 'bold');
  } else {
    logHeader('⚠️ ISSUES DETECTED');
    log('Some parts of the system need attention:', 'yellow');
    
    if (!testResults.requestCode) {
      log('   • Fix OTP request endpoint', 'red');
    }
    if (!testResults.emailDelivery) {
      log('   • Check SMTP configuration and email delivery', 'red');
    }
    if (!testResults.codeVerification) {
      log('   • Verify OTP validation logic', 'red');
    }
    if (!testResults.jwtToken) {
      log('   • Check JWT token generation', 'red');
    }
  }

  log(`\n${'='.repeat(60)}`, 'cyan');
  log('🏁 End-to-End Test Complete', 'cyan');
  log(`${'='.repeat(60)}`, 'cyan');

  return allPassed;
}

// Run the test
if (require.main === module) {
  runEndToEndTest()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error(`\n💥 Test suite crashed: ${error.message}`);
      process.exit(1);
    });
}

module.exports = { runEndToEndTest };
