#!/bin/bash

# EasyOTPAuth - Vercel Deployment Script

echo "🚀 EasyOTPAuth Vercel Deployment Helper"
echo "======================================"

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

echo "📋 Pre-deployment checklist:"
echo "  ✅ Environment variables configured in Vercel dashboard"
echo "  ✅ SMTP credentials tested"
echo "  ✅ JWT_SECRET set (32+ characters)"
echo "  ✅ Redis URL configured (optional but recommended)"
echo ""

read -p "Have you completed the checklist above? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Please complete the checklist first."
    echo "📖 See VERCEL_DEPLOYMENT.md for detailed instructions."
    exit 1
fi

echo "🔄 Starting deployment..."

# Login to Vercel (if not already logged in)
echo "🔐 Logging into Vercel..."
vercel login

# Deploy to production
echo "🚀 Deploying to production..."
vercel --prod

echo ""
echo "✅ Deployment complete!"
echo "🌐 Your app should be available at the URL shown above."
echo ""
echo "🧪 Test your deployment:"
echo "  curl https://your-domain.vercel.app/health"
echo ""
echo "📚 For troubleshooting, see VERCEL_DEPLOYMENT.md"
