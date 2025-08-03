# Vercel Environment Variables Setup Guide

## Current Issue: Email Not Being Received

The OTP emails are not being sent because the SMTP environment variables are not configured in your Vercel deployment.

## Step-by-Step Fix

### 1. Access Vercel Dashboard
1. Go to [vercel.com](https://vercel.com) and log in
2. Click on your **EasyOTPAuth** project
3. Go to **Settings** tab
4. Click **Environment Variables** in the left sidebar

### 2. Add Required Environment Variables

Add these **exact** environment variables (case-sensitive):

| Variable Name | Value | Environment |
|---------------|-------|-------------|
| `SMTP_HOST` | `smtp.easyname.com` | Production, Preview, Development |
| `SMTP_PORT` | `465` | Production, Preview, Development |
| `SMTP_SECURE` | `true` | Production, Preview, Development |
| `SMTP_USER` | `[YOUR_SMTP_USERNAME]` | Production, Preview, Development |
| `SMTP_PASS` | `[YOUR_SMTP_PASSWORD]` | Production, Preview, Development |
| `MAIL_FROM` | `"EasyOTPAuth <hello@easyotpauth.com>"` | Production, Preview, Development |
| `JWT_SECRET` | `EasyOTPAuth-2025-SuperSecure-JWT-Secret-Change-In-Production` | Production, Preview, Development |
| `NODE_ENV` | `production` | Production |
| `DOMAIN` | `https://easyotpauth.com` | Production, Preview, Development |

### 3. Important Notes

- **Environment Scope**: Make sure to check all three environments (Production, Preview, Development) for each variable
- **Case Sensitivity**: Variable names must be EXACTLY as shown above
- **No Quotes**: Don't add extra quotes around values in Vercel (except for MAIL_FROM which needs quotes in the value)
- **Redeploy Required**: After adding variables, you MUST redeploy

### 4. How to Add Each Variable

For each variable:
1. Click **Add New**
2. Enter the **Variable Name** exactly as shown
3. Enter the **Value** exactly as shown
4. Select all environments: **Production**, **Preview**, **Development**
5. Click **Save**

### 5. Force Redeploy

After adding all variables:
1. Go to **Deployments** tab
2. Find the latest deployment
3. Click the **⋯** menu next to it
4. Click **Redeploy**
5. Or push a new commit to trigger automatic deployment

### 6. Test the Configuration

After redeployment:
1. Visit: `https://easyotpauth.com/email-config-test`
2. This will show if all environment variables are properly configured
3. You should see all variables as "configured" instead of "missing"

### 7. Test Email Sending

1. Go to your homepage
2. Click "Try Demo"
3. Enter an email address
4. You should receive the OTP code within 30 seconds

## Troubleshooting

### If emails still don't work after setup:

1. **Check Easyname SMTP Settings**:
   - Verify SMTP is enabled in your Easyname account
   - Confirm username: `[YOUR_SMTP_USERNAME]`
   - Confirm password: `[YOUR_SMTP_PASSWORD]`
   - Confirm server: `smtp.easyname.com`
   - Confirm port: `465` with SSL

2. **Check Vercel Logs**:
   - Go to **Functions** tab in Vercel
   - Click on your deployment
   - Check for SMTP errors in the logs

3. **Alternative SMTP Options**:
   If Easyname doesn't work, you can try:
   - **Gmail**: Use app passwords with `smtp.gmail.com:587`
   - **SendGrid**: Professional email service
   - **Mailgun**: Reliable email API

### Common Vercel Variable Mistakes:

- ❌ Adding quotes around variable names
- ❌ Not selecting all environments 
- ❌ Typos in variable names (case-sensitive)
- ❌ Not redeploying after adding variables
- ❌ Using wrong port numbers

### Quick Fix Command

If you prefer CLI, you can use Vercel CLI:

```bash
vercel env add SMTP_HOST
# Enter: smtp.easyname.com

vercel env add SMTP_PORT  
# Enter: 465

vercel env add SMTP_SECURE
# Enter: true

vercel env add SMTP_USER
# Enter: [YOUR_SMTP_USERNAME]

vercel env add SMTP_PASS
# Enter: [YOUR_SMTP_PASSWORD]

vercel env add MAIL_FROM
# Enter: "EasyOTPAuth <hello@easyotpauth.com>"

# Then redeploy
vercel --prod
```

## After Setup

Once configured correctly, your demo should work perfectly and users will receive OTP codes within seconds.

The diagnostic endpoint at `/email-config-test` will help confirm everything is set up properly.
