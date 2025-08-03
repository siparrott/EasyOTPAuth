import jwt from "jsonwebtoken";

export default async function handler(req, res) {
  try {
    // Enable CORS for client integration
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'OPTIONS') {
      return res.status(200).json({ success: true });
    }

    if (req.method !== "POST") {
      return res.status(405).json({ success: false, error: "Method not allowed" });
    }

    // Validate request body
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ success: false, error: "Invalid request body" });
    }

    const { email, otp } = req.body;

    // Validate inputs
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ success: false, error: "Email is required" });
    }

    if (!otp || typeof otp !== 'string') {
      return res.status(400).json({ success: false, error: "OTP is required" });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, error: "Valid email is required" });
    }

    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({ success: false, error: "OTP must be 6 digits" });
    }

    console.log(`🔄 Verifying OTP for: ${email}`);

    try {
      // Check if OTP store exists
      if (!global.otpStore) {
        console.log('❌ No OTP store found');
        return res.status(400).json({ success: false, error: "No OTP found. Please request a new code." });
      }

      const storedData = global.otpStore.get(email.toLowerCase());

      // 🧪 DEBUG LOGGING (remove in production)
      console.log(`🔍 Looking for OTP for: ${email.toLowerCase()}`);
      console.log(`📊 Found in store:`, storedData);
      console.log(`📊 Current OTP store:`, global.otpStore);
      console.log(`🔄 Comparing OTP: "${otp}" vs "${storedData?.otp}"`);

      if (!storedData) {
        console.log(`❌ No OTP found for email: ${email}`);
        return res.status(400).json({ success: false, error: "No OTP found for this email. Please request a new code." });
      }

      // Check if OTP has expired
      if (Date.now() > storedData.expires) {
        console.log(`❌ OTP expired for email: ${email}`);
        global.otpStore.delete(email.toLowerCase());
        return res.status(400).json({ success: false, error: "OTP has expired. Please request a new code." });
      }

      // Verify OTP
      if (storedData.otp !== otp) {
        console.log(`❌ Invalid OTP for email: ${email}. Expected: ${storedData.otp}, Received: ${otp}`);
        return res.status(400).json({ success: false, error: "Invalid OTP. Please try again." });
      }

      // OTP is valid, remove it from store
      global.otpStore.delete(email.toLowerCase());

      // Generate JWT token
      const jwtSecret = process.env.JWT_SECRET || 'EasyOTPAuth-2025-SuperSecure-JWT-Secret-Change-In-Production';
      
      try {
        const token = jwt.sign(
          { 
            email: email.toLowerCase(), 
            authenticated: true,
            timestamp: Date.now(),
            iat: Math.floor(Date.now() / 1000)
          },
          jwtSecret,
          { 
            expiresIn: '7d', // Token expires in 7 days
            issuer: 'EasyOTPAuth',
            audience: 'EasyOTPAuth-Client'
          }
        );

        console.log(`✅ OTP verified successfully for ${email}`);
        
        return res.status(200).json({ 
          success: true, 
          message: "Authentication successful",
          token,
          user: {
            email: email.toLowerCase(),
            authenticated: true,
            timestamp: Date.now()
          }
        });

      } catch (jwtError) {
        console.error('❌ JWT generation error:', jwtError);
        return res.status(500).json({ 
          success: false, 
          error: "Authentication successful but token generation failed",
          details: process.env.NODE_ENV === 'development' ? jwtError.message : undefined
        });
      }

    } catch (verificationError) {
      console.error('❌ OTP verification error:', verificationError);
      return res.status(500).json({ 
        success: false, 
        error: "Internal error during verification",
        details: process.env.NODE_ENV === 'development' ? verificationError.message : undefined
      });
    }

  } catch (globalError) {
    console.error('❌ Unexpected error in verify-otp handler:', globalError);
    return res.status(500).json({ 
      success: false, 
      error: "Internal server error",
      details: process.env.NODE_ENV === 'development' ? globalError.message : undefined
    });
  }
}
