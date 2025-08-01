# EasyOTPAuth - Vercel Deployment Guide

This project is now configured for deployment on Vercel as a serverless function.

## 🚀 Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/siparrott/EasyOTPAuth)

## 📋 Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **SMTP Provider**: Gmail, SendGrid, Mailgun, etc.
3. **Redis Database** (Optional): Upstash, Redis Cloud, or any Redis provider

## 🔧 Environment Variables Setup

In your Vercel project dashboard, go to **Settings > Environment Variables** and add:

### Required Variables
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
```

### Optional Variables
```
MAIL_FROM="Your App Name <noreply@yourdomain.com>"
REDIS_URL=redis://username:password@hostname:port
LICENSE=your-license-key
NODE_ENV=production
```

## 📧 SMTP Provider Setup

### Gmail Setup
1. Enable 2FA on your Google account
2. Generate an App Password: [Google Account Settings](https://myaccount.google.com/apppasswords)
3. Use your Gmail address as `SMTP_USER`
4. Use the App Password as `SMTP_PASS`

### SendGrid Setup
```
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

### Mailgun Setup
```
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=your-mailgun-smtp-username
SMTP_PASS=your-mailgun-smtp-password
```

## 🗄️ Redis Setup (Recommended)

For production use, add a Redis database for better OTP storage:

### Upstash Redis (Free Tier Available)
1. Sign up at [upstash.com](https://upstash.com)
2. Create a Redis database
3. Copy the Redis URL to `REDIS_URL` environment variable

### Redis Cloud
1. Sign up at [redis.com](https://redis.com)
2. Create a database
3. Get connection string for `REDIS_URL`

## 🚀 Deployment Steps

### Option 1: Deploy via GitHub
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables
4. Deploy automatically

### Option 2: Deploy via Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### Option 3: Deploy via Git Integration
1. Connect your Git repository to Vercel
2. Set environment variables in Vercel dashboard
3. Push to main branch for automatic deployment

## 🧪 Testing Your Deployment

Once deployed, test the endpoints:

```bash
# Health check
curl https://your-app.vercel.app/health

# Request OTP
curl -X POST https://your-app.vercel.app/auth/request-code \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Verify OTP
curl -X POST https://your-app.vercel.app/auth/verify-code \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","code":"123456"}'
```

## 🔧 Local Development

```bash
# Install dependencies
npm install

# Install Vercel CLI
npm install -g vercel

# Run locally with Vercel dev server
npm run vercel-dev

# Or run with regular Node.js
npm run dev
```

## 📁 Project Structure for Vercel

```
├── api/
│   └── index.js          # Main serverless function
├── public/               # Static files
├── templates/            # Email templates
├── branding.json         # App branding
├── vercel.json          # Vercel configuration
├── package.json         # Dependencies
└── .env.example         # Environment variables template
```

## 🔒 Security Considerations

1. **JWT Secret**: Use a strong, random 32+ character secret
2. **SMTP Credentials**: Use app passwords, not main account passwords
3. **Rate Limiting**: Built-in rate limiting (5 requests per 15 minutes)
4. **HTTPS**: Vercel provides HTTPS by default
5. **Environment Variables**: Never commit secrets to code

## 🎨 Customization

### Branding
Edit `branding.json`:
```json
{
  "appName": "Your App Name",
  "logoUrl": "https://your-logo-url.com/logo.png",
  "supportEmail": "support@yourdomain.com"
}
```

### Email Templates
Customize templates in `templates/email/`:
- `otp.html.hbs` - HTML email template
- `otp.txt.hbs` - Plain text template

### Styling
Update `public/css/theme.css` for custom styling.

## 🐛 Troubleshooting

### Common Issues

1. **Email not sending**
   - Check SMTP credentials
   - Verify SMTP_HOST and SMTP_PORT
   - Check spam folder

2. **OTP codes not working**
   - Ensure Redis is connected (check logs)
   - Check if codes are expired (10-minute limit)

3. **Rate limiting issues**
   - Rate limit: 5 requests per 15 minutes per email
   - Clear browser data or wait

4. **JWT token issues**
   - Ensure JWT_SECRET is set and consistent
   - Check token expiration (7 days default)

### Logs
Check Vercel function logs in your dashboard under **Functions** tab.

## 📞 Support

For issues and questions:
- Check the [FAQ](docs/90-faq.md)
- Review Vercel logs
- Check environment variables
- Verify SMTP configuration

## 🔗 Useful Links

- [Vercel Documentation](https://vercel.com/docs)
- [Node.js Serverless Functions](https://vercel.com/docs/functions/serverless-functions/runtimes/node-js)
- [Environment Variables](https://vercel.com/docs/projects/environment-variables)
