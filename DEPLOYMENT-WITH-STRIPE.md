# 🚀 EasyOTPAuth with Stripe Integration - Deployment Guide

This guide will walk you through deploying your EasyOTPAuth system with full Stripe payment integration.

## 📋 Prerequisites

Before you start, make sure you have:

- [ ] A Stripe account (create at [stripe.com](https://stripe.com))
- [ ] A Vercel account (for deployment)
- [ ] A Redis instance (Redis Cloud, AWS ElastiCache, or local)
- [ ] An SMTP email service (Gmail, SendGrid, etc.)
- [ ] Node.js 18+ installed locally

## 🏗️ Step 1: Local Development Setup

### 1.1 Install Dependencies

First, install the required packages (you may need to run this in an administrator terminal on Windows):

```bash
npm install
```

If you encounter PowerShell execution policy issues on Windows:
```bash
# Option 1: Use cmd instead of PowerShell
# Option 2: Run in administrator PowerShell:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### 1.2 Environment Configuration

Copy the environment template:
```bash
cp .env.example .env
```

Edit `.env` with your actual values:
```bash
# Basic Configuration
NODE_ENV=development
DOMAIN=http://localhost:3000
JWT_SECRET=your-super-secure-jwt-secret-here

# Email (required for OTP sending)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Redis (optional, uses in-memory if not provided)
REDIS_URL=redis://localhost:6379

# Stripe (we'll set these up next)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## 💳 Step 2: Stripe Setup

### 2.1 Get Stripe API Keys

1. Log in to your [Stripe Dashboard](https://dashboard.stripe.com)
2. Go to **Developers** > **API keys**
3. Copy your **Publishable key** and **Secret key**
4. Add them to your `.env` file

### 2.2 Create Stripe Products

Run the setup script to create your products and pricing:

```bash
node scripts/setup-stripe-products.js
```

This will:
- Create Starter, Professional, and Enterprise products in Stripe
- Generate monthly and yearly pricing
- Output the Price IDs you need for your environment variables

### 2.3 Configure Webhooks

1. In Stripe Dashboard, go to **Developers** > **Webhooks**
2. Click **Add endpoint**
3. Add your webhook URL: `https://your-domain.vercel.app/api/stripe-webhook`
4. Select these events:
   - `checkout.session.completed`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the **Signing secret** and add it to your `.env` as `STRIPE_WEBHOOK_SECRET`

## 🧪 Step 3: Local Testing

### 3.1 Start Development Server

```bash
npm run dev
```

Your server should start at `http://localhost:3000`

### 3.2 Test Basic Functionality

1. Visit `http://localhost:3000`
2. Try the demo OTP widget
3. Check that emails are being sent

### 3.3 Test Stripe Integration

1. Go to the pricing section
2. Click "Start Free Trial" on any plan
3. Enter a test email
4. Use Stripe test card: `4242424242424242`
5. Verify the payment flow works

### 3.4 Test Webhooks Locally

Install Stripe CLI:
```bash
# Install Stripe CLI (visit stripe.com/docs/stripe-cli)
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/stripe-webhook
```

In another terminal, trigger test events:
```bash
stripe trigger checkout.session.completed
```

## 🌐 Step 4: Production Deployment

### 4.1 Prepare for Production

1. **Switch to Live Stripe Keys**:
   - Get live API keys from Stripe Dashboard
   - Update webhook endpoint to production URL

2. **Update Environment Variables**:
   ```bash
   NODE_ENV=production
   DOMAIN=https://your-domain.vercel.app
   STRIPE_SECRET_KEY=sk_live_...
   # ... other production values
   ```

3. **Test Everything**:
   - Test with real payment methods
   - Verify webhook delivery
   - Check email delivery

### 4.2 Deploy to Vercel

1. **Connect to Vercel**:
   ```bash
   npm install -g vercel
   vercel login
   vercel
   ```

2. **Set Environment Variables**:
   In Vercel Dashboard > Settings > Environment Variables, add all your production environment variables.

3. **Deploy**:
   ```bash
   vercel --prod
   ```

### 4.3 Configure Production Webhooks

1. Update your Stripe webhook endpoint to: `https://your-domain.vercel.app/api/stripe-webhook`
2. Test webhook delivery in Stripe Dashboard

## 🔍 Step 5: Testing & Verification

### 5.1 End-to-End Testing Checklist

- [ ] Homepage loads correctly
- [ ] Demo OTP widget works
- [ ] Pricing buttons redirect to Stripe Checkout
- [ ] Test payments complete successfully
- [ ] Customers receive welcome emails with API keys
- [ ] Dashboard is accessible with API key
- [ ] API endpoints work with customer API keys
- [ ] Usage tracking functions correctly
- [ ] Webhook events are processed
- [ ] Billing portal access works

### 5.2 Production Testing

**Test with small real payment**:
1. Make a real $1 payment to verify everything works
2. Immediately refund it in Stripe Dashboard
3. Verify customer was created and received access

### 5.3 Monitoring Setup

Set up monitoring for production:
- Monitor Stripe webhook delivery success
- Track API usage and errors
- Monitor payment success rates
- Set up alerts for failed payments

## 📊 Step 6: Go-Live Checklist

### 6.1 Pre-Launch

- [ ] All tests pass
- [ ] Stripe webhooks working
- [ ] Email delivery confirmed
- [ ] Customer dashboard functional
- [ ] API documentation updated
- [ ] Support email configured
- [ ] Backup systems in place
- [ ] Monitoring enabled

### 6.2 Launch Day

- [ ] Deploy to production
- [ ] Update DNS if needed
- [ ] Test first real customer flow
- [ ] Monitor error logs
- [ ] Verify payment processing
- [ ] Check email deliverability

### 6.3 Post-Launch

- [ ] Monitor payment success rates
- [ ] Track customer activation
- [ ] Collect user feedback
- [ ] Optimize conversion rates
- [ ] Plan feature improvements

## 🆘 Troubleshooting

### Common Issues

**PowerShell Execution Policy**:
```bash
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**Stripe Webhook Signature Verification Failed**:
- Check webhook secret matches exactly
- Ensure raw body is passed to Stripe verification

**Email Not Sending**:
- Verify SMTP credentials
- Check firewall/security settings
- Test with a simple SMTP client

**Customer Not Created After Payment**:
- Check webhook events are being received
- Verify webhook endpoint is accessible
- Check server logs for errors

### Debug Commands

```bash
# Check webhook events
stripe events list

# Test webhook endpoint
curl -X POST https://your-domain.vercel.app/api/stripe-webhook

# Check API functionality
curl -X POST https://your-domain.vercel.app/auth/request-code \
  -H "X-API-Key: your-customer-api-key" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

## 📈 Scaling Considerations

### Database Migration

For production scale, consider migrating from in-memory storage to PostgreSQL:

1. Set up PostgreSQL database
2. Add `DATABASE_URL` to environment variables
3. Implement database migrations
4. Update customer management to use database

### Redis Optimization

For high-volume OTP handling:
- Use Redis cluster for reliability
- Implement connection pooling
- Monitor Redis performance

### Email Delivery

For large-scale email sending:
- Consider dedicated email services (SendGrid, AWS SES)
- Implement email queues
- Monitor delivery rates

## 🎯 Success Metrics

Track these metrics after deployment:

- **Payment Success Rate**: >95%
- **Webhook Delivery Success**: >99%
- **Customer Activation Rate**: >80%
- **API Response Time**: <200ms
- **Email Delivery Rate**: >98%

## 🎉 Congratulations!

Your EasyOTPAuth system with Stripe integration is now live! You have:

✅ **Automated Payment Processing**: Customers can subscribe and pay instantly
✅ **Instant Product Delivery**: API keys generated automatically
✅ **Usage Tracking**: Monitor and limit API usage by plan
✅ **Customer Management**: Full dashboard and billing portal
✅ **Scalable Architecture**: Ready to handle thousands of customers

Your system is now generating revenue automatically! 🚀

---

## 📞 Support

If you need help with deployment:

- 📧 Email: support@easyotpauth.com
- 📚 Documentation: [docs.easyotpauth.com](https://docs.easyotpauth.com)
- 🐛 Issues: [GitHub Issues](https://github.com/your-repo/issues)
