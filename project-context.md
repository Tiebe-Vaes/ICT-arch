# TravelTogether — ICT Architecture Project Context

> Volledige context-dump voor nieuwe Claude project. Bevat opdracht, beslissingen, alternatieven, deliverables.

---

## 1. Vak & Context

- **Vak:** ICT Architecture
- **School:** AP Hogeschool Antwerpen — toegepaste informatica, 2e jaar
- **Default groepscijfer bij correcte uitvoering zonder extra's:** 16/20
- **Aanname:** afgestudeerde versie van team moet dit in **6 maanden productieklaar** maken
- **Verdediging:** elk groepslid moet **hele document + alle POC's** kunnen verdedigen
- **Indienformaat:** CommonMark Markdown, afbeeldingen via relatieve paden

---

## 2. Klantvraag

> Applicatie voor het plannen en delen van reizen met vrienden, inclusief budgetbeheer en activiteitenplanning, met integratie van extra diensten van reisbureaus en hotels.
>
> Vergelijkbare voorbeelden: **TripIt**, **Roadtrippers**.

Werknaam intern: **TravelTogether**.

### Concurrent-analyse (uit eerdere chat)
- **TripIt** = sterk op Availability + Interoperability (mail/cal sync, multi-device)
- **Roadtrippers** = sterk op Usability + auto-routing
- Gat in markt: echt budgetbeheer en groepssamenwerking met gedeeld budget. Dit is de differentiator.

---

## 3. Opdracht — gevraagde deliverables

1. **Karakteristieken** — top 7, met motivatie per stuk
2. **Logische componenten** — via actor-action en/of workflow approach (NIET services, bepaald vóór stijl-keuze)
3. **ADR architecturale stijl** — alle in les behandelde stijlen overwegen, 2e keuze expliciet
4. **Extra ADR's** — aantal = aantal groepsleden, voor belangrijkste verdere beslissingen
5. **C4 diagrammen** via Structurizr — Context, Container, Deployment — broncode in markdown code block
6. **POC's** — aantal = aantal groepsleden, deploybaar via `docker stack deploy -f poc.yaml poc`
   - Testcluster: **3 managers + 2 workers**
   - Per POC een eigen directory + `README.md`
   - Klein houden, geen volledige app, geen ruis (no full frontends/configs)
7. **Extra's** (optioneel) — in subsectie "uitbreiding" met goede bron (geen LLM-chats, geen Medium bullet-lists)

---

## 4. Beslist: 7 Karakteristieken

| # | Karakteristiek | Waarom |
|---|---|---|
| 1 | Availability | 24/7 toegang, verschillende tijdzones, tijdens reis zelf |
| 2 | Confidentiality | Persoonsgegevens, reisdata, betalingen, encryptie en access control |
| 3 | Interoperability | Veel externe API's (hotels, vluchten, Airbnb) met verschillende protocollen |
| 4 | Fault Tolerance | Externe API down, rest van app blijft werken |
| 5 | Latency | Mobile UX, zoekopdrachten moeten snel zijn |
| 6 | Data Consistency | Collaboratief bewerken van trip en budget, conflicten correct afhandelen |
| 7 | Scalability | Vakantiepieken, horizontale schaalbaarheid en load balancing |

Eerder overwogen maar uit top 7 gehaald: Usability en Portability. Vervangen door Data Consistency en Scalability omdat die directere architecturale impact hebben.

---

## 5. Beslist: Architecturale Stijl

**Gekozen: Modulaire Monoliet**
**2e keuze: Microservices / Event-Driven**

### Modulaire Monoliet, pro/con
Pro:
- Lage operationele complexiteit, makkelijk monitoren/debuggen
- Snelle Time-to-Market voor klein team
- Geen netwerk-latency tussen modules
- Eenvoudige ACID-transacties

Con:
- Schaalbaarheid alleen voor hele app
- Vaste tech-stack
- Risico op spaghetti als grenzen niet bewaakt worden

### Microservices, pro/con (waarom 2e keuze)
Pro:
- Per-component schalen (alleen Search opschalen)
- Tech-vrijheid per service
- Sterke fout-isolatie

Con:
- Hoge operationele overhead (service discovery, tracing)
- Eventual consistency
- Network overhead/latency
- Te complex voor team van 5 in 6 maanden

### Andere stijlen om te vermelden in ADR (uit les)
monoliet · layered · microservices · event-driven · space-based · microkernel · SOA · pipeline · serverless

### Reflectie team/budget (verplicht volgens prof)
- **Groter team + budget:** vanaf dag 1 microservices, service mesh, multi-region, Kafka, dedicated security team
- **Kleiner team + budget:** monoliet zonder modulaire ambities, één VPS, geen event-bus

---

## 6. Beslist: Logische Componenten (van klant-opdracht — must-have)

| # | Component | Taken |
|---|---|---|
| 1 | **Planning & Route** | Routes berekenen, ETA's, multi-stop |
| 2 | **User & Auth** | Identiteit, rollen, sessies, JWT |
| 3 | **Trip Management** | CRUD trips, uitnodigingen, versionering |
| 4 | **Budget & Payment** | Uitgaven tracken, split-logica, settle-up |
| 5 | **Integration Layer (ACL)** | Externe API-adapters, normalisatie, caching |
| 6 | **Notification** | Push, email, in-app, event-driven triggers |

### Brainstorm extra componenten (uit eerdere chat — optioneel toevoegen)

