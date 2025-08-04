# Supabase Integration Guide for EasyOTPAuth

## Overview
Your EasyOTPAuth system has been upgraded to use Supabase for persistent OTP storage, replacing the in-memory solution. This provides better reliability and persistence across server restarts.

## Required Environment Variables

Add these to your `.env` file and Vercel environment settings:

```env
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
# OR alternatively use:
# SUPABASE_ANON_KEY=your_supabase_anon_key

# Existing variables (keep these)
SMTP_HOST=your_smtp_host
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
JWT_SECRET=your_jwt_secret
```

## Setup Instructions

### 1. Create Supabase Project
1. Visit [https://supabase.com](https://supabase.com)
2. Create a new project
3. Get your project URL and service key from Settings > API

### 2. Install Dependencies
```bash
npm install @supabase/supabase-js
```

### 3. Run Database Setup
```bash
node setup-supabase.js
```

This will:
- Create the `otps` and `auth_users` tables
- Set up Row Level Security policies
- Create utility functions

### 4. Update Environment Variables
Add your Supabase credentials to:
- Local `.env` file
- Vercel environment variables (if deploying to Vercel)

## Database Schema

### OTPs Table
```sql
CREATE TABLE public.otps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    otp_code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### Auth Users Table
```sql
CREATE TABLE public.auth_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    last_login TIMESTAMP WITH TIME ZONE DEFAULT now(),
    login_count INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

## Features

### Automatic Fallback
If Supabase is not configured, the system automatically falls back to in-memory storage.

### OTP Management
- ✅ Persistent storage across server restarts
- ✅ Automatic cleanup of expired OTPs
- ✅ User login tracking
- ✅ Row Level Security for data protection

### Monitoring
Access system stats at: `/api/stats`

Example response:
```json
{
  "success": true,
  "stats": {
    "storage_type": "supabase",
    "active_otps": 3,
    "total_users": 15,
    "environment": "production"
  }
}
```

## Row Level Security (RLS)

The database uses RLS policies to ensure security:
- Service key has full access for OTP operations
- Anonymous users cannot directly access data
- All operations go through API endpoints

## Troubleshooting

### Fallback Mode
If you see "⚠️ OTP stored in memory (fallback mode)", check:
1. Environment variables are set correctly
2. Supabase project is active
3. Service key has proper permissions

### Connection Issues
- Verify your Supabase project URL format: `https://your-project.supabase.co`
- Ensure service key starts with `eyJ...`
- Check Supabase project status

### Database Access
Use the Supabase dashboard to:
- View OTP records in real-time
- Monitor user login activity
- Check system performance

## Migration Benefits

✅ **Persistent Storage**: OTPs survive server restarts
✅ **Scalability**: Database handles concurrent users
✅ **Analytics**: Track user login patterns
✅ **Reliability**: No data loss from memory limitations
✅ **Security**: Row Level Security policies
✅ **Monitoring**: Real-time stats and cleanup

Your OTP authentication system is now production-ready with reliable database storage!
