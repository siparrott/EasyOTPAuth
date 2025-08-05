export default function TestEmailPage() {
  async function testSendEmail() {
    const res = await fetch('/api/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'siparrott@yahoo.co.uk' })
    });
    const data = await res.json();
    console.log('Test response:', data);
  }

  return (
    <div>
      <h1>Test Email Sender</h1>
      <button onClick={testSendEmail}>Send Test Email</button>
    </div>
  );
}
