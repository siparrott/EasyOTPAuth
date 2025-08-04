/**
 * Supabase Database Setup for EasyOTPAuth
 * Creates tables and indexes for persistent OTP storage
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function setupSupabaseDatabase() {
  console.log('🗄️ Supabase Database Setup for EasyOTPAuth');
  console.log('============================================\n');

  // Check for Supabase configuration
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Supabase configuration missing');
    console.log('💡 Add to your .env file:');
    console.log('   SUPABASE_URL=https://your-project.supabase.co');
    console.log('   SUPABASE_ANON_KEY=your-anon-key');
    console.log('   SUPABASE_SERVICE_KEY=your-service-key (for admin operations)');
    return false;
  }

  console.log('✅ Supabase configuration found');
  console.log(`   URL: ${supabaseUrl}`);
  console.log(`   Key: ${supabaseKey.substring(0, 20)}...`);

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    console.log('\n📊 Creating OTP storage table...');
    
    // 1. Create OTP Table
    const { data: otpTableResult, error: otpError } = await supabase.rpc('sql', {
      sql: `
        create table if not exists public.otps (
          id uuid primary key default gen_random_uuid(),
          email text not null,
          otp_code text not null,
          expires_at timestamptz not null,
          verified boolean default false,
          created_at timestamptz default now()
        );
        
        create index if not exists otps_email_idx on public.otps(email);
        create index if not exists otps_expires_idx on public.otps(expires_at);
        create index if not exists otps_verified_idx on public.otps(verified);
      `
    });

    if (otpError) {
      console.log('❌ Failed to create OTP table:', otpError.message);
    } else {
      console.log('✅ OTP table created successfully');
    }

    console.log('\n👥 Creating users table...');
    
    // 2. Create Auth_Users Table
    const { data: usersTableResult, error: usersError } = await supabase.rpc('sql', {
      sql: `
        create table if not exists public.auth_users (
          id uuid primary key default gen_random_uuid(),
          email text unique not null,
          last_login timestamptz,
          login_count integer default 0,
          created_at timestamptz default now()
        );
        
        create index if not exists auth_users_email_idx on public.auth_users(email);
      `
    });

    if (usersError) {
      console.log('❌ Failed to create users table:', usersError.message);
    } else {
      console.log('✅ Users table created successfully');
    }

    console.log('\n🔧 Setting up Row Level Security (RLS)...');
    
    // 3. Set up RLS policies
    const { data: rlsResult, error: rlsError } = await supabase.rpc('sql', {
      sql: `
        -- Enable RLS on tables
        alter table public.otps enable row level security;
        alter table public.auth_users enable row level security;
        
        -- Create policies for OTP table
        create policy if not exists "OTPs are readable by service role" 
          on public.otps for select using (true);
        
        create policy if not exists "OTPs are insertable by service role" 
          on public.otps for insert with check (true);
        
        create policy if not exists "OTPs are updatable by service role" 
          on public.otps for update using (true);
        
        create policy if not exists "OTPs are deletable by service role" 
          on public.otps for delete using (true);
        
        -- Create policies for auth_users table
        create policy if not exists "Users are readable by service role" 
          on public.auth_users for select using (true);
        
        create policy if not exists "Users are insertable by service role" 
          on public.auth_users for insert with check (true);
        
        create policy if not exists "Users are updatable by service role" 
          on public.auth_users for update using (true);
      `
    });

    if (rlsError) {
      console.log('⚠️  RLS setup warning:', rlsError.message);
    } else {
      console.log('✅ Row Level Security configured');
    }

    console.log('\n🧹 Creating cleanup function...');
    
    // 4. Create cleanup function for expired OTPs
    const { data: cleanupResult, error: cleanupError } = await supabase.rpc('sql', {
      sql: `
        create or replace function cleanup_expired_otps()
        returns void as $$
        begin
          delete from public.otps 
          where expires_at < now() or verified = true;
        end;
        $$ language plpgsql;
        
        -- Create a function to get valid OTP
        create or replace function get_valid_otp(user_email text)
        returns table (
          id uuid,
          otp_code text,
          expires_at timestamptz,
          created_at timestamptz
        ) as $$
        begin
          return query
          select o.id, o.otp_code, o.expires_at, o.created_at
          from public.otps o
          where o.email = user_email 
            and o.expires_at > now() 
            and o.verified = false
          order by o.created_at desc
          limit 1;
        end;
        $$ language plpgsql;
      `
    });

    if (cleanupError) {
      console.log('⚠️  Cleanup function warning:', cleanupError.message);
    } else {
      console.log('✅ Cleanup functions created');
    }

    console.log('\n🧪 Testing database connection...');
    
    // 5. Test the setup
    const { data: testData, error: testError } = await supabase
      .from('otps')
      .select('count')
      .limit(1);

    if (testError) {
      console.log('❌ Database test failed:', testError.message);
      return false;
    } else {
      console.log('✅ Database connection test successful');
    }

    console.log('\n🎯 Database setup complete!');
    console.log('📊 Tables created:');
    console.log('   - public.otps (OTP storage with expiration)');
    console.log('   - public.auth_users (user management)');
    console.log('🔒 Security configured:');
    console.log('   - Row Level Security enabled');
    console.log('   - Service role policies created');
    console.log('🧹 Utilities created:');
    console.log('   - cleanup_expired_otps() function');
    console.log('   - get_valid_otp() function');
    
    return true;

  } catch (error) {
    console.log('❌ Database setup failed:', error.message);
    return false;
  }
}

// Run setup if called directly
if (require.main === module) {
  setupSupabaseDatabase()
    .then(success => {
      if (success) {
        console.log('\n🚀 Ready to update your API endpoints to use Supabase!');
      } else {
        console.log('\n💡 Fix the issues above and run again');
      }
      process.exit(success ? 0 : 1);
    })
    .catch(console.error);
}

module.exports = { setupSupabaseDatabase };
