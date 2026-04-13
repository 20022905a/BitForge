const router = require('express').Router();
const crypto = require('crypto');
const auth = require('../middleware/auth');
const User = require('../models/User');

/**
 * MoonPay requires widget URLs to be signed with HMAC-SHA256.
 * The secret key NEVER goes to the frontend — only this server knows it.
 */
function signUrl(url) {
  const signature = crypto
    .createHmac('sha256', process.env.MOONPAY_SECRET_KEY)
    .update(new URL(url).search)
    .digest('base64');
  return signature;
}

// POST /api/moonpay/sign-url
// Body: { url: "https://buy-sandbox.moonpay.com?..." }
router.post('/sign-url', auth, (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'url is required' });

    const signature = signUrl(url);
    res.json({ signature });
  } catch (err) {
    console.error('MoonPay signing error:', err);
    res.status(500).json({ error: 'Signing failed' });
  }
});

// GET /api/moonpay/config
// Returns the public API key and environment for the frontend
router.get('/config', auth, (req, res) => {
  res.json({
    apiKey: process.env.MOONPAY_API_KEY,
    environment: process.env.MOONPAY_API_KEY?.startsWith('pk_test') ? 'sandbox' : 'production',
    email: req.user.email,
  });
});

// POST /api/moonpay/webhook
// MoonPay calls this when a transaction completes — update user balance
router.post('/webhook', async (req, res) => {
  try {
    // In production: verify MoonPay webhook signature here
    const { type, data } = req.body;

    if (type === 'transaction_updated' && data.status === 'completed') {
      const { externalTransactionId, cryptoTransactionId, quoteCurrencyAmount,
              quoteCurrencyCode, baseCurrencyAmount } = data;

      // externalTransactionId should be the user's MongoDB _id
      // (pass it as externalTransactionId in the MoonPay widget params)
      const user = await User.findById(externalTransactionId);
      if (!user) return res.status(404).json({ error: 'User not found' });

      const symbol = quoteCurrencyCode.toUpperCase();
      const assetId = quoteCurrencyCode.toLowerCase();

      // Add or update holding
      const idx = user.holdings.findIndex(h => h.symbol === symbol);
      if (idx >= 0) {
        const existing = user.holdings[idx];
        const totalUnits = existing.amount + quoteCurrencyAmount;
        const totalCost = (existing.avgBuyPrice * existing.amount) + baseCurrencyAmount;
        user.holdings[idx].amount = totalUnits;
        user.holdings[idx].avgBuyPrice = totalCost / totalUnits;
      } else {
        user.holdings.push({
          asset: assetId, symbol,
          amount: quoteCurrencyAmount,
          avgBuyPrice: baseCurrencyAmount / quoteCurrencyAmount,
        });
      }

      user.transactions.push({
        type: 'deposit',
        asset: symbol,
        amount: quoteCurrencyAmount,
        amountUSD: baseCurrencyAmount,
        note: `Purchased via MoonPay`,
        moonpayTransactionId: cryptoTransactionId,
        status: 'completed',
      });

      await user.save();
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

module.exports = router;
