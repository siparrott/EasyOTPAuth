export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    console.log('Simulated OTP sent to:', email);
    return res.status(200).json({
      success: true,
      message: `OTP (pretend) sent to ${email}`
    });

  } catch (err) {
    console.error('OTP handler error:', err);
    return res.status(500).json({ error: 'Internal server error during OTP send' });
  }
}
