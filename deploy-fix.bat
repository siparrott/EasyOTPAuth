@echo off
echo 🚀 Deploying Frontend Fix to Vercel
echo ===================================
echo.

echo 📤 Deploying to Vercel...
vercel --prod

echo.
echo ⚠️  IMPORTANT: Make sure these environment variables are set in Vercel:
echo    SMTP_HOST=smtp.easyname.com
echo    SMTP_PORT=465
echo    SMTP_SECURE=true
echo    SMTP_USER=hello@easyotpauth.com
echo    SMTP_PASS=HoveBN41!
echo    MAIL_FROM="EasyOTPAuth <hello@easyotpauth.com>"
echo.
echo 🔧 To set environment variables in Vercel:
echo    1. Go to https://vercel.com/dashboard
echo    2. Select your EasyOTPAuth project
echo    3. Go to Settings ^> Environment Variables
echo    4. Add each variable above
echo    5. Redeploy the project
echo.
echo ✅ Frontend API endpoints fixed:
echo    ✓ /auth/request-code → /api/send-otp
echo    ✓ /auth/verify-code → /api/verify-otp
echo    ✓ Parameter fixed: code → otp
echo.
pause
