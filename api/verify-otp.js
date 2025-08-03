import jwt from "jsonwebtoken";

export default async function handler(req, res) {
  // Enable CORS for client integration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const { email, otp } = req.body;

  // Validate inputs
  if (!email || !otp) {
    return res.status(400).json({ success: false, error: "Email and OTP are required" });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false, error: "Valid email is required" });
  }

  if (!/^\d{6}$/.test(otp)) {
    return res.status(400).json({ success: false, error: "OTP must be 6 digits" });
  }

  try {
    // Check if OTP store exists
    if (!global.otpStore) {
      return res.status(400).json({ success: false, error: "No OTP found. Please request a new code." });
    }

    const storedData = global.otpStore.get(email);

    if (!storedData) {
      return res.status(400).json({ success: false, error: "No OTP found for this email. Please request a new code." });
    }

    // Check if OTP has expired
    if (Date.now() > storedData.expires) {
      global.otpStore.delete(email);
      return res.status(400).json({ success: false, error: "OTP has expired. Please request a new code." });
    }

    // Verify OTP
    if (storedData.otp !== otp) {
      return res.status(400).json({ success: false, error: "Invalid OTP. Please try again." });
    }

    // OTP is valid, remove it from store
    global.otpStore.delete(email);

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET || 'EasyOTPAuth-2025-SuperSecure-JWT-Secret-Change-In-Production';
    const token = jwt.sign(
      { 
        email, 
        authenticated: true,
        timestamp: Date.now()
      },
      jwtSecret,
      { 
        expiresIn: '7d' // Token expires in 7 days
      }
    );

    console.log(`OTP verified successfully for ${email}`);
    
    res.status(200).json({ 
      success: true, 
      message: "Authentication successful",
      token,
      user: {
        email,
        authenticated: true
      }
    });
  } catch (error) {
    console.error("OTP verification error:", error);
    res.status(500).json({ 
      success: false, 
      error: "Internal server error during verification" 
    });
  }
}
