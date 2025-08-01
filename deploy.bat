@echo off
REM EasyOTPAuth - Vercel Deployment Script for Windows

echo 🚀 EasyOTPAuth Vercel Deployment Helper
echo ======================================

REM Check if Vercel CLI is installed
vercel --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Vercel CLI not found. Installing...
    npm install -g vercel
)

echo 📋 Pre-deployment checklist:
echo   ✅ Environment variables configured in Vercel dashboard
echo   ✅ SMTP credentials tested
echo   ✅ JWT_SECRET set (32+ characters)
echo   ✅ Redis URL configured (optional but recommended)
echo.

set /p "confirm=Have you completed the checklist above? (y/N): "
if /i not "%confirm%"=="y" (
    echo ❌ Please complete the checklist first.
    echo 📖 See VERCEL_DEPLOYMENT.md for detailed instructions.
    pause
    exit /b 1
)

echo 🔄 Starting deployment...

REM Login to Vercel (if not already logged in)
echo 🔐 Logging into Vercel...
vercel login

REM Deploy to production
echo 🚀 Deploying to production...
vercel --prod

echo.
echo ✅ Deployment complete!
echo 🌐 Your app should be available at the URL shown above.
echo.
echo 🧪 Test your deployment:
echo   curl https://your-domain.vercel.app/health
echo.
echo 📚 For troubleshooting, see VERCEL_DEPLOYMENT.md
pause
