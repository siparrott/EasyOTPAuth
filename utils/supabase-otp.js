/**
 * Supabase OTP Storage Utilities
 * Replaces in-memory global.otpStore with persistent database storage
 */

const { createClient } = require('@supabase/supabase-js');

class SupabaseOTPStore {
  constructor() {
    this.supabase = null;
    this.initialized = false;
  }

  // Initialize Supabase client
  init() {
    if (this.initialized) return this.supabase;

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.log('⚠️  Supabase not configured, falling back to in-memory storage');
      return null;
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.initialized = true;
    console.log('✅ Supabase OTP storage initialized');
    return this.supabase;
  }

  // Store OTP in database
  async storeOTP(email, otpCode, expirationMinutes = 10) {
    const supabase = this.init();
    if (!supabase) {
      // Fallback to global.otpStore
      return this.storeOTPMemory(email, otpCode, expirationMinutes);
    }

    try {
      // Clean up any existing OTPs for this email first
      await supabase
        .from('otps')
        .delete()
        .eq('email', email.toLowerCase());

      // Calculate expiration time
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + expirationMinutes);

      // Insert new OTP
      const { data, error } = await supabase
        .from('otps')
        .insert({
          email: email.toLowerCase(),
          otp_code: otpCode,
          expires_at: expiresAt.toISOString(),
          verified: false
        })
        .select()
        .single();

      if (error) {
        console.log('❌ Failed to store OTP in database:', error.message);
        // Fallback to memory storage
        return this.storeOTPMemory(email, otpCode, expirationMinutes);
      }

      console.log(`✅ OTP stored in database for ${email}, expires at ${expiresAt.toISOString()}`);
      return data;

    } catch (error) {
      console.log('❌ Database error storing OTP:', error.message);
      // Fallback to memory storage
      return this.storeOTPMemory(email, otpCode, expirationMinutes);
    }
  }

  // Retrieve and verify OTP from database
  async verifyOTP(email, otpCode) {
    const supabase = this.init();
    if (!supabase) {
      // Fallback to global.otpStore
      return this.verifyOTPMemory(email, otpCode);
    }

    try {
      // Find valid OTP for this email
      const { data, error } = await supabase
        .from('otps')
        .select('*')
        .eq('email', email.toLowerCase())
        .eq('verified', false)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.log('❌ Failed to retrieve OTP from database:', error.message);
        return this.verifyOTPMemory(email, otpCode);
      }

      if (!data || data.length === 0) {
        console.log(`❌ No valid OTP found for ${email}`);
        return { success: false, error: 'No valid OTP found' };
      }

      const otpRecord = data[0];

      // Verify the OTP code
      if (otpRecord.otp_code !== otpCode) {
        console.log(`❌ Invalid OTP for ${email}: expected ${otpRecord.otp_code}, got ${otpCode}`);
        return { success: false, error: 'Invalid OTP code' };
      }

      // Mark OTP as verified
      const { error: updateError } = await supabase
        .from('otps')
        .update({ verified: true })
        .eq('id', otpRecord.id);

      if (updateError) {
        console.log('⚠️  Failed to mark OTP as verified:', updateError.message);
      }

      console.log(`✅ OTP verified successfully for ${email}`);
      return { 
        success: true, 
        data: otpRecord,
        message: 'OTP verified successfully' 
      };

    } catch (error) {
      console.log('❌ Database error verifying OTP:', error.message);
      return this.verifyOTPMemory(email, otpCode);
    }
  }

  // Create or update user record
  async upsertUser(email) {
    const supabase = this.init();
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('auth_users')
        .upsert({
          email: email.toLowerCase(),
          last_login: new Date().toISOString(),
          login_count: 1
        }, {
          onConflict: 'email'
        })
        .select()
        .single();

      if (!error && data) {
        // Update login count if user already exists
        await supabase.rpc('sql', {
          sql: `
            update public.auth_users 
            set login_count = login_count + 1, last_login = now() 
            where email = '${email.toLowerCase()}'
          `
        });
      }

      return data;
    } catch (error) {
      console.log('⚠️  Failed to upsert user:', error.message);
      return null;
    }
  }

  // Cleanup expired OTPs
  async cleanupExpiredOTPs() {
    const supabase = this.init();
    if (!supabase) return;

    try {
      const { data, error } = await supabase
        .from('otps')
        .delete()
        .or(`expires_at.lt.${new Date().toISOString()},verified.eq.true`);

      if (!error) {
        console.log(`🧹 Cleaned up expired/verified OTPs`);
      }
    } catch (error) {
      console.log('⚠️  Cleanup failed:', error.message);
    }
  }

  // Fallback to in-memory storage
  storeOTPMemory(email, otpCode, expirationMinutes) {
    if (!global.otpStore) {
      global.otpStore = new Map();
    }
    
    const expiresAt = Date.now() + (expirationMinutes * 60 * 1000);
    global.otpStore.set(email.toLowerCase(), {
      otp: otpCode,
      expires: expiresAt
    });

    console.log(`⚠️  OTP stored in memory for ${email} (fallback mode)`);
    return { email, otp_code: otpCode, expires_at: new Date(expiresAt) };
  }

  verifyOTPMemory(email, otpCode) {
    if (!global.otpStore) {
      return { success: false, error: 'No OTP store found' };
    }

    const storedData = global.otpStore.get(email.toLowerCase());
    if (!storedData) {
      return { success: false, error: 'No OTP found for this email' };
    }

    if (Date.now() > storedData.expires) {
      global.otpStore.delete(email.toLowerCase());
      return { success: false, error: 'OTP has expired' };
    }

    if (storedData.otp !== otpCode) {
      return { success: false, error: 'Invalid OTP code' };
    }

    global.otpStore.delete(email.toLowerCase());
    console.log(`✅ OTP verified from memory for ${email} (fallback mode)`);
    return { 
      success: true, 
      data: { email, otp_code: otpCode },
      message: 'OTP verified successfully' 
    };
  }

  // Get storage statistics
  async getStats() {
    const supabase = this.init();
    if (!supabase) {
      const memoryCount = global.otpStore ? global.otpStore.size : 0;
      return {
        storage_type: 'memory',
        active_otps: memoryCount,
        total_users: 0
      };
    }

    try {
      const { data: otpCount } = await supabase
        .from('otps')
        .select('count')
        .eq('verified', false)
        .gt('expires_at', new Date().toISOString());

      const { data: userCount } = await supabase
        .from('auth_users')
        .select('count');

      return {
        storage_type: 'supabase',
        active_otps: otpCount?.[0]?.count || 0,
        total_users: userCount?.[0]?.count || 0
      };
    } catch (error) {
      return {
        storage_type: 'supabase',
        active_otps: 'unknown',
        total_users: 'unknown',
        error: error.message
      };
    }
  }
}

// Create singleton instance
const otpStore = new SupabaseOTPStore();

module.exports = {
  SupabaseOTPStore,
  otpStore
};
