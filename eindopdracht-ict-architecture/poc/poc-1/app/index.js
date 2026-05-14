import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import os from 'node:os';
import fs from 'node:fs';
import { createClient } from 'redis';
import 'dotenv/config';

// Read from Swarm secret file if present, else from env. Lets same image work locally + in Swarm.
const readSecret = (name) => {
  const filePath = `/run/secrets/${name.toLowerCase()}`;
  if (fs.existsSync(filePath)) return fs.readFileSync(filePath, 'utf8').trim();
  return process.env[name];
};

const GITHUB_CLIENT_ID = readSecret('GITHUB_CLIENT_ID');
const GITHUB_CLIENT_SECRET = readSecret('GITHUB_CLIENT_SECRET');
const JWT_SECRET = readSecret('JWT_SECRET');
const { CALLBACK_URL, PORT = 8080, REDIS_URL = 'redis://redis:6379' } = process.env;

if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET || !JWT_SECRET) {
  console.error('Missing secrets. Check Swarm secrets or .env');
  process.exit(1);
}

const redis = createClient({ url: REDIS_URL });
redis.on('error', err => console.error('Redis error', err.message));
await redis.connect();

const app = express();
app.use(express.static('public'));

// Signed state: state = random + HMAC(random, JWT_SECRET). Verify by recomputing HMAC.
// No cookie, no server store. Stateless across replicas.
const signState = (nonce) => {
  const sig = crypto.createHmac('sha256', JWT_SECRET).update(nonce).digest('hex').slice(0, 32);
  return `${nonce}.${sig}`;
};
const verifyState = (state) => {
  if (!state || !state.includes('.')) return false;
  const [nonce, sig] = state.split('.');
  const expected = crypto.createHmac('sha256', JWT_SECRET).update(nonce).digest('hex').slice(0, 32);
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
};

// 1. Start OAuth flow.
app.get('/login', (req, res) => {
  const nonce = crypto.randomBytes(16).toString('hex');
  const state = signState(nonce);

  const url = new URL('https://github.com/login/oauth/authorize');
  url.searchParams.set('client_id', GITHUB_CLIENT_ID);
  url.searchParams.set('redirect_uri', CALLBACK_URL);
  url.searchParams.set('scope', 'read:user');
  url.searchParams.set('state', state);

  res.redirect(url.toString());
});

// 2. GitHub redirect terug met ?code=&state=.
app.get('/callback', async (req, res) => {
  const { code, state } = req.query;

  if (!verifyState(state)) {
    return res.status(400).send('Invalid state. CSRF protection blocked this.');
  }

  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: GITHUB_CLIENT_ID,
      client_secret: GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: CALLBACK_URL,
    }),
  });
  const { access_token, error } = await tokenRes.json();
  if (error || !access_token) {
    return res.status(400).send(`Token exchange failed: ${error || 'unknown'}`);
  }

  const userRes = await fetch('https://api.github.com/user', {
    headers: { 'Authorization': `Bearer ${access_token}`, 'User-Agent': 'poc1-app' },
  });
  const user = await userRes.json();

  const token = jwt.sign(
    { sub: user.login, name: user.name, iss: 'poc1' },
    JWT_SECRET,
    { expiresIn: '1h', jwtid: crypto.randomBytes(8).toString('hex') },
  );

  res.redirect(`/?token=${encodeURIComponent(token)}`);
});

// Helper: extract & verify Bearer JWT, check revocation list.
const authenticate = async (req) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return { error: 'Missing Bearer token', status: 401 };
  try {
    const token = auth.slice(7);
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.jti && await redis.exists(`revoked:${payload.jti}`)) {
      return { error: 'Token revoked', status: 401 };
    }
    return { payload };
  } catch {
    return { error: 'Invalid or expired token', status: 401 };
  }
};

// 3. Beschermd endpoint.
app.get('/me', async (req, res) => {
  const { payload, error, status } = await authenticate(req);
  if (error) return res.status(status).send(error);
  res.json({ user: payload.sub, name: payload.name, servedBy: os.hostname() });
});

// 4. Logout: voeg jti toe aan Redis blacklist met TTL = resterende JWT-levensduur.
app.post('/logout', async (req, res) => {
  const { payload, error, status } = await authenticate(req);
  if (error) return res.status(status).send(error);
  if (!payload.jti) return res.status(400).send('Token has no jti');

  const ttl = Math.max(1, payload.exp - Math.floor(Date.now() / 1000));
  await redis.set(`revoked:${payload.jti}`, '1', { EX: ttl });
  res.json({ revoked: payload.jti, ttl, servedBy: os.hostname() });
});

app.listen(PORT, () => console.log(`poc1 on :${PORT}`));
