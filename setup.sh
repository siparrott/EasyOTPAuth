#!/bin/bash

# EasyOTPAuth - Master Setup Execution Script
# This script automates the setup process described in MASTER-SETUP.md

set -e

echo "🚀 EasyOTPAuth Master Setup Starting..."
echo "======================================"

# Step 1: Transform to Monorepo Structure
echo "📁 Creating monorepo structure..."
mkdir -p packages/core packages/cli packages/templates apps/demo

# Only move files if they exist and aren't already moved
if [ -d "api" ] && [ ! -d "apps/demo/api" ]; then
    mv api apps/demo/
fi

if [ -d "public" ] && [ ! -d "apps/demo/public" ]; then
    mv public apps/demo/
fi

if [ -d "templates" ] && [ ! -d "packages/templates" ]; then
    mv templates packages/templates/
fi

if [ -f "branding.json" ] && [ ! -f "apps/demo/branding.json" ]; then
    mv branding.json apps/demo/
fi

if [ -f "index.js" ] && [ ! -f "apps/demo/index.js" ]; then
    mv index.js apps/demo/
fi

if [ -f "vercel.json" ] && [ ! -f "apps/demo/vercel.json" ]; then
    mv vercel.json apps/demo/
fi

echo "✅ Monorepo structure created"

# Step 2: Install root dependencies
echo "📦 Installing root dependencies..."
if [ ! -f "package.json" ]; then
    echo "❌ Please create root package.json first (see MASTER-SETUP.md Step 1)"
    exit 1
fi

npm install

# Step 3: Setup packages
echo "🔧 Setting up core package..."
if [ ! -f "packages/core/package.json" ]; then
    echo "❌ Please create packages/core/package.json first (see MASTER-SETUP.md Step 2)"
    exit 1
fi

cd packages/core
npm install
if [ -f "src/index.ts" ]; then
    npm run build
fi
cd ../..

echo "🛠️ Setting up CLI package..."
if [ ! -f "packages/cli/package.json" ]; then
    echo "❌ Please create packages/cli/package.json first (see MASTER-SETUP.md Step 3)"
    exit 1
fi

cd packages/cli
npm install
if [ -f "src/cli.ts" ]; then
    npm run build
fi
cd ../..

# Step 4: Setup demo app
echo "🎨 Setting up demo app..."
cd apps/demo
if [ ! -f "package.json" ]; then
    echo "📝 Creating demo app package.json..."
    cat > package.json << 'EOF'
{
  "name": "easyotpauth-demo",
  "version": "1.0.0",
  "description": "EasyOTPAuth demo application",
  "main": "api/index.js",
  "scripts": {
    "start": "node api/index.js",
    "dev": "nodemon api/index.js",
    "deploy": "vercel --prod",
    "vercel-dev": "vercel dev"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "dotenv": "^16.4.1",
    "express": "^4.19.2",
    "express-rate-limit": "^7.0.2",
    "handlebars": "^4.7.8",
    "jsonwebtoken": "^9.0.2",
    "morgan": "^1.10.0",
    "nodemailer": "^6.9.8",
    "redis": "^4.6.7",
    "winston": "^3.17.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}
EOF
fi

npm install
cd ../..

# Step 5: Initialize development tools
echo "🔧 Setting up development tools..."

# Initialize changeset if not already done
if [ ! -d ".changeset" ]; then
    echo "📝 Initializing changesets..."
    npx changeset init
fi

# Setup husky if package exists
if command -v husky &> /dev/null; then
    echo "🎣 Setting up git hooks..."
    npx husky-init
    npx husky add .husky/pre-commit "npm run lint && npm test"
fi

# Step 6: Run tests and build
echo "🧪 Running tests and build..."
npm run build

# Final verification
echo "✅ Setup complete! Running verification..."

# Check if core package built successfully
if [ -d "packages/core/dist" ]; then
    echo "✅ Core package built successfully"
else
    echo "⚠️ Core package build may have issues"
fi

# Check if CLI package built successfully  
if [ -d "packages/cli/dist" ]; then
    echo "✅ CLI package built successfully"
else
    echo "⚠️ CLI package build may have issues"
fi

# Check if demo app has required files
if [ -f "apps/demo/api/index.js" ]; then
    echo "✅ Demo app ready"
else
    echo "⚠️ Demo app may need configuration"
fi

echo ""
echo "🎉 EasyOTPAuth setup completed!"
echo "================================"
echo ""
echo "📋 Next steps:"
echo "1. Configure environment variables in apps/demo/.env"
echo "2. Test the demo: cd apps/demo && npm run dev"
echo "3. Test the CLI: cd packages/cli && npm link && easyotpauth init test-app"
echo "4. Deploy demo: cd apps/demo && npm run deploy"
echo "5. Publish packages: npx changeset add && npx changeset publish"
echo ""
echo "📚 See MASTER-SETUP.md for detailed instructions!"
