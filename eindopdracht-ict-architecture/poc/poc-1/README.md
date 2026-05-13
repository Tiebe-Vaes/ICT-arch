# POC 1 - OAuth login (fase 1) + horizontale scaling (fase 2)

## Doel

**Fase 1 (nu)**: User logt in via externe OAuth-provider. Backend ontvangt authorization code, wisselt om voor access token, haalt user-info op, en geeft een eigen JWT terug aan de client.

**Fase 2 (later)**: Zelfde backend draait als 3 replicas in Docker Swarm. Aantonen dat het uitgegeven JWT op elke replica geldig is (stateless), zonder sticky sessions.

Quality attributes: Confidentiality (auth flow), Scalability (fase 2), Availability (fase 2).

## OAuth provider

GitHub OAuth (Authorization Code flow). Snelste setup, geen verification nodig voor POC.
Productie-richting: zelfde flow met Google of self-hosted IdP, alleen endpoints wisselen.

## Run (fase 1, lokaal)

```bash
cd app
npm install
# OAuth client id/secret nodig - zie .env.example
npm start
```

## Demo fase 1 (OAuth flow)

```bash
# 1. Browser opent login-URL, gebruiker logt in bij provider
# 2. Provider redirect naar callback met ?code=...
# 3. Backend wisselt code in voor access token
# 4. Backend geeft eigen JWT terug
# 5. Client gebruikt JWT voor /me

curl http://localhost:8080/me -H "Authorization: Bearer <JWT>"
```

## Demo fase 2 (scaling)

```bash
docker stack deploy -c poc.yaml poc1
# zelfde JWT, 10 requests, verdeeld over 3 replicas
for i in {1..10}; do curl -s http://localhost/me -H "Authorization: Bearer <JWT>"; done
```

## Resultaat

Fase 1: gebruiker authenticeert zonder dat de app zelf passwords beheert.
Fase 2: requests verdeeld over 3 replicas, alle 200 OK, geen sticky sessions nodig.
