# Email Service Configuration Guide

## SMTP Settings Configured

Your EasyOTPAuth application has been configured with the following SMTP settings:

- **SMTP Server**: smtp.easyname.com
- **Port**: 465
- **Security**: SSL/TLS
- **Email**: hello@easyotpauth.com
- **Username**: [CONFIGURED_IN_VERCEL]

## Local Development Setup

1. The `.env` file has been created with your SMTP configuration
2. To test locally, run: `npm start`
3. Visit http://localhost:3000 and test the "Try Demo" feature

## Vercel Production Deployment

To configure email service on Vercel, you need to add these environment variables in your Vercel dashboard:

### Step 1: Access Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Navigate to your EasyOTPAuth project
3. Go to Settings > Environment Variables

### Step 2: Add Environment Variables
Add the following environment variables exactly as shown:

| Variable Name | Value |
|---------------|-------|
| `SMTP_HOST` | `smtp.easyname.com` |
| `SMTP_PORT` | `465` |
| `SMTP_SECURE` | `true` |
| `SMTP_USER` | `[YOUR_SMTP_USERNAME]` |
| `SMTP_PASS` | `[YOUR_SMTP_PASSWORD]` |
| `MAIL_FROM` | `"EasyOTPAuth <hello@easyotpauth.com>"` |
| `JWT_SECRET` | `EasyOTPAuth-2025-SuperSecure-JWT-Secret-Change-In-Production` |
| `NODE_ENV` | `production` |
| `DOMAIN` | `https://easyotpauth.com` |

### Step 3: Deploy
1. After adding all environment variables, trigger a new deployment
2. Either push new changes to GitHub or manually redeploy from Vercel dashboard

## Testing Email Service

Once deployed:

1. Visit your live website (easyotpauth.com)
2. Click "Try Demo" 
3. Enter your email address
4. Check that you receive the OTP code
5. Enter the code to complete authentication

## Troubleshooting

### Common Issues:

1. **"Email service not configured" error**:
   - Verify all environment variables are set in Vercel
   - Ensure variable names match exactly (case-sensitive)
   - Redeploy after adding variables

2. **Email not received**:
   - Check spam/junk folders
   - Verify SMTP credentials are correct
   - Test with a different email address

3. **SMTP Authentication errors**:
   - Double-check username and password
   - Ensure your Easyname email account allows SMTP access
   - Verify port 465 with SSL is correct for Easyname

### Email Template Customization

Email templates are located in:
- HTML: `templates/email/otp.html.hbs`
- Text: `templates/email/otp.txt.hbs`

You can customize these templates to match your branding.

## Security Notes

- SMTP credentials are stored as environment variables (secure)
- Local `.env` file is git-ignored for security
- Use different credentials for development vs production if needed
- Consider using SendGrid or AWS SES for high-volume email sending

## Support

If you encounter issues:
1. Check Vercel deployment logs for error messages
2. Verify email account settings with Easyname
3. Test SMTP settings using a tool like Mailtrap or MailHog first
