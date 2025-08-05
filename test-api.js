const https = require('https');
const fs = require('fs');

console.log('Testing OTP API at https://www.easyotpauth.com/api/send-otp');
console.log('Sending OTP to: siparrott@yahoo.co.uk');
console.log('Time:', new Date().toISOString());

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
    'User-Agent': 'EasyOTPAuth-Test/1.0'
  }
};

const req = https.request(options, (res) => {
  let body = '';
  
  console.log(`Status Code: ${res.statusCode}`);
  console.log(`Status Message: ${res.statusMessage}`);
  console.log('Response Headers:', JSON.stringify(res.headers, null, 2));
  
  res.on('data', (chunk) => {
    body += chunk;
  });
  
  res.on('end', () => {
    console.log('\n--- Response Body ---');
    console.log(body);
    
    try {
      const parsed = JSON.parse(body);
      console.log('\n--- Parsed JSON ---');
      console.log(JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.log('\n--- Raw Response (Not JSON) ---');
      console.log(body);
    }
    
    // Save results to file
    const results = {
      timestamp: new Date().toISOString(),
      statusCode: res.statusCode,
      statusMessage: res.statusMessage,
      headers: res.headers,
      body: body,
      email: 'siparrott@yahoo.co.uk'
    };
    
    fs.writeFileSync('api-test-results.json', JSON.stringify(results, null, 2));
    console.log('\nResults saved to api-test-results.json');
  });
});

req.on('error', (e) => {
  console.error('Request Error:', e.message);
  console.error('Error Code:', e.code);
  
  const errorResults = {
    timestamp: new Date().toISOString(),
    error: e.message,
    code: e.code,
    email: 'siparrott@yahoo.co.uk'
  };
  
  fs.writeFileSync('api-test-results.json', JSON.stringify(errorResults, null, 2));
  console.log('Error results saved to api-test-results.json');
});

req.write(data);
req.end();
