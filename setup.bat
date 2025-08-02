@echo off
REM EasyOTPAuth - Master Setup Execution Script for Windows
REM This script automates the setup process described in MASTER-SETUP.md

echo 🚀 EasyOTPAuth Master Setup Starting...
echo ======================================

REM Step 1: Transform to Monorepo Structure
echo 📁 Creating monorepo structure...
if not exist "packages\core" mkdir packages\core
if not exist "packages\cli" mkdir packages\cli
if not exist "packages\templates" mkdir packages\templates
if not exist "apps\demo" mkdir apps\demo

REM Move files if they exist and aren't already moved
if exist "api" if not exist "apps\demo\api" move api apps\demo\
if exist "public" if not exist "apps\demo\public" move public apps\demo\
if exist "templates" if not exist "packages\templates" move templates packages\templates\
if exist "branding.json" if not exist "apps\demo\branding.json" move branding.json apps\demo\
if exist "index.js" if not exist "apps\demo\index.js" move index.js apps\demo\
if exist "vercel.json" if not exist "apps\demo\vercel.json" move vercel.json apps\demo\

echo ✅ Monorepo structure created

REM Step 2: Install root dependencies
echo 📦 Installing root dependencies...
if not exist "package.json" (
    echo ❌ Please create root package.json first (see MASTER-SETUP.md Step 1)
    pause
    exit /b 1
)

call npm install

REM Step 3: Setup packages
echo 🔧 Setting up core package...
if not exist "packages\core\package.json" (
    echo ❌ Please create packages\core\package.json first (see MASTER-SETUP.md Step 2)
    pause
    exit /b 1
)

cd packages\core
call npm install
if exist "src\index.ts" call npm run build
cd ..\..

echo 🛠️ Setting up CLI package...
if not exist "packages\cli\package.json" (
    echo ❌ Please create packages\cli\package.json first (see MASTER-SETUP.md Step 3)
    pause
    exit /b 1
)

cd packages\cli
call npm install
if exist "src\cli.ts" call npm run build
cd ..\..

REM Step 4: Setup demo app
echo 🎨 Setting up demo app...
cd apps\demo
if not exist "package.json" (
    echo 📝 Creating demo app package.json...
    echo {> package.json
    echo   "name": "easyotpauth-demo",>> package.json
    echo   "version": "1.0.0",>> package.json
    echo   "description": "EasyOTPAuth demo application",>> package.json
    echo   "main": "api/index.js",>> package.json
    echo   "scripts": {>> package.json
    echo     "start": "node api/index.js",>> package.json
    echo     "dev": "nodemon api/index.js",>> package.json
    echo     "deploy": "vercel --prod",>> package.json
    echo     "vercel-dev": "vercel dev">> package.json
    echo   },>> package.json
    echo   "dependencies": {>> package.json
    echo     "bcryptjs": "^2.4.3",>> package.json
    echo     "dotenv": "^16.4.1",>> package.json
    echo     "express": "^4.19.2",>> package.json
    echo     "express-rate-limit": "^7.0.2",>> package.json
    echo     "handlebars": "^4.7.8",>> package.json
    echo     "jsonwebtoken": "^9.0.2",>> package.json
    echo     "morgan": "^1.10.0",>> package.json
    echo     "nodemailer": "^6.9.8",>> package.json
    echo     "redis": "^4.6.7",>> package.json
    echo     "winston": "^3.17.0">> package.json
    echo   },>> package.json
    echo   "devDependencies": {>> package.json
    echo     "nodemon": "^3.0.2">> package.json
    echo   }>> package.json
    echo }>> package.json
)

call npm install
cd ..\..

REM Step 5: Initialize development tools
echo 🔧 Setting up development tools...

REM Initialize changeset if not already done
if not exist ".changeset" (
    echo 📝 Initializing changesets...
    call npx changeset init
)

REM Step 6: Run build
echo 🧪 Running build...
call npm run build

REM Final verification
echo ✅ Setup complete! Running verification...

REM Check if core package built successfully
if exist "packages\core\dist" (
    echo ✅ Core package built successfully
) else (
    echo ⚠️ Core package build may have issues
)

REM Check if CLI package built successfully  
if exist "packages\cli\dist" (
    echo ✅ CLI package built successfully
) else (
    echo ⚠️ CLI package build may have issues
)

REM Check if demo app has required files
if exist "apps\demo\api\index.js" (
    echo ✅ Demo app ready
) else (
    echo ⚠️ Demo app may need configuration
)

echo.
echo 🎉 EasyOTPAuth setup completed!
echo ================================
echo.
echo 📋 Next steps:
echo 1. Configure environment variables in apps\demo\.env
echo 2. Test the demo: cd apps\demo ^&^& npm run dev
echo 3. Test the CLI: cd packages\cli ^&^& npm link ^&^& easyotpauth init test-app
echo 4. Deploy demo: cd apps\demo ^&^& npm run deploy
echo 5. Publish packages: npx changeset add ^&^& npx changeset publish
echo.
echo 📚 See MASTER-SETUP.md for detailed instructions!
pause
