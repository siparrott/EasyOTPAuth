# ⚡ 30-Minute Stripe Setup Guide

Get your EasyOTPAuth payment system live in 30 minutes!

## 🎯 What You'll Have After Setup

✅ **Fully Automated SaaS Business**
- Customers pay → Instantly get API keys
- Professional dashboard with usage tracking
- Automated billing and subscription management
- Welcome emails with setup instructions
- No manual work required!

---

## ⏱️ **Step 1: Get Stripe API Keys** (5 minutes)

1. **Sign up for Stripe**: Go to [stripe.com](https://stripe.com) and create an account
2. **Get Test Keys**: Dashboard → Developers → API keys
   - Copy **Publishable key** (starts with `pk_test_`)
   - Copy **Secret key** (starts with `sk_test_`)
3. **Save these keys** - you'll need them in Step 3

---

## ⏱️ **Step 2: Install Dependencies** (5 minutes)

If you haven't already, install the required packages:

```bash
# If you encounter issues with npm on Windows:
# Option 1: Use cmd instead of PowerShell
# Option 2: Run in administrator PowerShell:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Install dependencies
npm install stripe uuid
```

---

## ⏱️ **Step 3: Create Stripe Products** (5 minutes)

1. **Add your Stripe keys to environment**:
   Create a `.env` file with:
   ```bash
   STRIPE_SECRET_KEY=sk_test_your_key_here
   DOMAIN=http://localhost:3000
   ```

2. **Run the setup script**:
   ```bash
   node scripts/setup-stripe-products.js
   ```

   This creates your products in Stripe and outputs the Price IDs you need.

3. **Copy the Price IDs** from the output and add them to your `.env`:
   ```bash
   STRIPE_PRICE_STARTER_MONTHLY=price_1abc123
   STRIPE_PRICE_PROFESSIONAL_MONTHLY=price_1def456
   ```

---

## ⏱️ **Step 4: Configure Environment** (5 minutes)

Update your `.env` file with all required settings:

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

# Stripe (from steps above)
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_PRICE_STARTER_MONTHLY=price_1abc123
STRIPE_PRICE_PROFESSIONAL_MONTHLY=price_1def456

# Optional: Redis for better performance
REDIS_URL=redis://localhost:6379
```

---

## ⏱️ **Step 5: Test Locally** (5 minutes)

1. **Start the server**:
   ```bash
   npm run dev
   ```

2. **Test the payment flow**:
   - Go to `http://localhost:3000`
   - Scroll to pricing section
   - Click "Start Free Trial" on any plan
   - Enter your email
   - Use test card: `4242424242424242`
   - Verify you get redirected to success page

3. **Check the logs** to see if customer was created

---

## ⏱️ **Step 6: Setup Webhooks** (5 minutes)

1. **Install Stripe CLI**:
   - Download from [stripe.com/docs/stripe-cli](https://stripe.com/docs/stripe-cli)
   - Run: `stripe login`

2. **Forward webhooks to local server**:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe-webhook
   ```

3. **Copy the webhook secret** from the output and add to `.env`:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
   ```

4. **Test webhook processing**:
   ```bash
   # In another terminal:
   stripe trigger checkout.session.completed
   ```

---

## 🎉 **You're Done!**

Your system now:
- ✅ Accepts real payments
- ✅ Creates customers automatically
- ✅ Generates API keys instantly
- ✅ Sends welcome emails
- ✅ Provides customer dashboard
- ✅ Tracks usage and enforces limits

## 🧪 **Quick Test Checklist**

- [ ] Payment buttons work on homepage
- [ ] Stripe checkout opens correctly
- [ ] Test payment completes successfully
- [ ] Customer dashboard accessible
- [ ] API key works for authentication
- [ ] Usage tracking functions
- [ ] Webhooks process correctly

## 🚀 **Ready for Production?**

When you're ready to go live:

1. **Get Live Stripe Keys**: Dashboard → API keys (toggle to Live)
2. **Update Environment**: Switch to live keys in production
3. **Deploy to Vercel**: `vercel --prod`
4. **Update Webhook URL**: Point to your production domain
5. **Test with Real Payment**: Make a small payment and refund it

## 📧 **Example Customer Experience**

After payment, customers receive:

### 1. **Welcome Email** with:
- Their unique API key
- Dashboard access link
- Quick start code examples
- Support information

### 2. **Dashboard Access** with:
- Real-time usage statistics
- API key management
- Billing information
- Code examples
- Account management

### 3. **Immediate API Access**:
```bash
curl -X POST https://your-domain.com/auth/request-code \
  -H "X-API-Key: THEIR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```

## 💰 **Revenue Potential**

With this 30-minute setup, you can realistically achieve:

- **$1,000+/month** with 10-20 active customers
- **$10,000+/month** with 100+ active customers
- **Completely automated** - no manual intervention needed
- **Professional experience** - comparable to major SaaS platforms

## 🆘 **Need Help?**

If you run into issues:

1. **Check the logs** in your terminal
2. **Verify environment variables** are set correctly
3. **Test Stripe keys** in Stripe Dashboard
4. **Check webhook delivery** in Stripe Dashboard
5. **Contact support**: The system is designed to be self-explanatory

## 🎯 **What's Next?**

After basic setup:
- Add more payment plans
- Implement annual billing (20% discount)
- Add usage-based pricing
- Create enterprise custom pricing
- Build affiliate program
- Add customer testimonials
- Implement referral bonuses

**Your automated SaaS business is now live! 🚀**
