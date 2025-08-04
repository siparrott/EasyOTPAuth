document.addEventListener("DOMContentLoaded", function () {
  const el = document.getElementById("typewriter");
  if (el) {
    el.textContent = "Welcome to EasyOTPAuth!";
  } else {
    console.warn("Element with ID 'typewriter' not found.");
  }
});
