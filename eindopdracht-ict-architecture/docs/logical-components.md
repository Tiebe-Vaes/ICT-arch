# Logische Componenten

Bepaald via actor-action / workflow approach — vóór keuze van architecturale stijl.

## MVP componenten

| # | Component | Taken |
|---|---|---|
| 1 | Planning & Route | Routes berekenen, ETA's, multi-stop |
| 2 | User & Auth | Identiteit, rollen, sessies, JWT |
| 3 | Trip Management | CRUD trips, uitnodigingen, versionering |
| 4 | Budget & Payment | Uitgaven tracken, split-logica, settle-up |
| 5 | Integration Layer (ACL) | Externe API-adapters, normalisatie, caching |
| 6 | Notification | Push, email, in-app, event-driven triggers |

## Supporting (optioneel toevoegen)

- Itinerary & Activity Planning
- Booking & Reservations
- Search & Discovery
- Document & Media
- Chat & Comments
- Audit & Activity Log

## Cross-cutting

- API Gateway / BFF
- Caching Layer (Redis)
- Background Jobs / Scheduler
- Reporting & Analytics
- Admin / Backoffice

## v2 / nice-to-have

Recommendation Engine, Offline Sync, AI Assistant, Social/Sharing, Carbon Footprint Tracker.

## Actor-Action tabel

TODO: per actor (user, trip-owner, admin, externe API) acties uitschrijven en mappen op component.
