/**
 * Supabase Database Setup for EasyOTPAuth
 * Creates tables for persistent OTP storage
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function setupDatabase() {
  console.log('🗄️ EasyOTPAuth Database Setup');
  console.log('=============================\n');

  // Read environment variables
  let envVars = {};
  try {
    const envContent = fs.readFileSync('.env', 'utf8');
    const lines = envContent.split('\n');
    
    lines.forEach(line => {
      if (line.trim() && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          envVars[key.trim()] = valueParts.join('=').trim().replace(/"/g, '');
        }
      }
    });
  } catch (error) {
    console.log('❌ Could not read .env file:', error.message);
    return;
  }

  // Check for Supabase configuration
  const supabaseUrl = envVars.SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = envVars.SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Missing Supabase configuration');
    console.log('💡 Add these to your .env file:');
    console.log('   SUPABASE_URL=https://your-project.supabase.co');
    console.log('   SUPABASE_ANON_KEY=your-anon-key');
    console.log('   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key');
    return;
  }

  try {
    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Connected to Supabase');

    // 1. Create OTP Table
    console.log('\n📋 Creating OTP table...');
    
    const { data: otpTable, error: otpError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Create OTP table for persistent storage
        create table if not exists public.otps (
          id uuid primary key default gen_random_uuid(),
          email text not null,
          otp_code text not null,
          expires_at timestamptz not null,
          verified boolean default false,
          created_at timestamptz default now()
        );
        
        -- Create indexes for performance
        create index if not exists otps_email_idx on public.otps(email);
        create index if not exists otps_expires_idx on public.otps(expires_at);
        create index if not exists otps_verified_idx on public.otps(verified);
        
        -- Enable RLS (Row Level Security)
        alter table public.otps enable row level security;
        
        -- Create policy for OTP operations
        create policy if not exists "Allow OTP operations" on public.otps
          for all using (true);
      `
    });

    if (otpError) {
      console.log('❌ Error creating OTP table:', otpError.message);
    } else {
      console.log('✅ OTP table created successfully');
    }

    // 2. Create Auth Users Table (for future use)
    console.log('\n👤 Creating auth_users table...');
    
    const { data: usersTable, error: usersError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Create users table for authenticated users
        create table if not exists public.auth_users (
          id uuid primary key default gen_random_uuid(),
          email text unique not null,
          created_at timestamptz default now(),
          last_login timestamptz,
          login_count integer default 0
        );
        
        -- Create indexes
        create index if not exists auth_users_email_idx on public.auth_users(email);
        
        -- Enable RLS
        alter table public.auth_users enable row level security;
        
        -- Create policy for user operations
        create policy if not exists "Allow user operations" on public.auth_users
          for all using (true);
      `
    });

    if (usersError) {
      console.log('❌ Error creating auth_users table:', usersError.message);
    } else {
      console.log('✅ auth_users table created successfully');
    }

    // 3. Create cleanup function for expired OTPs
    console.log('\n🧹 Creating cleanup function...');
    
    const { data: cleanupFunc, error: cleanupError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Function to clean up expired OTPs
        create or replace function cleanup_expired_otps()
        returns void as $$
        begin
          delete from public.otps 
          where expires_at < now() or verified = true;
        end;
        $$ language plpgsql;
        
        -- Function to get valid OTP
        create or replace function get_valid_otp(user_email text, otp_input text)
        returns table(id uuid, email text, otp_code text, created_at timestamptz) as $$
        begin
          return query
          select o.id, o.email, o.otp_code, o.created_at
          from public.otps o
          where o.email = user_email 
            and o.otp_code = otp_input
            and o.expires_at > now()
            and o.verified = false
          order by o.created_at desc
          limit 1;
        end;
        $$ language plpgsql;
      `
    });

    if (cleanupError) {
      console.log('⚠️ Error creating functions:', cleanupError.message);
    } else {
      console.log('✅ Database functions created');
    }

    // 4. Test the setup
    console.log('\n🧪 Testing database operations...');
    
    // Insert test OTP
    const testEmail = 'test@example.com';
    const testOTP = '123456';
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    
    const { data: insertResult, error: insertError } = await supabase
      .from('otps')
      .insert([
        {
          email: testEmail,
          otp_code: testOTP,
          expires_at: expiresAt
        }
      ])
      .select();

    if (insertError) {
      console.log('❌ Test insert failed:', insertError.message);
    } else {
      console.log('✅ Test OTP inserted');
      
      // Retrieve test OTP
      const { data: selectResult, error: selectError } = await supabase
        .from('otps')
        .select('*')
        .eq('email', testEmail)
        .eq('otp_code', testOTP);

      if (selectError) {
        console.log('❌ Test select failed:', selectError.message);
      } else {
        console.log('✅ Test OTP retrieved:', selectResult.length, 'records');
      }

      // Clean up test data
      const { error: deleteError } = await supabase
        .from('otps')
        .delete()
        .eq('email', testEmail);

      if (!deleteError) {
        console.log('✅ Test data cleaned up');
      }
    }

    console.log('\n🎯 Database setup complete!');
    console.log('📋 Next steps:');
    console.log('   1. Update API endpoints to use Supabase instead of global.otpStore');
    console.log('   2. Test OTP flow with persistent storage');
    console.log('   3. Set up periodic cleanup of expired OTPs');

  } catch (error) {
    console.log('❌ Database setup failed:', error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('   - Verify Supabase URL and keys are correct');
    console.log('   - Check network connection');
    console.log('   - Ensure Supabase project is active');
  }
}

// Run setup if called directly
if (require.main === module) {
  setupDatabase().catch(console.error);
}

module.exports = { setupDatabase };
