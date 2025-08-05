export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ success: false, message: 'Email and code are required' });
  }

  // For demo purposes, accept any 6-digit code
  // In production, you'd verify against stored codes
  if (code.length === 6 && /^\d{6}$/.test(code)) {
    return res.status(200).json({ 
      success: true, 
      message: 'Verification successful',
      token: 'demo-jwt-token-here' // In production, generate a real JWT
    });
  } else {
    return res.status(400).json({ 
      success: false, 
      message: 'Invalid code. Please enter a 6-digit number.' 
    });
  }
}
