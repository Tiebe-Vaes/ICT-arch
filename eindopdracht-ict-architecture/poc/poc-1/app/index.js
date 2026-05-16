import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import 'dotenv/config';

const {
  GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET,
  JWT_SECRET,
  CALLBACK_URL,
  PORT = 8080,
} = process.env;

if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET || !JWT_SECRET) {
  console.error('Missing secrets. Check .env');
  process.exit(1);
}

const app = express();
app.use(express.static('public'));

// 1. Start OAuth.
app.get('/login', (req, res) => {
  const state = crypto.randomBytes(16).toString('hex');
  const url = new URL('https://github.com/login/oauth/authorize');
  url.searchParams.set('client_id', GITHUB_CLIENT_ID);
  url.searchParams.set('redirect_uri', CALLBACK_URL);
  url.searchParams.set('scope', 'read:user');
  url.searchParams.set('state', state);
  res.cookie('oauth_state', state, { httpOnly: true, sameSite: 'lax' });
  res.redirect(url.toString());
});

// 2. Callback: state check, code-for-token, get user, issue eigen JWT.
app.get('/callback', async (req, res) => {
  const { code, state } = req.query;
  if (!state || state !== req.headers.cookie?.match(/oauth_state=([^;]+)/)?.[1]) {
    return res.status(400).send('Invalid state');
  }

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

// 3. Beschermd endpoint. JWT verify met secret.
app.get('/me', (req, res) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).send('Missing Bearer token');
  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET);
    res.json({ user: payload.sub, name: payload.name });
  } catch {
    res.status(401).send('Invalid or expired token');
  }
});

app.listen(PORT, () => console.log(`poc1 on :${PORT}`));
