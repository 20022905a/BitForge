const router = require('express').Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// GET /api/user/profile
router.get('/profile', auth, (req, res) => {
  res.json({ user: req.user.toSafeObject() });
});

// PATCH /api/user/profile
router.patch('/profile', auth, async (req, res) => {
  try {
    const { firstName, lastName, phone } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { firstName, lastName, phone },
      { new: true }
    );
    res.json({ user: user.toSafeObject() });
  } catch {
    res.status(500).json({ error: 'Update failed' });
  }
});

// GET /api/user/transactions
router.get('/transactions', auth, async (req, res) => {
  const user = await User.findById(req.user._id);
  const txns = [...user.transactions].sort((a, b) => b.createdAt - a.createdAt);
  res.json({ transactions: txns });
});

// GET /api/user/holdings
router.get('/holdings', auth, (req, res) => {
  res.json({ holdings: req.user.holdings, cashBalanceUSD: req.user.cashBalanceUSD });
});

module.exports = router;
