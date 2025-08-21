// public/js/login.js
(() => {
  // Prevent double-binding if this file is ever included twice by mistake.
  if (window.__EASYOTP_LOGIN_BOUND__) return;
  window.__EASYOTP_LOGIN_BOUND__ = true;

  const $ = (sel) => document.querySelector(sel);

  const stepEmail  = $('#step-email');
  const stepVerify = $('#step-verify');
  const emailEl    = $('#email');
  const codeEl     = $('#code');
  const msg        = $('#message');
  const emailForm  = $('#email-form');
  const verifyForm = $('#verify-form');
  const sendBtn    = $('#send-btn');
  const backBtn    = $('#back-btn');

  function showMessage(type, text) {
    msg.className = `message show ${type}`;
    msg.textContent = text;
  }

  function toVerifyStep() {
    stepEmail.classList.remove('active');
    stepVerify.classList.add('active');
  }

  function toEmailStep() {
    stepVerify.classList.remove('active');
    stepEmail.classList.add('active');
  }

  async function postJSON(url, body) {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    let data = {};
    try { data = await r.json(); } catch {}
    if (!r.ok) {
      throw new Error(data.detail || data.error || `HTTP ${r.status}`);
    }
    return data;
  }

  async function onSend(e) {
    e?.preventDefault?.();
    const email = (emailEl.value || '').trim();
    if (!/.+@.+\..+/.test(email)) {
      return showMessage('error', 'Please enter a valid email address.');
    }

    sendBtn.disabled = true;
    showMessage('info', 'Sending…');
    try {
      await postJSON('/api/send-otp', { email });
      showMessage('success', 'Check your inbox for the 6-digit code.');
      toVerifyStep();
      codeEl.focus();
    } catch (err) {
      console.error(err);
      showMessage('error', 'Failed to send email');
    } finally {
      sendBtn.disabled = false;
    }
  }

  function onBack() {
    toEmailStep();
    showMessage('info', 'You can request another code.');
  }

  // Real verify function that calls the API
  async function onVerify(e) {
    e?.preventDefault?.();
    const email = (emailEl.value || '').trim();
    const code = (codeEl.value || '').trim();
    
    if (!/^\d{6}$/.test(code)) {
      return showMessage('error', 'Please enter the 6-digit code.');
    }

    const verifyBtn = document.getElementById('verify-btn');
    if (verifyBtn) verifyBtn.disabled = true;
    showMessage('info', 'Verifying code...');
    
    try {
      const response = await postJSON('/api/verify-otp', { email, otp: code });
      showMessage('success', 'Success! You have been authenticated.');
      setTimeout(() => {
        window.location.href = '/success.html';
      }, 900);
    } catch (err) {
      console.error(err);
      showMessage('error', err.message || 'Invalid code. Please try again.');
    } finally {
      if (verifyBtn) verifyBtn.disabled = false;
    }
  }

  emailForm?.addEventListener('submit', onSend);
  sendBtn?.addEventListener('click', onSend);
  backBtn?.addEventListener('click', onBack);
  verifyForm?.addEventListener('submit', onVerify);
})();
