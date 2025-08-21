/**
 * CTA + Live Demo Connection Test for EasyOTPAuth
 * Tests the actual demo functionality on the homepage
 */

async function testCTADemoSystem() {
  console.log("🚀 Running CTA + Live Demo Connectivity Test");

  // 1. Find demo email input (actual ID from homepage)
  const emailInput = document.getElementById("demo-email");
  if (!emailInput) {
    console.error("❌ Demo email input not found (ID: demo-email)");
    return;
  }
  console.log("✅ Demo email input found");

  // 2. Find demo get code button (actual ID from homepage)
  const getCodeButton = document.getElementById("demo-get-code");
  if (!getCodeButton) {
    console.error("❌ Demo get code button not found (ID: demo-get-code)");
    return;
  }
  console.log("✅ Demo get code button found");

  // 3. Test the demo functionality
  emailInput.value = "demo@easyotpauth.com"; // Set test email
  console.log("� Set test email:", emailInput.value);

  // 4. Test API connectivity
  try {
    const res = await fetch("/api/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailInput.value }),
    });

    const result = await res.json();
    if (res.status === 200 && result.success) {
      console.log("✅ Live Demo system connected and functional");
      console.log("📊 API Response:", result);
      if (result.developmentCode) {
        console.log("🔑 Development OTP Code:", result.developmentCode);
      }
    } else {
      console.error("❌ Live Demo response error:", result);
    }
  } catch (err) {
    console.error("❌ Error testing API:", err.message);
  }
}

// Only run the test if we're in development mode
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  document.addEventListener("DOMContentLoaded", testCTADemoSystem);
}
