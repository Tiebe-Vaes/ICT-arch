# ADR-003 — Authenticatie en sessiebeheer

Formaat: MADR 3.0. Referentie: https://adr.github.io/madr/

## Status

Proposed

## Context and Problem Statement

De applicatie moet gebruikers identificeren en autoriseren over web en mobiel. Gebruikers verwachten een lage drempel (geen extra wachtwoord). De backend draait als een modulaire monoliet (ADR-001) en moet op termijn opdelen in services — sessiebeheer mag dit pad niet blokkeren.

Hoe regelen we authenticatie zonder wachtwoorden zelf op te slaan, terwijl het mechanisme schaalbaar blijft en compatibel met latere splitsing?

## Decision Drivers

1. Confidentiality (geen wachtwoorden beheren in eigen app)
2. Schaalbaarheid (stateless of minimaal-state)
3. Compatibiliteit met mobiele clients en web SPA
4. Lage operationele complexiteit
5. Migratiepad naar microservices
6. Standaarden volgen (geen eigen crypto)

## Considered Options

1. Eigen username/password met sessie-cookie en server-side store
2. Eigen username/password met JWT
3. OAuth2 Authorization Code via externe provider (GitHub, Google) + eigen JWT
4. OpenID Connect via externe IdP (Keycloak, Auth0) + eigen JWT
5. Magic-link / passwordless via e-mail

## Decision Outcome

Gekozen: **OAuth2 Authorization Code flow** via externe provider (GitHub voor POC, Google in productie), gevolgd door uitgifte van een **eigen JWT** (HS256, korte levensduur, refresh-token apart).

Tweede keuze: **OpenID Connect via self-hosted Keycloak**. Verworpen voor MVP wegens extra operationele last; blijft een open optie wanneer enterprise-SSO of fine-grained user-management nodig wordt.

## Pros and Cons of the Options

### 1. Eigen username/password + server-side sessie

Pro:
- Volledige controle
Con:
- Wachtwoord-beheer, hashing, reset-flows, breach-risico
- Server-side sessie-store wordt stateful bottleneck

### 2. Eigen username/password + JWT

Pro:
- Stateless verificatie
Con:
- Nog steeds wachtwoorden beheren
- Geen meerwaarde t.o.v. optie 1 qua compliance

### 3. OAuth2 Auth Code via externe provider + eigen JWT (gekozen)

Pro:
- Geen wachtwoorden in eigen DB
- Provider handelt MFA, recovery, account-lockout af
- JWT laat alle backend-replicas validatie doen zonder shared store
- Snel te implementeren (zie POC 1)
- Standaardprotocol, brede library-support

Con:
- Afhankelijk van externe provider-beschikbaarheid (mitigatie: meerdere providers ondersteunen)
- Token-revocation is minder triviaal (kort houden + refresh)

### 4. OpenID Connect via self-hosted Keycloak

Pro:
- Volledige controle over user-store en flows
- SSO over meerdere apps
- Rijke admin-features

Con:
- Extra component om te beheren en updaten
- Overkill voor MVP
- Operationeel zwaarder

### 5. Magic-link / passwordless

Pro:
- Geen wachtwoorden, lage frictie

Con:
- Afhankelijk van e-mail-deliverability
- Trager dan klassieke flow
- Minder bekend bij gebruikers in deze niche

## Consequences

Positief:
- Geen wachtwoord-incidenten in scope
- Stateless backend: elke replica valideert JWT met gedeeld secret
- POC 1 toont end-to-end flow + token-issuance
- Lock-in beperkt: zelfde flow werkt met Google, Apple, eigen IdP

Negatief:
- JWT-revocation vereist korte levensduur + refresh-strategie
- Provider-down = login-down (mitigeerbaar met meerdere providers)
- Refresh-tokens vereisen veilige opslag op client (HttpOnly cookie of secure storage op mobiel)

## Implementation Notes

- Access-token: JWT, HS256, exp 1u, payload `{sub, name, iss, iat, exp}`
- Refresh-token: opaque string, server-side hash-store, exp 30 dagen, rotatie bij gebruik
- `JWT_SECRET` via env-variabele uit `.env` (lokaal) of secret-store (productie)
- State-parameter verplicht bij OAuth, CSRF-bescherming via cookie
- Frontend bewaart access-token in geheugen (web) of secure storage (mobiel); refresh-token in HttpOnly cookie
- Logout = client clear + refresh-token revoke op server

## Related Decisions

- ADR-001 (Modulaire monoliet)
- ADR-006 (Deployment — JWT past bij replica's)
- ADR-007 (Frontend — token-opslag)

## Validation

- POC 1 demonstreert de volledige flow: login → callback → eigen JWT → `/me`
- Geen wachtwoorden in DB
- p95 token-validatie onder 5 ms (HMAC-verify)
