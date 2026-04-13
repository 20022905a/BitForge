const router = require('express').Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const { otpStore, generateOTP } = require('./twofa');

const signToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone } = req.body;
    if (!firstName || !lastName || !email || !password)
      return res.status(400).json({ error: 'All fields are required' });
    if (password.length < 8)
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ error: 'Email already registered' });
    const user = await User.create({ firstName, lastName, email, password, phone });
    const token = signToken(user._id);
    res.status(201).json({ token, user: user.toSafeObject() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const valid = await user.comparePassword(password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    if (user.suspended) return res.status(403).json({ error: 'Account suspended. Contact support.' });

    user.lastLogin = new Date();
    await user.save();

    // If 2FA is enabled, send OTP and require verification
    if (user.twoFAEnabled) {
      const otp = generateOTP();
      otpStore.set(user.email, { code: otp, expires: Date.now() + 10 * 60 * 1000 });
      console.log(`\n📧 2FA OTP for ${user.email}: ${otp}\n`);
      return res.json({ 
        requires2FA: true, 
        email: user.email,
        // Return OTP in dev mode so you can test
        ...(process.env.NODE_ENV !== 'production' && { devOtp: otp })
      });
    }

    const token = signToken(user._id);
    res.json({ token, user: user.toSafeObject() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/login/2fa - Complete login with OTP
router.post('/login/2fa', async (req, res) => {
  try {
    const { email, code } = req.body;
    const stored = otpStore.get(email);
    if (!stored) return res.status(400).json({ error: 'No OTP found. Please login again.' });
    if (Date.now() > stored.expires) {
      otpStore.delete(email);
      return res.status(400).json({ error: 'OTP expired. Please login again.' });
    }
    if (stored.code !== code) return res.status(400).json({ error: 'Invalid code.' });
    otpStore.delete(email);
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const token = signToken(user._id);
    res.json({ token, user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req, res) => {
  res.json({ user: req.user.toSafeObject() });
});

module.exports = router;
