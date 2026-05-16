# POC 1 - OAuth login + eigen JWT

## Doel

User logt in via externe OAuth-provider (GitHub). Backend ontvangt authorization code, wisselt om voor access token, haalt user-info op, en geeft een eigen JWT terug aan de client. De app beheert zelf geen passwords.

Quality attribute: **Confidentiality** (delegatie van authenticatie aan vertrouwde provider, geen wachtwoorden in de app).

## OAuth provider

GitHub OAuth (Authorization Code flow). Snelste setup, geen verification nodig voor POC.
Productie-richting: zelfde flow met Google of self-hosted IdP, alleen endpoints wisselen.

## Run

```bash
cd app
cp .env.example .env   # vul GITHUB_CLIENT_ID en _SECRET in
npm install
npm start
```

Open http://localhost:8080.

## Demo

1. Klik **Login with GitHub** → redirect naar GitHub → consent.
2. GitHub redirect terug naar `/callback?code=...`.
3. Backend wisselt code in voor access token, haalt user-info, signt eigen JWT.
4. Browser ontvangt JWT, slaat op in `localStorage`.
5. Klik **Call /me** → request met `Authorization: Bearer <JWT>` → response `{user, name}`.

```bash
# CLI variant
curl http://localhost:8080/me -H "Authorization: Bearer <JWT>"
```

## Resultaat

Gebruiker authenticeert via externe provider. De app slaat geen wachtwoorden op en gebruikt enkel een eigen JWT als sessie-token.
