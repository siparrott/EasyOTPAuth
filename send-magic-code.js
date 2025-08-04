/**
 * Send Magic Code Test
 * Sends OTP to siparrott@yahoo.co.uk
 */

async function sendMagicCode() {
  console.log('🎯 Sending Magic Code to siparrott@yahoo.co.uk');
  console.log('==============================================\n');
  
  try {
    // Use fetch (available in Node 18+)
    const response = await fetch('https://easy-otp-auth-ianf.vercel.app/api/send-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'siparrott@yahoo.co.uk'
      })
    });
    
    const result = await response.json();
    
    console.log('📊 Response Status:', response.status);
    console.log('📧 Response Data:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('\n✅ SUCCESS: Magic code sent!');
      console.log('📬 Check your email: siparrott@yahoo.co.uk');
      console.log('⏰ Code expires in 10 minutes');
      console.log('🔢 Enter the 6-digit code when prompted');
    } else {
      console.log('\n❌ FAILED:', result.error);
    }
    
  } catch (error) {
    console.log('❌ Error sending magic code:', error.message);
  }
}

// Run the test
sendMagicCode();
