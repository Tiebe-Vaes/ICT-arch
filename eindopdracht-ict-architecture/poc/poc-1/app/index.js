import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import os from 'node:os';
import fs from 'node:fs';
import 'dotenv/config';

// Read from Swarm secret file if present, else from env (lokaal).
const readSecret = (name) => {
  const filePath = `/run/secrets/${name.toLowerCase()}`;
  if (fs.existsSync(filePath)) return fs.readFileSync(filePath, 'utf8').trim();
  return process.env[name];
};

const GITHUB_CLIENT_ID = readSecret('GITHUB_CLIENT_ID');
const GITHUB_CLIENT_SECRET = readSecret('GITHUB_CLIENT_SECRET');
const JWT_SECRET = readSecret('JWT_SECRET');
const { CALLBACK_URL, PORT = 8080 } = process.env;

if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET || !JWT_SECRET) {
  console.error('Missing secrets. Check Swarm secrets or .env');
  process.exit(1);
}

const app = express();
app.use(express.static('public'));

// Signed state: nonce + HMAC(nonce, JWT_SECRET). Geen store nodig, werkt op elke replica.
const signState = (nonce) => {
  const sig = crypto.createHmac('sha256', JWT_SECRET).update(nonce).digest('hex').slice(0, 32);
  return `${nonce}.${sig}`;
};
const verifyState = (state) => {
  if (!state || !state.includes('.')) return false;
  const [nonce, sig] = state.split('.');
  const expected = crypto.createHmac('sha256', JWT_SECRET).update(nonce).digest('hex').slice(0, 32);
  return sig.length === expected.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
};

// 1. Start OAuth.
app.get('/login', (req, res) => {
  const state = signState(crypto.randomBytes(16).toString('hex'));
  const url = new URL('https://github.com/login/oauth/authorize');
  url.searchParams.set('client_id', GITHUB_CLIENT_ID);
  url.searchParams.set('redirect_uri', CALLBACK_URL);
  url.searchParams.set('scope', 'read:user');
  url.searchParams.set('state', state);
  res.redirect(url.toString());
});

// 2. Callback: state check, code-for-token, get user, issue eigen JWT.
app.get('/callback', async (req, res) => {
  const { code, state } = req.query;
  if (!verifyState(state)) return res.status(400).send('Invalid state');

  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: GITHUB_CLIENT_ID, client_secret: GITHUB_CLIENT_SECRET, code, redirect_uri: CALLBACK_URL }),
  });
  const { access_token, error } = await tokenRes.json();
  if (error || !access_token) return res.status(400).send(`Token exchange failed: ${error || 'unknown'}`);

  const userRes = await fetch('https://api.github.com/user', {
    headers: { 'Authorization': `Bearer ${access_token}`, 'User-Agent': 'poc1-app' },
  });
  const user = await userRes.json();

  const token = jwt.sign({ sub: user.login, name: user.name, iss: 'poc1' }, JWT_SECRET, { expiresIn: '1h' });
  res.redirect(`/?token=${encodeURIComponent(token)}`);
});

// 3. Beschermd endpoint. JWT verify met gedeeld secret, geen state.
// Connection: close forceert browser om TCP te sluiten -> volgende request hit ander replica via mesh round-robin.
app.get('/me', (req, res) => {
  res.set('Connection', 'close');
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).send('Missing Bearer token');
  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET);
    res.json({ user: payload.sub, name: payload.name, servedBy: os.hostname() });
  } catch {
    res.status(401).send('Invalid or expired token');
  }
});

app.listen(PORT, () => console.log(`poc1 on :${PORT}`));
