/**
 * CTA + Live Demo Connection Test for EasyOTPAuth
 * Paste this in VS Code and link to your index.html to test end-to-end
 */

async function testCTADemoSystem() {
  console.log("🚀 Running CTA + Live Demo Connectivity Test");

  // 1. Find CTA button
  const ctaButton = document.getElementById("cta-button");
  if (!ctaButton) {
    console.error("❌ CTA button not found (ID: cta-button)");
    return;
  }
  console.log("✅ CTA button found");

  // 2. Find Email Input
  const emailInput = document.getElementById("email-input");
  if (!emailInput) {
    console.error("❌ Email input field not found (ID: email-input)");
    return;
  }
  console.log("✅ Email input field found");

  // 3. Simulate click
  emailInput.value = "demo@easyotpauth.com"; // Set test email
  ctaButton.click();
  console.log("📤 Simulated CTA click");

  // 4. Hook into API Response
  try {
    const res = await fetch("/api/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailInput.value }),
    });

    const result = await res.json();
    if (res.status === 200 && result.message === "OTP sent") {
      console.log("✅ Live Demo system connected and functional");
    } else {
      console.error("❌ Live Demo response error:", result);
    }
  } catch (err) {
    console.error("❌ Error sending OTP:", err.message);
  }
}

document.addEventListener("DOMContentLoaded", testCTADemoSystem);
