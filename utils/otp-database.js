/**
 * Database utilities for OTP operations with Supabase
 * Replaces in-memory global.otpStore with persistent storage
 */

const { createClient } = require('@supabase/supabase-js');

class OTPDatabase {
  constructor() {
    this.supabase = null;
    this.initialized = false;
  }

  // Initialize Supabase connection
  async init() {
    if (this.initialized) return;

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.log('⚠️ Supabase not configured, falling back to in-memory storage');
      return false;
    }

    try {
      this.supabase = createClient(supabaseUrl, supabaseKey);
      this.initialized = true;
      console.log('✅ Supabase OTP database initialized');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Supabase:', error.message);
      return false;
    }
  }

  // Store OTP in database
  async storeOTP(email, otp, expirationMinutes = 10) {
    if (!this.initialized) {
      const success = await this.init();
      if (!success) {
        // Fallback to in-memory storage
        return this.storeOTPInMemory(email, otp, expirationMinutes);
      }
    }

    try {
      const expiresAt = new Date(Date.now() + expirationMinutes * 60 * 1000).toISOString();
      
      // First, clean up any existing OTPs for this email
      await this.supabase
        .from('otps')
        .delete()
        .eq('email', email.toLowerCase());

      // Insert new OTP
      const { data, error } = await this.supabase
        .from('otps')
        .insert([
          {
            email: email.toLowerCase(),
            otp_code: otp.toString(),
            expires_at: expiresAt
          }
        ])
        .select();

      if (error) {
        console.error('❌ Database OTP storage failed:', error.message);
        return this.storeOTPInMemory(email, otp, expirationMinutes);
      }

      console.log(`✅ OTP stored in database for ${email}`);
      return { success: true, id: data[0]?.id };

    } catch (error) {
      console.error('❌ Database error storing OTP:', error.message);
      return this.storeOTPInMemory(email, otp, expirationMinutes);
    }
  }

  // Retrieve and verify OTP from database
  async verifyOTP(email, otp) {
    if (!this.initialized) {
      const success = await this.init();
      if (!success) {
        // Fallback to in-memory storage
        return this.verifyOTPInMemory(email, otp);
      }
    }

    try {
      // Get valid OTP for this email
      const { data, error } = await this.supabase
        .from('otps')
        .select('*')
        .eq('email', email.toLowerCase())
        .eq('otp_code', otp.toString())
        .eq('verified', false)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('❌ Database OTP verification failed:', error.message);
        return this.verifyOTPInMemory(email, otp);
      }

      if (!data || data.length === 0) {
        console.log(`❌ No valid OTP found for ${email}`);
        return { success: false, error: 'Invalid or expired OTP' };
      }

      const otpRecord = data[0];
      
      // Mark OTP as verified
      const { error: updateError } = await this.supabase
        .from('otps')
        .update({ verified: true })
        .eq('id', otpRecord.id);

      if (updateError) {
        console.error('❌ Failed to mark OTP as verified:', updateError.message);
      }

      console.log(`✅ OTP verified successfully for ${email}`);
      return { 
        success: true, 
        otpRecord: {
          id: otpRecord.id,
          email: otpRecord.email,
          created_at: otpRecord.created_at
        }
      };

    } catch (error) {
      console.error('❌ Database error verifying OTP:', error.message);
      return this.verifyOTPInMemory(email, otp);
    }
  }

  // Record successful authentication
  async recordAuthentication(email) {
    if (!this.initialized) return;

    try {
      // Insert or update user record
      const { data: existingUser } = await this.supabase
        .from('auth_users')
        .select('*')
        .eq('email', email.toLowerCase())
        .single();

      if (existingUser) {
        // Update existing user
        await this.supabase
          .from('auth_users')
          .update({
            last_login: new Date().toISOString(),
            login_count: (existingUser.login_count || 0) + 1
          })
          .eq('email', email.toLowerCase());
      } else {
        // Create new user
        await this.supabase
          .from('auth_users')
          .insert([
            {
              email: email.toLowerCase(),
              last_login: new Date().toISOString(),
              login_count: 1
            }
          ]);
      }

      console.log(`✅ Authentication recorded for ${email}`);
    } catch (error) {
      console.error('❌ Failed to record authentication:', error.message);
    }
  }

  // Clean up expired OTPs
  async cleanupExpiredOTPs() {
    if (!this.initialized) return;

    try {
      const { data, error } = await this.supabase
        .from('otps')
        .delete()
        .or('expires_at.lt.' + new Date().toISOString() + ',verified.eq.true');

      if (!error) {
        console.log(`🧹 Cleaned up expired OTPs`);
      }
    } catch (error) {
      console.error('❌ Failed to cleanup expired OTPs:', error.message);
    }
  }

  // Fallback methods for in-memory storage
  storeOTPInMemory(email, otp, expirationMinutes = 10) {
    if (!global.otpStore) {
      global.otpStore = new Map();
    }
    
    global.otpStore.set(email.toLowerCase(), {
      otp: otp.toString(),
      expires: Date.now() + expirationMinutes * 60 * 1000
    });

    console.log(`⚠️ OTP stored in memory for ${email} (fallback)`);
    return { success: true, fallback: true };
  }

  verifyOTPInMemory(email, otp) {
    if (!global.otpStore) {
      return { success: false, error: 'No OTP found' };
    }

    const storedData = global.otpStore.get(email.toLowerCase());
    
    if (!storedData) {
      return { success: false, error: 'No OTP found for this email' };
    }

    if (Date.now() > storedData.expires) {
      global.otpStore.delete(email.toLowerCase());
      return { success: false, error: 'OTP has expired' };
    }

    if (storedData.otp !== otp.toString()) {
      return { success: false, error: 'Invalid OTP' };
    }

    // Remove used OTP
    global.otpStore.delete(email.toLowerCase());
    
    console.log(`✅ OTP verified in memory for ${email} (fallback)`);
    return { success: true, fallback: true };
  }

  // Get storage type for debugging
  getStorageType() {
    return this.initialized ? 'database' : 'memory';
  }
}

// Create singleton instance
const otpDB = new OTPDatabase();

module.exports = {
  OTPDatabase,
  otpDB
};
