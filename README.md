# Travel Planning Platform — ICT Architecture

> A software architecture case study: designing the backend for a platform where friends plan and share trips together — with shared budgets, activity voting, and integrations to external travel providers.

Built for the **ICT Architecture** course (AP Hogeschool, 2nd year Applied Computer Science) by a team of five. The work covers the full architecture flow: quality attributes, logical decomposition, an architecture-style decision, supporting ADRs, C4 models, and five deployable proofs of concept that each validate one architectural decision.

> The course documentation is written in Dutch; this page is an English overview. The full project lives in [`eindopdracht-ict-architecture/`](eindopdracht-ict-architecture/).

---

## At a glance

- **Domain:** group travel planning — shared budgets, activity planning, external hotel/flight/payment integrations.
- **Chosen style:** modular monolith (Node.js) — ACID transactions for shared budgets, with package boundaries that keep a path open to microservices. See [ADR-001](eindopdracht-ict-architecture/docs/adr/ADR-001-architecture-style.md).
- **Deliverables:** 7 quality attributes, an actor-action component model, 6 ADRs (MADR format), a C4 model in Structurizr DSL, and 5 runnable POCs.
- **Infrastructure:** Docker Swarm (3 managers + 2 workers), Traefik ingress, PostgreSQL, Redis, RabbitMQ.

**Stack:** Node.js · Express · PostgreSQL · Redis · RabbitMQ · Docker Swarm · Traefik · React · Structurizr

---

## Architecture

Modelled with the [C4 model](https://c4model.com/) using Structurizr DSL. Full source: [`structure.dsl`](eindopdracht-ict-architecture/docs/c4_diagrammen/structure.dsl).

| System Context | Containers | Deployment |
|---|---|---|
| ![System Context](eindopdracht-ict-architecture/docs/images/c4-context.png) | ![Containers](eindopdracht-ict-architecture/docs/images/c4-containers.png) | ![Deployment](eindopdracht-ict-architecture/docs/images/c4-deployment.png) |

The backend is one deployable unit composed of bounded modules (Auth, Trip, Planning, Budget, Integration, Notification, Audit). A background worker shares the same image but a different entrypoint, consuming domain events from RabbitMQ.

---

## Architecture Decision Records

All decisions follow the [MADR](https://adr.github.io/madr/) format. Each supporting ADR is validated by a matching POC.

| ADR | Topic | POC |
|---|---|---|
| [ADR-001](eindopdracht-ict-architecture/docs/adr/ADR-001-architecture-style.md) | Architecture style — modular monolith | — (team) |
| [ADR-002](eindopdracht-ict-architecture/docs/adr/ADR-002-caching.md) | Caching of external travel data (Redis) | POC 2 |
| [ADR-003](eindopdracht-ict-architecture/docs/adr/ADR-003-authentication.md) | Authentication (OAuth2 + own JWT) | POC 1 |
| [ADR-004](eindopdracht-ict-architecture/docs/adr/ADR-004-database.md) | Database & concurrency strategy (PostgreSQL) | POC 4 |
| [ADR-005](eindopdracht-ict-architecture/docs/adr/ADR-005-messaging-system.md) | Messaging inside a modular monolith (RabbitMQ) | POC 3 |
| [ADR-006](eindopdracht-ict-architecture/docs/adr/ADR-006-externe-integratie.md) | External integration (adapter + circuit breaker) | POC 5 |

---

## Proofs of Concept

Five deployable POCs, each isolating one architectural decision and the quality attribute it serves. Every POC has its own README with hypothesis and demo steps.

| POC | Demonstrates | Quality attribute(s) |
|---|---|---|
| [POC 1](eindopdracht-ict-architecture/poc/poc-1/) | OAuth login (GitHub) with server-side code exchange and an app-issued JWT — no passwords stored | Confidentiality |
| [POC 2](eindopdracht-ict-architecture/poc/poc-2/) | Redis caching in front of a slow external travel API | Performance, Availability, Resilience |
| [POC 3](eindopdracht-ict-architecture/poc/poc-3/) | RabbitMQ for async side effects (notifications, audit) with retry + dead-letter queue | Fault Tolerance, Loose Coupling, Scalability |
| [POC 4](eindopdracht-ict-architecture/poc/poc-4/) | Concurrent budget updates protected by `SELECT ... FOR UPDATE` to prevent lost updates | Data Consistency, Fault Tolerance |
| [POC 5](eindopdracht-ict-architecture/poc/poc-5/) | Integration layer with the adapter pattern + circuit breaker against a mock hotel API | Interoperability, Fault Tolerance |

All POCs deploy to Docker Swarm. The common pattern (build the image, then deploy) is:

```bash
docker build -t <image-name> ./<service-folder>
docker stack deploy -c poc.yaml poc
```

Docker Swarm does not build images automatically — `docker build` is always a separate step. POC 1 also needs a `.env` (GitHub OAuth credentials, from `.env.example`); POC 3 uses `docker-stack.yml`. See each POC's README for exact steps.

---

## Repository layout

```
eindopdracht-ict-architecture/
├── docs/
│   ├── characteristics.md        7 quality attributes + rationale
│   ├── logical-components.md     actor-action component model
│   ├── adr/                      ADR-001 .. ADR-006 (MADR)
│   ├── c4_diagrammen/            Structurizr DSL source
│   └── images/                   rendered C4 views
├── poc/
│   ├── poc-1 .. poc-5/           one deployable POC per decision
│   └── poc-template/             starter template
└── README.md                     full project README (Dutch)
```

---

## Team

| Member | ADR | POC |
|---|---|---|
| Jamyang Tenzin | ADR-002 (Caching) | POC 2 (Redis) |
| Tiebe Vaes | ADR-003 (Authentication) | POC 1 (OAuth + JWT) |
| Talia Journée | ADR-005 (Messaging) | POC 3 (RabbitMQ) |
| Neta Kiala | ADR-004 (Database) | POC 4 (PostgreSQL locking) |
| Hoyin Man | ADR-006 (External integration) | POC 5 (Adapter + circuit breaker) |

ADR-001 (architecture style) was decided jointly.
