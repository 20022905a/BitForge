const router = require('express').Router();
const { execSync } = require('child_process');

const SUPPORTED = [
  'bitcoin', 'ethereum', 'solana', 'ripple',
  'cardano', 'dogecoin', 'avalanche-2', 'chainlink'
];

let cache = { data: null, fetchedAt: 0 };
const CACHE_TTL = 60_000;

function fetchWithCurl(url) {
  try {
    const result = execSync(
      `curl -s -m 15 -H "Accept: application/json" -H "User-Agent: BitForge/1.0" "${url}"`,
      { encoding: 'utf8', timeout: 20000 }
    );
    return JSON.parse(result);
  } catch (err) {
    throw new Error('curl failed: ' + err.message);
  }
}

// GET /api/prices
router.get('/', async (req, res) => {
  try {
    const now = Date.now();
    if (cache.data && now - cache.fetchedAt < CACHE_TTL) {
      return res.json({ prices: cache.data, cached: true });
    }

    const ids = SUPPORTED.join(',');
    const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&sparkline=false&price_change_percentage=1h,24h,7d`;

    const data = fetchWithCurl(url);

    if (!Array.isArray(data)) {
      throw new Error('Invalid response: ' + JSON.stringify(data).slice(0, 100));
    }

    cache = { data, fetchedAt: now };
    res.json({ prices: data, cached: false });
  } catch (err) {
    console.error('Prices error:', err.message);
    if (cache.data) return res.json({ prices: cache.data, cached: true, stale: true });
    res.status(502).json({ error: 'Could not fetch prices', detail: err.message });
  }
});

// GET /api/prices/:coinId
router.get('/:coinId', async (req, res) => {
  try {
    const { coinId } = req.params;
    const url = `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=7&interval=daily`;
    const data = fetchWithCurl(url);
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

module.exports = router;
