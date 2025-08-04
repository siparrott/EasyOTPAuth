import jwt from "jsonwebtoken";
import { otpStore } from "../utils/supabase-otp.js";

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
      // Verify OTP using Supabase (with fallback to memory)
      const verificationResult = await otpStore.verifyOTP(email, otp);

      if (!verificationResult.success) {
        console.log(`❌ OTP verification failed for ${email}: ${verificationResult.error}`);
        return res.status(400).json({ 
          success: false, 
          error: verificationResult.error 
        });
      }

      console.log(`✅ OTP verified successfully for ${email}`);

      // Update user record in database
      await otpStore.upsertUser(email);

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

        console.log(`✅ JWT token generated for ${email}`);
        
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
