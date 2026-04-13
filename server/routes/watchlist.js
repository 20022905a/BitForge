const router = require('express').Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// GET /api/watchlist
router.get('/', auth, async (req, res) => {
  const user = await User.findById(req.user._id).select('watchlist');
  res.json({ watchlist: user.watchlist || [] });
});

// POST /api/watchlist/:coinId
router.post('/:coinId', auth, async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user.watchlist) user.watchlist = [];
  if (!user.watchlist.includes(req.params.coinId)) {
    user.watchlist.push(req.params.coinId);
    await user.save();
  }
  res.json({ watchlist: user.watchlist });
});

// DELETE /api/watchlist/:coinId
router.delete('/:coinId', auth, async (req, res) => {
  const user = await User.findById(req.user._id);
  user.watchlist = (user.watchlist || []).filter(id => id !== req.params.coinId);
  await user.save();
  res.json({ watchlist: user.watchlist });
});

module.exports = router;
