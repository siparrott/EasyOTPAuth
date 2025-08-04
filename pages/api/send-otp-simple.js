export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    // 📨 Simulate OTP send
    console.log('Pretending to send OTP to:', email);

    // Generate a random 6-digit OTP for simulation
    const simulatedOTP = Math.floor(100000 + Math.random() * 900000);
    console.log(`Simulated OTP for ${email}: ${simulatedOTP}`);

    return res.status(200).json({ 
      success: true, 
      message: 'OTP sent (simulated).', 
      // In a real app, never return the OTP in the response!
      // This is only for testing purposes
      debug: {
        simulatedOTP: simulatedOTP,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error sending OTP:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
