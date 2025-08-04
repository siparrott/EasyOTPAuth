/**
 * Verify Magic Code Test
 * Verifies the OTP code for siparrott@yahoo.co.uk
 */

async function verifyMagicCode() {
  console.log('🔐 Magic Code Verification for siparrott@yahoo.co.uk');
  console.log('===================================================\n');
  
  // Get OTP code from command line argument
  const otpCode = process.argv[2];
  
  if (!otpCode) {
    console.log('❌ Please provide the OTP code as an argument');
    console.log('Usage: node verify-magic-code.js 123456');
    process.exit(1);
  }
  
  if (!/^\d{6}$/.test(otpCode)) {
    console.log('❌ OTP code must be exactly 6 digits');
    process.exit(1);
  }
  
  try {
    console.log(`🔍 Verifying code: ${otpCode}`);
    
    const response = await fetch('https://easy-otp-auth-ianf.vercel.app/api/verify-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'siparrott@yahoo.co.uk',
        otp: otpCode
      })
    });
    
    const result = await response.json();
    
    console.log('📊 Response Status:', response.status);
    console.log('📧 Response Data:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('\n🎉 SUCCESS: Magic code verified!');
      console.log('✅ Authentication successful');
      if (result.token) {
        console.log('🔑 JWT Token received:', result.token.substring(0, 50) + '...');
      }
      console.log('👤 User authenticated: siparrott@yahoo.co.uk');
    } else {
      console.log('\n❌ VERIFICATION FAILED:', result.error);
      console.log('💡 Make sure:');
      console.log('   - Code is exactly 6 digits');
      console.log('   - Code was received within last 10 minutes');
      console.log('   - Code has not been used already');
    }
    
  } catch (error) {
    console.log('❌ Error verifying magic code:', error.message);
  }
}

// Run the verification
verifyMagicCode();
