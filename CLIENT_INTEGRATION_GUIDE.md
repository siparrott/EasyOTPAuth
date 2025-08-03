# 🚀 EasyOTPAuth Client Integration Guide

## Overview

EasyOTPAuth now provides a complete client integration system that allows you to add secure email-based authentication to any website with just a few lines of code. This implementation provides both widget-based integration and direct API access.

## 🔗 Quick Integration Options

### Option 1: JavaScript Widget (Recommended)

The easiest way to integrate EasyOTPAuth is using our pre-built JavaScript widget:

```html
<!-- Step 1: Add container div -->
<div id="easyotp-widget"></div>

<!-- Step 2: Include the script -->
<script src="https://www.easyotpauth.com/client-integration.js"></script>

<!-- Step 3: Initialize (optional customization) -->
<script>
  easyOTPAuth.init('easyotp-widget', {
    onAuthSuccess: (data) => {
      console.log('User authenticated!', data);
      // Handle successful authentication
      // data.user.email - user's email
      // data.token - JWT token for API calls
    }
  });
</script>
```

### Option 2: Direct API Integration

For custom implementations, use our REST API endpoints:

```javascript
// Send OTP
const response = await fetch('https://www.easyotpauth.com/api/send-otp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'user@example.com' })
});

// Verify OTP
const verifyResponse = await fetch('https://www.easyotpauth.com/api/verify-otp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    email: 'user@example.com', 
    otp: '123456' 
  })
});

const result = await verifyResponse.json();
if (result.success) {
  console.log('Authenticated!', result.token);
}
```

## 📋 API Endpoints

### POST /api/send-otp

Send a 6-digit OTP code to the specified email address.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "OTP sent successfully"
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Invalid email address."
}
```

### POST /api/verify-otp

Verify the OTP code and receive a JWT authentication token.

**Request:**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Authentication successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "email": "user@example.com",
    "authenticated": true
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Invalid verification code."
}
```

## 🎨 Widget Customization

The JavaScript widget is fully customizable:

```javascript
// Advanced initialization with all options
easyOTPAuth.init('easyotp-widget', {
  // Callback when authentication succeeds
  onAuthSuccess: (data) => {
    // Redirect user to dashboard
    window.location.href = '/dashboard';
  },
  
  // Custom API URL (for testing or self-hosted)
  apiUrl: 'https://your-custom-domain.com/api'
});

// Check if user is already authenticated
if (easyOTPAuth.isAuthenticated()) {
  const user = easyOTPAuth.getCurrentUser();
  console.log('Already logged in as:', user.email);
}

// Logout programmatically
easyOTPAuth.logout();
```

## 🔐 JWT Token Usage

After successful authentication, you receive a JWT token that's valid for 7 days:

```javascript
// The token is automatically stored in localStorage
const token = localStorage.getItem('easyotp_token');

// Use token for authenticated API calls
fetch('/api/protected-endpoint', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// Verify token on your backend
const jwt = require('jsonwebtoken');
const payload = jwt.verify(token, process.env.JWT_SECRET);
console.log('Authenticated user:', payload.email);
```

## 🌐 CORS Support

All endpoints include full CORS support for cross-origin requests:

```javascript
// Works from any domain
fetch('https://www.easyotpauth.com/api/send-otp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'user@example.com' })
});
```

## 🎯 Live Demo & Testing

### Demo Page
Visit our interactive demo: https://www.easyotpauth.com/client-demo

### Testing Tools

1. **Web Interface:** https://www.easyotpauth.com/client-demo
2. **Command Line:** 
   ```bash
   node test-client-integration.js siparrott@yahoo.co.uk
   ```

## 📱 Framework Integration Examples

### React Component

```jsx
import { useEffect, useState } from 'react';

function AuthWidget() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Load EasyOTPAuth script
    const script = document.createElement('script');
    script.src = 'https://www.easyotpauth.com/client-integration.js';
    script.onload = () => {
      window.easyOTPAuth.init('auth-container', {
        onAuthSuccess: (data) => {
          setIsAuthenticated(true);
          // Store user data in React state
        }
      });
    };
    document.body.appendChild(script);

    return () => document.body.removeChild(script);
  }, []);

  if (isAuthenticated) {
    return <div>Welcome! You are authenticated.</div>;
  }

  return <div id="auth-container"></div>;
}
```

### Vue.js Component

```vue
<template>
  <div v-if="!isAuthenticated" id="auth-container"></div>
  <div v-else>Welcome! You are authenticated.</div>
</template>

<script>
export default {
  data() {
    return {
      isAuthenticated: false
    };
  },
  mounted() {
    const script = document.createElement('script');
    script.src = 'https://www.easyotpauth.com/client-integration.js';
    script.onload = () => {
      window.easyOTPAuth.init('auth-container', {
        onAuthSuccess: (data) => {
          this.isAuthenticated = true;
        }
      });
    };
    document.body.appendChild(script);
  }
};
</script>
```

## 🔧 Configuration

### Environment Variables (Server-side)

```bash
# SMTP Configuration (Required)
SMTP_HOST=smtp.easyname.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
MAIL_FROM="EasyOTPAuth <hello@easyotpauth.com>"

# JWT Secret (Required)
JWT_SECRET=your-super-secure-jwt-secret-key

# Redis (Optional - for scalability)
REDIS_URL=redis://localhost:6379
```

## 🛡️ Security Features

- **6-digit OTP codes** with 10-minute expiry
- **Rate limiting**: 5 requests per 15 minutes per email
- **JWT tokens** with 7-day expiry
- **bcrypt hashing** for OTP storage
- **CORS protection** with configurable origins
- **Input validation** and sanitization

## 📊 Usage Tracking

Track authentication events in your application:

```javascript
easyOTPAuth.init('auth-widget', {
  onAuthSuccess: (data) => {
    // Send analytics event
    gtag('event', 'login', {
      method: 'otp',
      email: data.user.email
    });
    
    // Track in your system
    fetch('/api/track-auth', {
      method: 'POST',
      body: JSON.stringify({
        user: data.user.email,
        timestamp: new Date().toISOString()
      })
    });
  }
});
```

## 🔍 Error Handling

Comprehensive error handling for all scenarios:

```javascript
// Handle different error types
easyOTPAuth.requestOTP('invalid-email')
  .catch(error => {
    switch(error.type) {
      case 'validation':
        console.log('Invalid email format');
        break;
      case 'rate_limit':
        console.log('Too many requests, try again later');
        break;
      case 'network':
        console.log('Network error, check connection');
        break;
      default:
        console.log('Unknown error:', error.message);
    }
  });
```

## 🚀 Production Deployment

### Self-Hosted Option

You can deploy your own instance:

1. Clone the repository
2. Set environment variables
3. Deploy to your preferred platform (Vercel, Heroku, AWS, etc.)
4. Update the `apiUrl` in client integration

### Managed Service

Use our hosted service at `https://www.easyotpauth.com/api` (recommended for most users).

## 📞 Support & Documentation

- **Live Demo:** https://www.easyotpauth.com/client-demo
- **API Testing:** https://www.easyotpauth.com/personal-test
- **GitHub Repository:** https://github.com/siparrott/EasyOTPAuth
- **Support Email:** hello@easyotpauth.com

## 🎉 Next Steps

1. Try the live demo: https://www.easyotpauth.com/client-demo
2. Test with your email: https://www.easyotpauth.com/personal-test
3. Integrate into your website using the examples above
4. Customize the styling and behavior to match your brand

---

**Ready to get started?** Copy the integration code above and start authenticating users in minutes! 🚀
