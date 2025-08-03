/*
  EasyOTPAuth Client Integration Script
  ------------------------------------
  ✅ Paste this into any client website to integrate EasyOTPAuth login flow.
  ✅ Works with your deployed EasyOTPAuth API on Vercel.
  ✅ Fully responsive and production-ready.
*/

class EasyOTPAuth {
  constructor(apiUrl = "https://www.easyotpauth.com/api") {
    this.apiUrl = apiUrl;
    this.currentEmail = null;
    this.isRequestingOTP = false;
    this.isVerifyingOTP = false;
  }

  async requestOTP(email) {
    if (this.isRequestingOTP) {
      console.log("OTP request already in progress...");
      return;
    }

    if (!email || !this.isValidEmail(email)) {
      this.showMessage("Please enter a valid email address", "error");
      return;
    }

    this.isRequestingOTP = true;
    this.currentEmail = email;
    
    try {
      console.log(`Requesting OTP for: ${email}`);
      
      const response = await fetch(`${this.apiUrl}/send-otp`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      
      if (data.success) {
        console.log("✅ OTP sent successfully:", data);
        this.showMessage(`OTP sent to ${email}. Check your email!`, "success");
        this.showOTPInput();
      } else {
        console.error("❌ OTP request failed:", data);
        this.showMessage(data.error || "Failed to send OTP", "error");
      }
    } catch (err) {
      console.error("❌ Network error requesting OTP:", err);
      this.showMessage("Network error. Please try again.", "error");
    } finally {
      this.isRequestingOTP = false;
    }
  }

  async verifyOTP(email, otp) {
    if (this.isVerifyingOTP) {
      console.log("OTP verification already in progress...");
      return;
    }

    if (!email || !otp) {
      this.showMessage("Email and OTP are required", "error");
      return;
    }

    if (!/^\d{6}$/.test(otp)) {
      this.showMessage("OTP must be 6 digits", "error");
      return;
    }

    this.isVerifyingOTP = true;
    
    try {
      console.log(`Verifying OTP for: ${email}`);
      
      const response = await fetch(`${this.apiUrl}/verify-otp`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();
      
      if (data.success) {
        console.log("✅ Authentication successful:", data);
        this.showMessage("🎉 Authentication successful!", "success");
        
        // Store the JWT token
        if (data.token) {
          localStorage.setItem('easyotp_token', data.token);
          localStorage.setItem('easyotp_user', JSON.stringify(data.user));
        }
        
        // Call success callback if provided
        if (this.onAuthSuccess) {
          this.onAuthSuccess(data);
        }
        
        this.hideOTPForm();
      } else {
        console.error("❌ OTP verification failed:", data);
        this.showMessage(data.error || "Invalid OTP", "error");
      }
    } catch (err) {
      console.error("❌ Network error verifying OTP:", err);
      this.showMessage("Network error. Please try again.", "error");
    } finally {
      this.isVerifyingOTP = false;
    }
  }

  isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  showMessage(message, type = "info") {
    const messageEl = document.getElementById('easyotp-message');
    if (messageEl) {
      messageEl.textContent = message;
      messageEl.className = `easyotp-message ${type}`;
      messageEl.style.display = 'block';
      
      // Auto-hide success messages after 5 seconds
      if (type === 'success') {
        setTimeout(() => {
          messageEl.style.display = 'none';
        }, 5000);
      }
    } else {
      alert(message);
    }
  }

  showOTPInput() {
    const otpContainer = document.getElementById('easyotp-verify-container');
    if (otpContainer) {
      otpContainer.style.display = 'block';
    }
  }

  hideOTPForm() {
    const container = document.getElementById('easyotp-container');
    if (container) {
      container.style.display = 'none';
    }
  }

  // Method to check if user is already authenticated
  isAuthenticated() {
    const token = localStorage.getItem('easyotp_token');
    if (!token) return false;
    
    try {
      // Basic JWT expiry check (decode without verification)
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  // Method to get current user
  getCurrentUser() {
    if (this.isAuthenticated()) {
      return JSON.parse(localStorage.getItem('easyotp_user') || '{}');
    }
    return null;
  }

  // Method to logout
  logout() {
    localStorage.removeItem('easyotp_token');
    localStorage.removeItem('easyotp_user');
    this.showOTPForm();
  }

  showOTPForm() {
    const container = document.getElementById('easyotp-container');
    if (container) {
      container.style.display = 'block';
    }
  }

  // Initialize the widget
  init(containerId = 'easyotp-widget', options = {}) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container with ID '${containerId}' not found`);
      return;
    }

    // Set options
    this.onAuthSuccess = options.onAuthSuccess;
    
    // Check if already authenticated
    if (this.isAuthenticated()) {
      const user = this.getCurrentUser();
      container.innerHTML = `
        <div class="easyotp-authenticated">
          <p>✅ Authenticated as: <strong>${user.email}</strong></p>
          <button onclick="easyOTPAuth.logout()" class="easyotp-btn easyotp-btn-secondary">Logout</button>
        </div>
      `;
      return;
    }

    // Create the widget HTML
    container.innerHTML = `
      <div id="easyotp-container" class="easyotp-widget">
        <div class="easyotp-header">
          <h3>🔐 EasyOTPAuth Login</h3>
          <p>Enter your email to receive a secure login code</p>
        </div>
        
        <div id="easyotp-message" class="easyotp-message" style="display: none;"></div>
        
        <div class="easyotp-form">
          <div class="easyotp-input-group">
            <input 
              id="easyotp-email" 
              type="email" 
              placeholder="Enter your email address" 
              class="easyotp-input"
              required
            />
            <button 
              onclick="easyOTPAuth.requestOTP(document.getElementById('easyotp-email').value)" 
              class="easyotp-btn easyotp-btn-primary"
              id="easyotp-request-btn"
            >
              Get Login Code
            </button>
          </div>
          
          <div id="easyotp-verify-container" class="easyotp-verify-section" style="display: none;">
            <div class="easyotp-input-group">
              <input 
                id="easyotp-code" 
                type="text" 
                placeholder="Enter 6-digit code" 
                maxlength="6"
                pattern="[0-9]{6}"
                class="easyotp-input"
                required
              />
              <button 
                onclick="easyOTPAuth.verifyOTP(easyOTPAuth.currentEmail, document.getElementById('easyotp-code').value)" 
                class="easyotp-btn easyotp-btn-success"
                id="easyotp-verify-btn"
              >
                Verify Code
              </button>
            </div>
          </div>
        </div>
        
        <div class="easyotp-footer">
          <small>Powered by <a href="https://easyotpauth.com" target="_blank">EasyOTPAuth</a></small>
        </div>
      </div>
    `;

    // Add CSS if not already present
    if (!document.getElementById('easyotp-styles')) {
      const style = document.createElement('style');
      style.id = 'easyotp-styles';
      style.textContent = \`
        .easyotp-widget {
          max-width: 400px;
          margin: 20px auto;
          padding: 24px;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          background: #ffffff;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        
        .easyotp-header h3 {
          margin: 0 0 8px 0;
          color: #1f2937;
          font-size: 20px;
          font-weight: 600;
        }
        
        .easyotp-header p {
          margin: 0 0 20px 0;
          color: #6b7280;
          font-size: 14px;
        }
        
        .easyotp-input-group {
          margin-bottom: 16px;
        }
        
        .easyotp-input {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 16px;
          margin-bottom: 12px;
          box-sizing: border-box;
          transition: border-color 0.2s;
        }
        
        .easyotp-input:focus {
          outline: none;
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }
        
        .easyotp-btn {
          width: 100%;
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          box-sizing: border-box;
        }
        
        .easyotp-btn-primary {
          background: #2563eb;
          color: white;
        }
        
        .easyotp-btn-primary:hover {
          background: #1d4ed8;
        }
        
        .easyotp-btn-success {
          background: #059669;
          color: white;
        }
        
        .easyotp-btn-success:hover {
          background: #047857;
        }
        
        .easyotp-btn-secondary {
          background: #6b7280;
          color: white;
        }
        
        .easyotp-btn-secondary:hover {
          background: #4b5563;
        }
        
        .easyotp-message {
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 16px;
          font-size: 14px;
          font-weight: 500;
        }
        
        .easyotp-message.success {
          background: #d1fae5;
          color: #065f46;
          border: 1px solid #a7f3d0;
        }
        
        .easyotp-message.error {
          background: #fee2e2;
          color: #991b1b;
          border: 1px solid #fca5a5;
        }
        
        .easyotp-message.info {
          background: #dbeafe;
          color: #1e40af;
          border: 1px solid #93c5fd;
        }
        
        .easyotp-footer {
          text-align: center;
          margin-top: 20px;
          padding-top: 16px;
          border-top: 1px solid #f3f4f6;
        }
        
        .easyotp-footer small {
          color: #9ca3af;
          font-size: 12px;
        }
        
        .easyotp-footer a {
          color: #2563eb;
          text-decoration: none;
        }
        
        .easyotp-authenticated {
          text-align: center;
          padding: 20px;
        }
        
        .easyotp-authenticated p {
          margin-bottom: 16px;
          color: #059669;
          font-size: 16px;
        }
        
        @media (max-width: 480px) {
          .easyotp-widget {
            margin: 10px;
            padding: 20px;
          }
        }
      \`;
      document.head.appendChild(style);
    }

    // Add Enter key support
    document.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const emailInput = document.getElementById('easyotp-email');
        const codeInput = document.getElementById('easyotp-code');
        
        if (document.activeElement === emailInput) {
          this.requestOTP(emailInput.value);
        } else if (document.activeElement === codeInput) {
          this.verifyOTP(this.currentEmail, codeInput.value);
        }
      }
    });
  }
}

// Create global instance
const easyOTPAuth = new EasyOTPAuth();

// Auto-initialize if container exists
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('easyotp-widget')) {
    easyOTPAuth.init();
  }
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EasyOTPAuth;
}
