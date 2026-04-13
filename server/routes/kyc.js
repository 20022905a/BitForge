const router = require('express').Router();
const auth = require('../middleware/auth');
const KYC = require('../models/KYC');
const User = require('../models/User');

// POST /api/kyc/submit
router.post('/submit', auth, async (req, res) => {
  try {
    const existing = await KYC.findOne({ user: req.user._id });
    if (existing && existing.status === 'approved') {
      return res.status(400).json({ error: 'KYC already approved' });
    }

    const kycData = {
      user: req.user._id,
      ...req.body,
      status: 'under_review',
      submittedAt: new Date(),
    };

    let kyc;
    if (existing) {
      kyc = await KYC.findOneAndUpdate({ user: req.user._id }, kycData, { new: true });
    } else {
      kyc = await KYC.create(kycData);
    }

    // Update user kyc status
    await User.findByIdAndUpdate(req.user._id, { kycStatus: 'under_review' });

    res.json({ kyc, message: 'KYC submitted successfully. Under review.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Submission failed' });
  }
});

// GET /api/kyc/status
router.get('/status', auth, async (req, res) => {
  try {
    const kyc = await KYC.findOne({ user: req.user._id });
    res.json({ kyc });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch KYC status' });
  }
});

module.exports = router;
