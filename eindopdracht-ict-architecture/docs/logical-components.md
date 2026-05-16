# Logische Componenten

Bepaald via actor-action / workflow approach — vóór keuze van architecturale stijl.

## Actoren

| Actor | Rol |
|---|---|
| Traveler | Eindgebruiker die deelneemt aan een trip |
| Trip-owner | Traveler die de trip aanmaakt en beheert |
| Admin | Beheerder van het platform |
| Externe provider | Hotel-, vlucht- of payment-API (passieve actor) |
| Background scheduler | Tijdgestuurde trigger (passieve actor) |

## Actor-Action tabel

| Actor | Actie | Component(en) |
|---|---|---|
| Traveler | Registreren / inloggen via externe provider | User & Auth |
| Traveler | Eigen profiel beheren | User & Auth |
| Trip-owner | Trip aanmaken, bewerken, verwijderen | Trip Management |
| Trip-owner | Vrienden uitnodigen voor trip | Trip Management → Notification |
| Traveler | Uitnodiging accepteren of weigeren | Trip Management |
| Traveler | Activiteit toevoegen aan trip | Trip Management, Planning & Route |
| Traveler | Route plannen tussen bestemmingen | Planning & Route, Integration Layer |
| Traveler | Hotels en vluchten zoeken | Integration Layer (externe API's) |
| Traveler | Boeking importeren | Integration Layer, Trip Management |
| Traveler | Uitgave registreren | Budget & Payment |
| Traveler | Budget splitsen tussen deelnemers | Budget & Payment |
| Traveler | Settle-up bekijken en bevestigen | Budget & Payment |
| Traveler | Notificaties ontvangen (push, email, in-app) | Notification |
| Externe provider | Beschikbaarheid en prijzen leveren | Integration Layer |
| Externe provider | Boeking bevestigen | Integration Layer |
| Background scheduler | Herinneringen versturen (vertrek nadert) | Notification, Trip Management |
| Background scheduler | Externe data herverversen (cache) | Integration Layer |
| Admin | Gebruikers en trips modereren | User & Auth, Trip Management |
| Admin | Audit logs raadplegen | Audit & Activity Log |

## Componenten en taken

| # | Component | Verantwoordelijkheid |
|---|---|---|
| 1 | User & Auth | Identiteit, registratie, login via externe OAuth-provider, JWT-uitgifte, rollen, sessies |
| 2 | Trip Management | CRUD trips, deelnemers, uitnodigingen, versiebeheer van het reisplan |
| 3 | Planning & Route | Activiteiten plannen, routes berekenen, ETA's, multi-stop ordering |
| 4 | Budget & Payment | Uitgaven registreren, split-logica, settle-up berekening, transacties |
| 5 | Integration Layer (Anti-Corruption Layer) | Adapters naar externe API's (hotels, vluchten, payments), normalisatie, caching, retry |
| 6 | Notification | Push, email, in-app notificaties; event-driven triggers |
| 7 | Audit & Activity Log | Centraal vastleggen van wijzigingen en gevoelige acties |

## Cross-cutting concerns

- API Gateway / BFF — entry point, routing, auth-validatie
- Caching Layer (Redis) — hot data versnellen, externe responses bufferen
- Background Jobs / Scheduler — periodieke triggers, outbox-publisher
- Reporting & Analytics — afgeleide statistieken
- Admin / Backoffice — moderatie-tooling

## v2 / nice-to-have

Recommendation Engine, Offline Sync, AI Assistant, Social/Sharing, Carbon Footprint Tracker.

## Opmerking

Deze componenten zijn logisch, niet fysiek. Mapping naar deploybare units (modules in een modulaire monoliet, of services bij microservices) gebeurt in ADR-001 en volgende.
