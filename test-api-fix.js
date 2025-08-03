/**
 * Quick API Fix Test
 * Tests the fixed API endpoints to ensure JSON responses
 */

const https = require('https');

async function testAPI() {
  console.log('🧪 Testing API Fix - JSON Response Validation\n');

  // Test 1: Send OTP with proper JSON response
  console.log('1️⃣ Testing /api/send-otp endpoint...');
  
  const postData = JSON.stringify({
    email: 'test@example.com'
  });

  const options = {
    hostname: 'www.easyotpauth.com',
    port: 443,
    path: '/api/send-otp',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
      'Accept': 'application/json'
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      console.log(`📊 Status Code: ${res.statusCode}`);
      console.log(`📋 Content-Type: ${res.headers['content-type']}`);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`📄 Raw Response: ${data}\n`);
        
        // Test if response is valid JSON
        try {
          const jsonData = JSON.parse(data);
          console.log('✅ Response is valid JSON:', jsonData);
          
          if (jsonData.success !== undefined) {
            console.log('✅ Response has success field');
          }
          
          if (jsonData.error) {
            console.log(`📝 Error message: ${jsonData.error}`);
          }
          
        } catch (parseError) {
          console.log('❌ Response is NOT valid JSON');
          console.log('🔍 Parse error:', parseError.message);
          console.log('📄 First 200 chars of response:');
          console.log(data.substring(0, 200));
        }
        
        resolve();
      });
    });

    req.on('error', (e) => {
      console.error('❌ Request failed:', e.message);
      resolve();
    });

    req.write(postData);
    req.end();
  });
}

// Test CORS headers
async function testCORS() {
  console.log('\n2️⃣ Testing CORS headers...');
  
  const options = {
    hostname: 'www.easyotpauth.com',
    port: 443,
    path: '/api/send-otp',
    method: 'OPTIONS',
    headers: {
      'Origin': 'https://example.com',
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'Content-Type'
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      console.log(`📊 CORS Status: ${res.statusCode}`);
      console.log(`🌐 Access-Control-Allow-Origin: ${res.headers['access-control-allow-origin']}`);
      console.log(`📋 Access-Control-Allow-Methods: ${res.headers['access-control-allow-methods']}`);
      console.log(`📄 Access-Control-Allow-Headers: ${res.headers['access-control-allow-headers']}`);
      
      if (res.headers['access-control-allow-origin'] === '*') {
        console.log('✅ CORS properly configured');
      } else {
        console.log('⚠️ CORS may have issues');
      }
      
      resolve();
    });

    req.on('error', (e) => {
      console.error('❌ CORS test failed:', e.message);
      resolve();
    });

    req.end();
  });
}

async function main() {
  await testAPI();
  await testCORS();
  
  console.log('\n🎯 API Fix Test Complete');
  console.log('📋 Summary:');
  console.log('   - Check if API returns valid JSON (not HTML)');
  console.log('   - Verify CORS headers are present');
  console.log('   - Confirm error messages are in JSON format');
  console.log('\n💡 If tests pass, the "Unexpected token" error should be fixed!');
}

main().catch(console.error);
