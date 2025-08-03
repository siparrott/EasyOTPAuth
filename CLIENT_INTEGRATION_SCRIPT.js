/*
  EasyOTPAuth Client Integration Script - CORRECTED VERSION
  ---------------------------------------------------------
  ✅ Paste this into any client website to add EasyOTPAuth login flow.
  ✅ Uses the correct API endpoints: /auth/request-code and /auth/verify-code
  ✅ Ready for production use with your deployed Vercel API.
*/

const EASY_OTP_API = "https://www.easyotpauth.com/auth";

// Request OTP function
async function requestOTP(email) {
  if (!email || !email.includes('@')) {
    alert("Please enter a valid email address.");
    return;
  }

  try {
    const response = await fetch(`${EASY_OTP_API}/request-code`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({ email }),
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log("✅ OTP sent successfully:", data);
      alert(`✅ OTP sent to ${email}. Check your inbox and spam folder.`);
      
      // Show the OTP input field
      const otpSection = document.getElementById('otp-section');
      if (otpSection) {
        otpSection.style.display = 'block';
      }
    } else {
      console.error("❌ Failed to send OTP:", data);
      alert(`❌ Failed to send OTP: ${data.message || 'Unknown error'}`);
    }
  } catch (err) {
    console.error("❌ Network error requesting OTP:", err);
    alert("❌ Network error. Please check your connection and try again.");
  }
}

// Verify OTP function
async function verifyOTP(email, otp) {
  if (!email || !email.includes('@')) {
    alert("Please enter a valid email address.");
    return;
  }
  
  if (!otp || otp.length !== 6) {
    alert("Please enter a valid 6-digit OTP code.");
    return;
  }

  try {
    const response = await fetch(`${EASY_OTP_API}/verify-code`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({ email, code: otp }),
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log("✅ Authentication successful:", data);
      alert("🎉 Authentication successful! You are now logged in.");
      
      // Store the JWT token if provided
      if (data.token) {
        localStorage.setItem('easyotpauth_token', data.token);
        console.log("JWT token saved to localStorage");
      }
      
      // Hide the login form and show success
      const loginForm = document.getElementById('easyotpauth-login');
      if (loginForm) {
        loginForm.innerHTML = `
          <div style="text-align:center;color:green;padding:20px;">
            <h3>✅ Authentication Successful!</h3>
            <p>Welcome! You are now logged in.</p>
            <button onclick="logoutEasyOTP()" style="padding:8px 16px;background:#dc3545;color:white;border:none;border-radius:4px;cursor:pointer;">Logout</button>
          </div>
        `;
      }
    } else {
      console.error("❌ OTP verification failed:", data);
      alert(`❌ ${data.message || 'Invalid or expired OTP. Please try again.'}`);
    }
  } catch (err) {
    console.error("❌ Network error verifying OTP:", err);
    alert("❌ Network error. Please check your connection and try again.");
  }
}

// Logout function
function logoutEasyOTP() {
  localStorage.removeItem('easyotpauth_token');
  location.reload(); // Refresh page to show login form again
}

// Check if user is already authenticated
function checkAuthStatus() {
  const token = localStorage.getItem('easyotpauth_token');
  if (token) {
    // You can add token validation here if needed
    return true;
  }
  return false;
}

// Initialize the login form
function initEasyOTPAuth() {
  if (checkAuthStatus()) {
    // User is already logged in
    document.getElementById('easyotpauth-login').innerHTML = `
      <div style="text-align:center;color:green;padding:20px;">
        <h3>✅ Already Authenticated</h3>
        <p>You are currently logged in.</p>
        <button onclick="logoutEasyOTP()" style="padding:8px 16px;background:#dc3545;color:white;border:none;border-radius:4px;cursor:pointer;">Logout</button>
      </div>
    `;
    return;
  }

  // Create the login form HTML
  const loginHTML = `
    <div id="easyotpauth-login" style="max-width:400px;margin:20px auto;padding:20px;border:2px solid #007bff;border-radius:8px;background:#f8f9fa;font-family:Arial,sans-serif;">
      <h3 style="text-align:center;color:#007bff;margin-bottom:20px;">🔐 EasyOTPAuth Login</h3>
      
      <div style="margin-bottom:15px;">
        <label style="display:block;margin-bottom:5px;font-weight:bold;">Email Address:</label>
        <input 
          id="easyotp-email" 
          type="email" 
          placeholder="Enter your email address" 
          style="width:100%;padding:10px;border:1px solid #ccc;border-radius:4px;font-size:16px;"
          required
        />
      </div>
      
      <button 
        onclick="requestOTP(document.getElementById('easyotp-email').value)" 
        style="width:100%;padding:12px;background:#007bff;color:white;border:none;border-radius:4px;font-size:16px;cursor:pointer;margin-bottom:15px;"
      >
        📧 Send OTP Code
      </button>
      
      <div id="otp-section" style="display:none;">
        <div style="margin-bottom:15px;">
          <label style="display:block;margin-bottom:5px;font-weight:bold;">6-Digit OTP Code:</label>
          <input 
            id="easyotp-code" 
            type="text" 
            placeholder="Enter 6-digit code" 
            maxlength="6"
            style="width:100%;padding:10px;border:1px solid #ccc;border-radius:4px;font-size:16px;text-align:center;"
            required
          />
        </div>
        
        <button 
          onclick="verifyOTP(document.getElementById('easyotp-email').value, document.getElementById('easyotp-code').value)" 
          style="width:100%;padding:12px;background:#28a745;color:white;border:none;border-radius:4px;font-size:16px;cursor:pointer;"
        >
          ✅ Verify & Login
        </button>
      </div>
      
      <div style="margin-top:15px;font-size:12px;color:#666;text-align:center;">
        Powered by <strong>EasyOTPAuth</strong> - Secure passwordless authentication
      </div>
    </div>
  `;

  // Insert the form into the page
  if (document.getElementById('easyotpauth-login')) {
    document.getElementById('easyotpauth-login').innerHTML = loginHTML;
  } else {
    document.body.insertAdjacentHTML('beforeend', loginHTML);
  }
}

// Auto-initialize when script loads (optional)
document.addEventListener('DOMContentLoaded', function() {
  // Only auto-initialize if there's a container element
  if (document.getElementById('easyotpauth-login')) {
    initEasyOTPAuth();
  }
});

// Export functions for manual use
window.EasyOTPAuth = {
  requestOTP,
  verifyOTP,
  logoutEasyOTP,
  checkAuthStatus,
  initEasyOTPAuth
};

/*
  USAGE INSTRUCTIONS:
  -------------------
  
  Method 1 - Auto Initialize:
  Add this to your HTML: <div id="easyotpauth-login"></div>
  The form will appear automatically when the page loads.
  
  Method 2 - Manual Initialize:
  Call EasyOTPAuth.initEasyOTPAuth() when you want to show the login form.
  
  Method 3 - Custom Implementation:
  Use EasyOTPAuth.requestOTP(email) and EasyOTPAuth.verifyOTP(email, code) 
  with your own UI elements.
  
  Method 4 - Check Auth Status:
  Use EasyOTPAuth.checkAuthStatus() to see if user is logged in.
  
  EXAMPLE HTML:
  <script src="path/to/this/script.js"></script>
  <div id="easyotpauth-login"></div>
*/
