import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import os from 'node:os';
import 'dotenv/config';

const {
  GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET,
  JWT_SECRET,
  CALLBACK_URL,
  PORT = 8080,
} = process.env;

if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET || !JWT_SECRET) {
  console.error('Missing env vars. Check .env');
  process.exit(1);
}

const app = express();
app.use(express.static('public'));

// In-memory state store. Productie: signed cookie of Redis.
const pendingStates = new Set();

// 1. Start OAuth flow. Browser klikt hier.
app.get('/login', (req, res) => {
  const state = crypto.randomBytes(16).toString('hex');
  pendingStates.add(state);

  const url = new URL('https://github.com/login/oauth/authorize');
  url.searchParams.set('client_id', GITHUB_CLIENT_ID);
  url.searchParams.set('redirect_uri', CALLBACK_URL);
  url.searchParams.set('scope', 'read:user');
  url.searchParams.set('state', state);

  res.redirect(url.toString());
});

// 2. GitHub redirect hier terug met ?code=...&state=...
app.get('/callback', async (req, res) => {
  const { code, state } = req.query;

  if (!pendingStates.has(state)) {
    return res.status(400).send('Invalid state. CSRF protection blocked this.');
  }
  pendingStates.delete(state);

  // Back-channel: code wisselen voor access_token bij auth server.
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

  // Resource server: user info ophalen met Bearer.
  const userRes = await fetch('https://api.github.com/user', {
    headers: { 'Authorization': `Bearer ${access_token}`, 'User-Agent': 'poc1-app' },
  });
  const user = await userRes.json();

  // Eigen JWT issuen. GitHub's access_token gooien we weg.
  const token = jwt.sign(
    { sub: user.login, name: user.name, iss: 'poc1' },
    JWT_SECRET,
    { expiresIn: '1h' },
  );

  res.redirect(`/?token=${encodeURIComponent(token)}`);
});

// 3. Beschermd endpoint. Verifieert JWT met gedeeld secret. Stateless.
app.get('/me', (req, res) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).send('Missing Bearer token');
  }
  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET);
    res.json({ user: payload.sub, name: payload.name, servedBy: os.hostname() });
  } catch {
    res.status(401).send('Invalid or expired token');
  }
});

app.listen(PORT, () => console.log(`poc1 on :${PORT}`));
