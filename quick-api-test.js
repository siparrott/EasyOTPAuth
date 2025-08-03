const https = require('https');

console.log('🔐 Quick API Test for siparrott@yahoo.co.uk');
console.log('===========================================');

function testSendOTP() {
  const data = JSON.stringify({
    email: 'siparrott@yahoo.co.uk'
  });

  const options = {
    hostname: 'www.easyotpauth.com',
    port: 443,
    path: '/api/send-otp',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length,
      'Accept': 'application/json'
    }
  };

  const req = https.request(options, (res) => {
    console.log(`📊 Status Code: ${res.statusCode}`);
    console.log(`📋 Headers:`, res.headers);
    
    let body = '';
    res.on('data', (chunk) => {
      body += chunk;
    });
    
    res.on('end', () => {
      console.log('📧 Response Body:', body);
      
      try {
        const response = JSON.parse(body);
        if (response.success) {
          console.log('✅ SUCCESS: OTP sent to siparrott@yahoo.co.uk');
          console.log('📱 Check your email for the 6-digit code!');
          console.log('');
          console.log('🎯 Next step: Go to https://www.easyotpauth.com/personal-test');
          console.log('   Enter siparrott@yahoo.co.uk and the code you received');
        } else {
          console.log('❌ ERROR:', response.error || 'Unknown error');
        }
      } catch (e) {
        console.log('⚠️ Non-JSON response:', body);
      }
    });
  });

  req.on('error', (error) => {
    console.log('❌ Request failed:', error.message);
  });

  req.write(data);
  req.end();
}

console.log('📧 Sending OTP request to production API...');
testSendOTP();
