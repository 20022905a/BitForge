const router = require('express').Router();
const crypto = require('crypto');
const auth = require('../middleware/auth');
const User = require('../models/User');

// Store OTP codes temporarily in memory (expires in 10 minutes)
const otpStore = new Map(); // email -> { code, expires }

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function sendEmailViaCurl(to, subject, body) {
  // Uses a simple email via curl to a free SMTP service
  // We'll use EmailJS REST API (free tier - 200 emails/month)
  // OR just log to console for school project demo
  console.log(`\n📧 EMAIL TO: ${to}`);
  console.log(`📧 SUBJECT: ${subject}`);
  console.log(`📧 BODY: ${body}`);
  console.log('📧 (In production, connect Resend/SendGrid here)\n');
  return true;
}

// POST /api/2fa/send
// Send OTP to user's email
router.post('/send', auth, async (req, res) => {
  try {
    const user = req.user;
    const otp = generateOTP();
    const expires = Date.now() + 10 * 60 * 1000; // 10 minutes

    otpStore.set(user.email, { code: otp, expires });

    sendEmailViaCurl(
      user.email,
      'BitForge - Your verification code',
      `Your BitForge verification code is: ${otp}\n\nThis code expires in 10 minutes.\n\nIf you did not request this, please ignore this email.`
    );

    res.json({ 
      message: 'OTP sent to your email',
      // In development, return the OTP so you can test without email
      ...(process.env.NODE_ENV !== 'production' && { devOtp: otp })
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// POST /api/2fa/verify
router.post('/verify', auth, async (req, res) => {
  try {
    const { code } = req.body;
    const user = req.user;
    const stored = otpStore.get(user.email);

    if (!stored) return res.status(400).json({ error: 'No OTP found. Please request a new one.' });
    if (Date.now() > stored.expires) {
      otpStore.delete(user.email);
      return res.status(400).json({ error: 'OTP expired. Please request a new one.' });
    }
    if (stored.code !== code) return res.status(400).json({ error: 'Invalid code. Please try again.' });

    otpStore.delete(user.email);

    // Mark 2FA as verified on user
    await User.findByIdAndUpdate(user._id, { twoFAEnabled: true, twoFAVerified: true });

    res.json({ message: '2FA verified successfully', verified: true });
  } catch (err) {
    res.status(500).json({ error: 'Verification failed' });
  }
});

// POST /api/2fa/toggle
router.post('/toggle', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.twoFAEnabled = !user.twoFAEnabled;
    await user.save();
    res.json({ twoFAEnabled: user.twoFAEnabled });
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle 2FA' });
  }
});

module.exports = router;
module.exports.otpStore = otpStore;
module.exports.generateOTP = generateOTP;
