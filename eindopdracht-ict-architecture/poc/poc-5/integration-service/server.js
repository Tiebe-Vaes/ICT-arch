const express = require('express');
const { BookingComAdapter } = require('./adapters');

const app = express();
const HOTEL_API_URL = process.env.HOTEL_API_URL || 'http://mock-hotel-api:3000';
const adapter = new BookingComAdapter(HOTEL_API_URL);

// ── Facade ────────────────────────────────────────────────────────────────────

async function searchHotels(city) {
  const results = await adapter.searchHotels(city);
  return results.map(r => r.toDict());
}

// ── HTTP endpoints (for POC demonstration only) ───────────────────────────────

app.get('/health', (req, res) => {
  res.json({ status: 'ok', hotel_api: HOTEL_API_URL });
});

app.get('/hotels', async (req, res) => {
  const city = req.query.city || 'rome';
  try {
    const results = await searchHotels(city);
    res.json({
      city,
      count:   results.length,
      hotels:  results,
      circuit: adapter.circuitStatus(),
    });
  } catch (err) {
    res.status(503).json({
      error:   err.message,
      circuit: adapter.circuitStatus(),
    });
  }
});

app.get('/circuit', (req, res) => {
  res.json(adapter.circuitStatus());
});

app.listen(5000, () => {
  console.info(`Integration service starting — hotel API at ${HOTEL_API_URL}`);
});
