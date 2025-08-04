/**
 * OTP System Statistics API
 * Provides insights into OTP storage and usage
 */

import { otpStore } from "../utils/supabase-otp.js";

export default async function handler(req, res) {
  try {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'OPTIONS') {
      return res.status(200).json({ success: true });
    }

    if (req.method !== "GET") {
      return res.status(405).json({ success: false, error: "Method not allowed" });
    }

    try {
      // Get storage statistics
      const stats = await otpStore.getStats();
      
      // Clean up expired OTPs
      await otpStore.cleanupExpiredOTPs();

      const response = {
        success: true,
        timestamp: new Date().toISOString(),
        stats: {
          storage_type: stats.storage_type,
          active_otps: stats.active_otps,
          total_users: stats.total_users,
          environment: process.env.NODE_ENV || 'development',
          supabase_configured: !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY)
        }
      };

      // Add additional debug info in development
      if (process.env.NODE_ENV === 'development') {
        response.debug = {
          memory_store_size: global.otpStore ? global.otpStore.size : 0,
          supabase_url_configured: !!process.env.SUPABASE_URL,
          supabase_key_configured: !!(process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY)
        };
      }

      console.log(`📊 Stats requested: ${stats.storage_type} storage with ${stats.active_otps} active OTPs`);
      
      return res.status(200).json(response);

    } catch (statsError) {
      console.error('❌ Error getting stats:', statsError);
      return res.status(500).json({
        success: false,
        error: "Failed to retrieve statistics",
        details: process.env.NODE_ENV === 'development' ? statsError.message : undefined
      });
    }

  } catch (globalError) {
    console.error('❌ Unexpected error in stats handler:', globalError);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      details: process.env.NODE_ENV === 'development' ? globalError.message : undefined
    });
  }
}
