const router = require('express').Router();
const { execSync } = require('child_process');
const auth = require('../middleware/auth');

// GET /api/converter?from=usd&to=bitcoin&amount=100
router.get('/', auth, async (req, res) => {
  try {
    const { from = 'usd', to = 'bitcoin', amount = 1 } = req.query;
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${to}&vs_currencies=${from}`;
    const result = execSync(
      `curl -s -m 10 -H "Accept: application/json" "${url}"`,
      { encoding: 'utf8', timeout: 15000 }
    );
    const data = JSON.parse(result);
    const price = data[to]?.[from];
    if (!price) return res.status(400).json({ error: 'Invalid currency pair' });
    const converted = parseFloat(amount) / price;
    res.json({ from, to, amount: parseFloat(amount), price, converted, rate: price });
  } catch (err) {
    res.status(502).json({ error: 'Conversion failed' });
  }
});

module.exports = router;