**Aanbevolen (supporting):**
- Itinerary & Activity Planning (dag-per-dag, voting, conflict-detectie)
- Booking & Reservations (hotels/vluchten tracken, voucher-storage)
- Search & Discovery (zoeken + filters via integration layer)
- Document & Media (boarding passes, foto's, S3-compatible)
- Chat & Comments (groep-chat per trip, @mentions)
- Audit & Activity Log (wie wijzigde wat — voor disputes/compliance)

**Cross-cutting:**
- API Gateway / BFF
- Caching Layer (Redis)
- Background Jobs / Scheduler
- Reporting & Analytics
- Admin / Backoffice

**v2 / nice-to-have:**
- Recommendation Engine, Offline Sync, AI Assistant, Social/Sharing, Carbon Footprint Tracker

> **MVP scope advies (5 personen, 6 maanden):** componenten 1–6 + API Gateway + Background Jobs. Rest = stretch of v2.

---

## 7. Beslist: Technische Implementatie

| Laag | Keuze |
|---|---|
| **Infrastructuur** | Docker Swarm: 3 managers + 2 workers |
| **Database** | PostgreSQL (gestructureerd) |
| **Caching** | Redis (zoekresultaten) |
| **Messaging** | RabbitMQ of Kafka (async, indien nodig) |

---

## 8. POC's — 5 simpele opties (te kiezen)

Lichte versies, elk 1–3 containers, op te zetten in een namiddag.

| # | Naam | Beantwoordt vraag | Stack | Quality attr |
|---|---|---|---|---|
| 1 | **Horizontale scaling met JWT** | Schaalt auth? | 1 service (3 replicas) + ingress | Availability, Portability |
| 2 | **Redis cache voor externe API** | Versnellen we trage calls? | 1 app + Redis | Latency, Fault Tolerance |
| 3 | **RabbitMQ pub/sub** | Werkt async messaging? | Publisher + RabbitMQ + Consumer | Fault Tolerance |
| 4 | **PostgreSQL + healthcheck/restart** | Overleeft data crash? | 1 app + Postgres + volume | Availability (data) |
| 5 | **Reverse proxy + 2 services** | Hoe routet alles via 1 ingress? | Traefik + 2 dummy backends | Interoperability |

### Demo-format per POC
- `curl` commando's tonen voor/na gedrag
- `docker service logs` om gedrag aan te tonen
- README.md per POC met run-instructies

### Backup: zwaardere POC-opties (eerder voorgesteld, eventueel terug naar grijpen)
1. Anti-Corruption Layer + circuit breaker (Resilience4j/Polly + fake APIs)
2. Saga / optimistic locking voor concurrent expenses
3. Spring Modulith / ArchUnit voor module-boundary tests
4. JWT + stateless replicas met Traefik ingress
5. Event-driven notify met RabbitMQ persistence

---

## 9. ADR Template (gebruikt)

Gebaseerd op MADR (https://github.com/adr/madr).

```markdown
# ADR-XXX — <titel>

## Status
Proposed / Accepted / Deprecated

## Context and Problem Statement
- Project
- Functionele requirements
- Niet-functionele requirements (de 7 karakteristieken)
- Constraints (team, tijd, budget)
- Probleem

## Decision Drivers
Gerangschikt naar gewicht.

## Considered Options
Alle stijlen uit de les vermelden.

## Decision Outcome
Gekozen optie + korte uitleg.

## Pros and Cons of the Options
Per optie pro/con.

## Consequences
Positief + negatief.

## Implementation Notes
Tech stack, structuur, deployment, patterns.

## Related Decisions
Links naar andere ADR's.

## Validation
Metrics, teststrategie, evaluatiemoment.
```

### Verdere ADR's (per groepslid één)
Suggesties:
- ADR-002: Database keuze (PostgreSQL + Redis)
- ADR-003: Authenticatie/autorisatie (OAuth2/OIDC + JWT)
- ADR-004: Externe API-integratie strategie (ACL + circuit breaker)
- ADR-005: Messaging keuze (RabbitMQ vs Kafka vs in-process)
- ADR-006: Deployment platform (Docker Swarm — gegeven, dus motiveren)
- ADR-007: Frontend strategie (web + mobile — React Native vs aparte stack)

---

## 10. C4 Diagrammen — Wat per niveau

Te bouwen in **Structurizr** (DSL in markdown code block).

| Niveau | Toon |
|---|---|
| **Context** | TravelTogether als blackbox + actors (user, admin) + externe systems (Booking.com, Skyscanner, payment provider, email/push providers) |
| **Container** | Modulaire monoliet als één container + Postgres + Redis + (RabbitMQ) + reverse proxy + mobile/web clients |
| **Deployment** | Docker Swarm: 3 managers + 2 workers, waar draait wat, volumes, networks |

---

## 11. Communicatie & Tonen

- Studenten-tone, mix Dutch/English (vooral Dutch voor docs)
- ADR's in Nederlands (assignment is NL)
- Caveman-mode default in chat met Claude
- Doc-output normaal Nederlands proza
- Geen LLM-chats als bron in document

---

## 12. Volgende stappen

- [ ] Karakteristieken finaliseren (7 — Usability vs Data Consistency overwegen)
- [ ] Component-tabel afkloppen (MVP scope vastleggen)
- [ ] ADR-001 herschrijven met Modulaire Monoliet als keuze (eerdere versie had microservices als keuze, omdraaien)
- [ ] Verdere ADR's verdelen onder groepsleden
- [ ] POC's verdelen — kies 5 simpele
- [ ] Structurizr setup + 3 C4 diagrammen
- [ ] Verdediging-prep: elk lid moet alles kunnen verdedigen
