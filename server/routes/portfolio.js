const router = require('express').Router();
const auth = require('../middleware/auth');

// GET /api/portfolio/value
// Returns total portfolio value in USD by combining live prices + holdings
router.get('/value', auth, async (req, res) => {
  try {
    const user = req.user;
    if (!user.holdings || user.holdings.length === 0) {
      return res.json({
        totalUSD: user.cashBalanceUSD || 0,
        cashUSD: user.cashBalanceUSD || 0,
        cryptoUSD: 0,
        breakdown: [],
      });
    }

    const ids = user.holdings.map(h => h.asset).join(',');
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`
    );
    const priceMap = await response.json();

    let cryptoUSD = 0;
    const breakdown = user.holdings.map(h => {
      const price = priceMap[h.asset]?.usd || 0;
      const change24h = priceMap[h.asset]?.usd_24h_change || 0;
      const valueUSD = h.amount * price;
      const gainLoss = valueUSD - (h.amount * h.avgBuyPrice);
      cryptoUSD += valueUSD;
      return {
        symbol: h.symbol,
        asset: h.asset,
        amount: h.amount,
        currentPrice: price,
        valueUSD,
        avgBuyPrice: h.avgBuyPrice,
        gainLoss,
        gainLossPct: h.avgBuyPrice > 0 ? ((price - h.avgBuyPrice) / h.avgBuyPrice) * 100 : 0,
        change24h,
      };
    });

    res.json({
      totalUSD: (user.cashBalanceUSD || 0) + cryptoUSD,
      cashUSD: user.cashBalanceUSD || 0,
      cryptoUSD,
      breakdown,
    });
  } catch (err) {
    console.error('Portfolio error:', err);
    res.status(502).json({ error: 'Could not calculate portfolio value' });
  }
});

module.exports = router;
