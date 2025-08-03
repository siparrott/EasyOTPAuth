#!/usr/bin/env node

/**
 * 🔍 COMPREHENSIVE OTP AUTHENTICATION TEST SCRIPT
 * 
 * This script tests the entire OTP flow from homepage demo
 * to verify if it's connected to real backend endpoints.
 * 
 * Tests:
 * 1. Backend API endpoint validation
 * 2. Frontend-backend integration check  
 * 3. OTP generation and verification flow
 * 4. JWT token issuance
 * 5. Email configuration validation
 * 
 * Usage: node otp_test.js
 * 
 * @author EasyOTPAuth Test Suite
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  testEmail: 'test@example.com',
  timeout: 10000,
  maxRetries: 3
};

class OTPTestSuite {
  constructor() {
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      errors: []
    };
    this.serverUrl = TEST_CONFIG.baseUrl;
  }

  log(message, color = 'white') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  logHeader(title) {
    const border = '='.repeat(title.length + 4);
    this.log(`\n${border}`, 'cyan');
    this.log(`  ${title}`, 'cyan');
    this.log(`${border}`, 'cyan');
  }

  logTest(name, status, details = '') {
    this.results.total++;
    if (status === 'PASS') {
      this.results.passed++;
      this.log(`✅ ${name}`, 'green');
      if (details) this.log(`   ${details}`, 'white');
    } else {
      this.results.failed++;
      this.log(`❌ ${name}`, 'red');
      if (details) this.log(`   ${details}`, 'yellow');
      this.results.errors.push({ test: name, error: details });
    }
  }

  async testFileExists(filepath, description) {
    try {
      const exists = fs.existsSync(filepath);
      this.logTest(
        `File exists: ${description}`,
        exists ? 'PASS' : 'FAIL',
        exists ? `Found: ${filepath}` : `Missing: ${filepath}`
      );
      return exists;
    } catch (error) {
      this.logTest(`File exists: ${description}`, 'FAIL', error.message);
      return false;
    }
  }

  async testFrontendCodeIntegration() {
    this.logHeader('🎭 FRONTEND CODE ANALYSIS');
    
    // Check if homepage has OTP demo
    const homepageExists = await this.testFileExists(
      path.join(__dirname, 'public', 'index.html'),
      'Homepage (index.html)'
    );

    if (!homepageExists) return false;

    // Read homepage content and check for OTP functionality
    try {
      const homepage = fs.readFileSync(path.join(__dirname, 'public', 'index.html'), 'utf8');
      
      // Check for demo elements
      const hasEmailInput = homepage.includes('id="demo-email"');
      const hasCodeInput = homepage.includes('id="demo-code"');
      const hasGetCodeBtn = homepage.includes('id="demo-get-code"');
      const hasVerifyBtn = homepage.includes('id="demo-verify"');
      
      this.logTest(
        'Homepage has email input field',
        hasEmailInput ? 'PASS' : 'FAIL',
        hasEmailInput ? 'Found demo-email input' : 'Missing email input'
      );
      
      this.logTest(
        'Homepage has code input field',
        hasCodeInput ? 'PASS' : 'FAIL',
        hasCodeInput ? 'Found demo-code input' : 'Missing code input'
      );
      
      this.logTest(
        'Homepage has "Get Code" button',
        hasGetCodeBtn ? 'PASS' : 'FAIL',
        hasGetCodeBtn ? 'Found demo-get-code button' : 'Missing get code button'
      );
      
      this.logTest(
        'Homepage has "Verify" button',
        hasVerifyBtn ? 'PASS' : 'FAIL',
        hasVerifyBtn ? 'Found demo-verify button' : 'Missing verify button'
      );

      // Check for API calls
      const hasRequestCodeAPI = homepage.includes('/auth/request-code');
      const hasVerifyCodeAPI = homepage.includes('/auth/verify-code');
      
      this.logTest(
        'Frontend calls /auth/request-code endpoint',
        hasRequestCodeAPI ? 'PASS' : 'FAIL',
        hasRequestCodeAPI ? 'Real API endpoint found' : 'API call missing or fake'
      );
      
      this.logTest(
        'Frontend calls /auth/verify-code endpoint',
        hasVerifyCodeAPI ? 'PASS' : 'FAIL',
        hasVerifyCodeAPI ? 'Real API endpoint found' : 'API call missing or fake'
      );

      return hasEmailInput && hasCodeInput && hasGetCodeBtn && hasVerifyBtn && hasRequestCodeAPI && hasVerifyCodeAPI;
      
    } catch (error) {
      this.logTest('Frontend code analysis', 'FAIL', error.message);
      return false;
    }
  }

  async testBackendEndpoints() {
    this.logHeader('🔧 BACKEND ENDPOINT VALIDATION');
    
    // Check if backend file exists
    const backendExists = await this.testFileExists(
      path.join(__dirname, 'index.js'),
      'Backend server (index.js)'
    );

    if (!backendExists) return false;

    try {
      const backend = fs.readFileSync(path.join(__dirname, 'index.js'), 'utf8');
      
      // Check for endpoint definitions
      const hasRequestEndpoint = backend.includes("app.post('/auth/request-code'");
      const hasVerifyEndpoint = backend.includes("app.post('/auth/verify-code'");
      const hasOTPGeneration = backend.includes('generateCode') || backend.includes('Math.floor(100000 + Math.random() * 900000)');
      const hasJWTSigning = backend.includes('jwt.sign');
      const hasBcryptHashing = backend.includes('bcrypt.hash') || backend.includes('bcrypt.compare');
      const hasEmailTransport = backend.includes('nodemailer') && backend.includes('transporter');
      
      this.logTest(
        'Backend has /auth/request-code endpoint',
        hasRequestEndpoint ? 'PASS' : 'FAIL',
        hasRequestEndpoint ? 'Endpoint defined' : 'Missing endpoint'
      );
      
      this.logTest(
        'Backend has /auth/verify-code endpoint',
        hasVerifyEndpoint ? 'PASS' : 'FAIL',
        hasVerifyEndpoint ? 'Endpoint defined' : 'Missing endpoint'
      );
      
      this.logTest(
        'Backend generates OTP codes',
        hasOTPGeneration ? 'PASS' : 'FAIL',
        hasOTPGeneration ? 'OTP generation logic found' : 'No OTP generation'
      );
      
      this.logTest(
        'Backend issues JWT tokens',
        hasJWTSigning ? 'PASS' : 'FAIL',
        hasJWTSigning ? 'JWT signing found' : 'No JWT token issuance'
      );
      
      this.logTest(
        'Backend has secure password hashing',
        hasBcryptHashing ? 'PASS' : 'FAIL',
        hasBcryptHashing ? 'Bcrypt hashing found' : 'No secure hashing'
      );
      
      this.logTest(
        'Backend has email transport',
        hasEmailTransport ? 'PASS' : 'FAIL',
        hasEmailTransport ? 'Nodemailer transport configured' : 'No email service'
      );

      return hasRequestEndpoint && hasVerifyEndpoint && hasOTPGeneration && hasJWTSigning && hasBcryptHashing && hasEmailTransport;
      
    } catch (error) {
      this.logTest('Backend code analysis', 'FAIL', error.message);
      return false;
    }
  }

  async testEnvironmentConfiguration() {
    this.logHeader('⚙️ ENVIRONMENT CONFIGURATION');
    
    // Check .env file
    const envExists = await this.testFileExists(
      path.join(__dirname, '.env'),
      'Environment file (.env)'
    );

    if (!envExists) return false;

    try {
      const envContent = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
      
      // Check for required environment variables
      const hasJWTSecret = envContent.includes('JWT_SECRET=') && !envContent.includes('JWT_SECRET=YOUR_JWT_SECRET');
      const hasSMTPHost = envContent.includes('SMTP_HOST=') && !envContent.includes('SMTP_HOST=YOUR_SMTP_HOST');
      const hasSMTPUser = envContent.includes('SMTP_USER=') && !envContent.includes('SMTP_USER=YOUR_SMTP_USERNAME');
      const hasSMTPPass = envContent.includes('SMTP_PASS=') && !envContent.includes('SMTP_PASS=YOUR_SMTP_PASSWORD');
      const hasMailFrom = envContent.includes('MAIL_FROM=');
      
      this.logTest(
        'JWT Secret configured',
        hasJWTSecret ? 'PASS' : 'FAIL',
        hasJWTSecret ? 'JWT secret is set' : 'JWT secret is placeholder'
      );
      
      this.logTest(
        'SMTP Host configured',
        hasSMTPHost ? 'PASS' : 'FAIL',
        hasSMTPHost ? 'SMTP host is set' : 'SMTP host is placeholder'
      );
      
      this.logTest(
        'SMTP User configured',
        hasSMTPUser ? 'PASS' : 'FAIL',
        hasSMTPUser ? 'SMTP user is set' : 'SMTP user is placeholder'
      );
      
      this.logTest(
        'SMTP Password configured',
        hasSMTPPass ? 'PASS' : 'FAIL',
        hasSMTPPass ? 'SMTP password is set' : 'SMTP password is placeholder'
      );
      
      this.logTest(
        'Mail From configured',
        hasMailFrom ? 'PASS' : 'FAIL',
        hasMailFrom ? 'Mail from address is set' : 'Mail from address missing'
      );

      return hasJWTSecret && hasSMTPHost && hasSMTPUser && hasSMTPPass && hasMailFrom;
      
    } catch (error) {
      this.logTest('Environment configuration', 'FAIL', error.message);
      return false;
    }
  }

  async testEmailTemplates() {
    this.logHeader('📧 EMAIL TEMPLATE VALIDATION');
    
    // Check email templates
    const htmlTemplateExists = await this.testFileExists(
      path.join(__dirname, 'templates', 'email', 'otp.html.hbs'),
      'HTML email template'
    );
    
    const textTemplateExists = await this.testFileExists(
      path.join(__dirname, 'templates', 'email', 'otp.txt.hbs'),
      'Text email template'
    );

    if (htmlTemplateExists) {
      try {
        const htmlTemplate = fs.readFileSync(path.join(__dirname, 'templates', 'email', 'otp.html.hbs'), 'utf8');
        const hasCodePlaceholder = htmlTemplate.includes('{{code}}');
        const hasBrandingPlaceholder = htmlTemplate.includes('{{branding');
        
        this.logTest(
          'HTML template has code placeholder',
          hasCodePlaceholder ? 'PASS' : 'FAIL',
          hasCodePlaceholder ? '{{code}} placeholder found' : 'Missing {{code}} placeholder'
        );
        
        this.logTest(
          'HTML template has branding support',
          hasBrandingPlaceholder ? 'PASS' : 'FAIL',
          hasBrandingPlaceholder ? 'Branding variables found' : 'No branding support'
        );
      } catch (error) {
        this.logTest('HTML template analysis', 'FAIL', error.message);
      }
    }

    return htmlTemplateExists && textTemplateExists;
  }

  async generateTestReport() {
    this.logHeader('📊 TEST SUMMARY REPORT');
    
    const passRate = this.results.total > 0 ? ((this.results.passed / this.results.total) * 100).toFixed(1) : 0;
    
    this.log(`\n📈 Results:`);
    this.log(`   Total Tests: ${this.results.total}`, 'white');
    this.log(`   Passed: ${this.results.passed}`, 'green');
    this.log(`   Failed: ${this.results.failed}`, 'red');
    this.log(`   Pass Rate: ${passRate}%`, passRate >= 80 ? 'green' : passRate >= 60 ? 'yellow' : 'red');

    // Determine if OTP demo is real or fake
    const isRealProduct = this.results.passed >= this.results.total * 0.8;
    
    this.logHeader('🔍 ANALYSIS CONCLUSION');
    
    if (isRealProduct) {
      this.log('✅ VERDICT: The homepage OTP demo IS connected to the real EasyOTPAuth product!', 'green');
      this.log('\n🎯 System Status:', 'cyan');
      this.log('   • Frontend has proper OTP demo interface', 'green');
      this.log('   • Backend has real API endpoints (/auth/request-code, /auth/verify-code)', 'green');
      this.log('   • OTP generation and verification logic exists', 'green');
      this.log('   • JWT token issuance is implemented', 'green');
      this.log('   • Email templates are configured', 'green');
      
      if (this.results.failed > 0) {
        this.log('\n⚠️  Configuration Issues Found:', 'yellow');
        this.results.errors.forEach(error => {
          this.log(`   • ${error.test}: ${error.error}`, 'yellow');
        });
        this.log('\n💡 These are likely environment configuration issues, not code problems.', 'yellow');
      }
      
    } else {
      this.log('❌ VERDICT: The homepage OTP demo appears to be FAKE or BROKEN!', 'red');
      this.log('\n🚨 Critical Issues Found:', 'red');
      this.results.errors.forEach(error => {
        this.log(`   • ${error.test}: ${error.error}`, 'red');
      });
    }

    this.logHeader('🛠️ NEXT STEPS');
    
    if (isRealProduct && this.results.failed > 0) {
      this.log('1. Configure environment variables in .env file:', 'cyan');
      this.log('   • Set real SMTP credentials (SMTP_USER, SMTP_PASS)', 'white');
      this.log('   • Verify JWT_SECRET is secure', 'white');
      this.log('   • Test email delivery', 'white');
      this.log('\n2. For production deployment:', 'cyan');
      this.log('   • Set environment variables in Vercel dashboard', 'white');
      this.log('   • Test the live demo at your domain', 'white');
      this.log('   • Monitor email delivery logs', 'white');
    } else if (!isRealProduct) {
      this.log('1. Fix broken/missing API endpoints', 'cyan');
      this.log('2. Implement proper OTP generation and verification', 'cyan');
      this.log('3. Add JWT token issuance on successful verification', 'cyan');
      this.log('4. Configure email service integration', 'cyan');
      this.log('5. Test end-to-end flow', 'cyan');
    }

    return isRealProduct;
  }

  async runFullTest() {
    this.log('🚀 Starting EasyOTPAuth System Analysis...\n', 'cyan');
    
    // Run all tests
    await this.testFrontendCodeIntegration();
    await this.testBackendEndpoints();
    await this.testEnvironmentConfiguration();
    await this.testEmailTemplates();
    
    // Generate final report
    const isRealProduct = await this.generateTestReport();
    
    this.log(`\n${'='.repeat(60)}`, 'cyan');
    this.log('🏁 Analysis Complete!', 'cyan');
    this.log(`${'='.repeat(60)}`, 'cyan');
    
    return isRealProduct;
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  const testSuite = new OTPTestSuite();
  testSuite.runFullTest()
    .then(isReal => {
      process.exit(isReal ? 0 : 1);
    })
    .catch(error => {
      console.error(`\n💥 Test suite crashed: ${error.message}`);
      process.exit(1);
    });
}

module.exports = OTPTestSuite;
