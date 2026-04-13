const router = require('express').Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const KYC = require('../models/KYC');

// Admin middleware
const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// GET /api/admin/stats
router.get('/stats', auth, adminOnly, async (req, res) => {
  try {
    const totalUsers     = await User.countDocuments({ role: 'user' });
    const kycPending     = await KYC.countDocuments({ status: 'under_review' });
    const kycApproved    = await KYC.countDocuments({ status: 'approved' });
    const allUsers       = await User.find({ role: 'user' }).select('-password');
    const totalPortfolio = allUsers.reduce((s, u) => s + (u.cashBalanceUSD || 0), 0);

    res.json({ totalUsers, kycPending, kycApproved, totalPortfolio });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// GET /api/admin/users
router.get('/users', auth, adminOnly, async (req, res) => {
  try {
    const users = await User.find({ role: 'user' })
      .select('-password')
      .sort({ createdAt: -1 });
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET /api/admin/users/:id
router.get('/users/:id', auth, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    const kyc = await KYC.findOne({ user: req.params.id });
    res.json({ user, kyc });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// PATCH /api/admin/users/:id/balance
// Lets admin adjust a user's cash balance
router.patch('/users/:id/balance', auth, adminOnly, async (req, res) => {
  try {
    const { cashBalanceUSD, note } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const prev = user.cashBalanceUSD || 0;
    user.cashBalanceUSD = cashBalanceUSD;

    // Log it as a transaction
    user.transactions.push({
      type: cashBalanceUSD > prev ? 'deposit' : 'withdrawal',
      asset: 'USD',
      amount: Math.abs(cashBalanceUSD - prev),
      amountUSD: Math.abs(cashBalanceUSD - prev),
      note: note || `Admin adjustment by ${req.user.email}`,
      status: 'completed',
    });

    await user.save();
    res.json({ user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ error: 'Balance update failed' });
  }
});

// PATCH /api/admin/users/:id/holdings
// Lets admin set a user's crypto holdings
router.patch('/users/:id/holdings', auth, adminOnly, async (req, res) => {
  try {
    const { holdings } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.holdings = holdings;
    await user.save();
    res.json({ user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ error: 'Holdings update failed' });
  }
});

// PATCH /api/admin/users/:id/suspend
router.patch('/users/:id/suspend', auth, adminOnly, async (req, res) => {
  try {
    const { suspended } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id, { suspended }, { new: true }
    ).select('-password');
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// GET /api/admin/kyc
router.get('/kyc', auth, adminOnly, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const kycs = await KYC.find(filter)
      .populate('user', 'firstName lastName email accountNumber')
      .sort({ submittedAt: -1 });
    res.json({ kycs });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch KYC list' });
  }
});

// PATCH /api/admin/kyc/:id/approve
router.patch('/kyc/:id/approve', auth, adminOnly, async (req, res) => {
  try {
    const kyc = await KYC.findByIdAndUpdate(
      req.params.id,
      { status: 'approved', reviewedBy: req.user._id, reviewedAt: new Date() },
      { new: true }
    ).populate('user', 'firstName lastName email');

    await User.findByIdAndUpdate(kyc.user._id, { kycVerified: true, kycStatus: 'approved' });
    res.json({ kyc, message: 'KYC approved' });
  } catch (err) {
    res.status(500).json({ error: 'Approval failed' });
  }
});

// PATCH /api/admin/kyc/:id/reject
router.patch('/kyc/:id/reject', auth, adminOnly, async (req, res) => {
  try {
    const { reason } = req.body;
    const kyc = await KYC.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected', rejectionReason: reason, reviewedBy: req.user._id, reviewedAt: new Date() },
      { new: true }
    ).populate('user', 'firstName lastName email');

    await User.findByIdAndUpdate(kyc.user._id, { kycStatus: 'rejected' });
    res.json({ kyc, message: 'KYC rejected' });
  } catch (err) {
    res.status(500).json({ error: 'Rejection failed' });
  }
});

module.exports = router;
