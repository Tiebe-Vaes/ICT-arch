const express = require('express');
const app = express();

// Simulate failure modes via environment variable:
//   FAILURE_MODE=none      → always responds normally (default)
//   FAILURE_MODE=timeout   → always times out (6s delay)
//   FAILURE_MODE=error     → always returns 500
//   FAILURE_MODE=flaky     → 40% chance of timeout, 60% normal
const FAILURE_MODE = process.env.FAILURE_MODE || 'none';

const HOTELS = [
  { property_name: "Hotel Roma",      price: 120, stars: 4, city: "rome"   },
  { property_name: "B&B Central",     price:  65, stars: 3, city: "rome"   },
  { property_name: "Grand Brussels",  price: 145, stars: 5, city: "brussels"},
  { property_name: "Hostel Midi",     price:  38, stars: 2, city: "brussels"},
  { property_name: "Canal View Inn",  price:  98, stars: 3, city: "bruges"  },
];

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

app.get('/health', (req, res) => res.json({ status: 'ok', mode: FAILURE_MODE }));

app.get('/hotels', async (req, res) => {
  const city = (req.query.city || '').toLowerCase();
  const requestId = Math.random().toString(36).slice(2, 7);
  console.log(`[${requestId}] GET /hotels?city=${city}  mode=${FAILURE_MODE}`);

  if (FAILURE_MODE === 'error') {
    console.log(`[${requestId}] → 500 Internal Server Error`);
    return res.status(500).json({ error: 'Internal provider error' });
  }

  if (FAILURE_MODE === 'timeout') {
    console.log(`[${requestId}] → timing out (6000ms)`);
    await delay(6000);
    return res.json([]);
  }

  if (FAILURE_MODE === 'flaky') {
    if (Math.random() < 0.4) {
      console.log(`[${requestId}] → flaky timeout (3500ms)`);
      await delay(3500);
      return res.json([]);
    }
  }

  // Normal response: slight realistic delay
  await delay(150 + Math.random() * 100);
  const results = city
    ? HOTELS.filter(h => h.city === city)
    : HOTELS;

  console.log(`[${requestId}] → 200 OK  (${results.length} results)`);
  res.json(results);
});

app.listen(3000, () => {
  console.log(`Mock hotel API running on :3000  [mode=${FAILURE_MODE}]`);
});
