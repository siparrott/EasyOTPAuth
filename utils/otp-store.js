// utils/otp-store.js
const bcrypt = require('bcryptjs');

// Simple in-memory OTP store for development
const otpStore = new Map();

function storeOTP(email, plainOTP) {
  const hashedOTP = bcrypt.hashSync(plainOTP, 10);
  const expiresAt = Date.now() + (10 * 60 * 1000); // 10 minutes
  otpStore.set(email.toLowerCase(), { hash: hashedOTP, expires: expiresAt });
  console.log(`📝 OTP stored for ${email.toLowerCase()}: ${plainOTP} (expires at ${new Date(expiresAt).toISOString()})`);
}

function verifyOTP(email, otp) {
  const record = otpStore.get(email.toLowerCase());
  console.log(`🔍 Verifying OTP for ${email.toLowerCase()}: ${otp}`);
  console.log(`📖 Stored record:`, record ? { hasHash: !!record.hash, expires: new Date(record.expires).toISOString() } : 'Not found');
  
  if (!record) {
    return { success: false, error: 'Code expired or not found' };
  }
  
  if (Date.now() > record.expires) {
    otpStore.delete(email.toLowerCase());
    return { success: false, error: 'Code has expired' };
  }
  
  const isValid = bcrypt.compareSync(otp, record.hash);
  console.log(`✅ OTP comparison result: ${isValid}`);
  
  if (isValid) {
    otpStore.delete(email.toLowerCase()); // Remove OTP after successful verification
    return { success: true };
  }
  
  return { success: false, error: 'Invalid verification code' };
}

function listStoredOTPs() {
  console.log('📋 Currently stored OTPs:');
  for (const [email, record] of otpStore.entries()) {
    console.log(`   ${email}: expires ${new Date(record.expires).toISOString()}`);
  }
}

module.exports = {
  storeOTP,
  verifyOTP,
  listStoredOTPs
};
