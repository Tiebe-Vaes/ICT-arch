# Eindopdracht ICT Architecture

AP Hogeschool — 2e jaar Toegepaste Informatica.

App-case: planning en delen van reizen met vrienden (budget, activiteiten, integraties met reisbureaus/hotels).

## Structuur

- `docs/characteristics.md` — 7 quality attributes + motivatie
- `docs/logical-components.md` — logische componenten (actor-action)
- `docs/adr/` — ADR's (MADR-formaat)
- `docs/c4_diagrammen/structure.dsl` — Structurizr DSL (Context, Container, Deployment)
- `poc/` — deploybare POC's
  - `poc-template/` — kopieerbaar template voor teamleden
  - `poc-1/` — OAuth login + eigen JWT (GitHub provider)
  - `poc-2/` — Redis caching van reisgegevens
  - `poc-3/` — RabbitMQ messaging binnen modulaire monoliet
  - `poc-4/` — PostgreSQL concurrent budget updates (locking)
  - `poc-5/` — External Integration: adapter + circuit breaker (mock hotel API)

## POC's draaien

Elke POC heeft een eigen `README.md` met run-instructies. Alle POC's draaien op Docker Swarm. Standaard:

```bash
docker stack deploy -c poc.yaml poc
```

Uitzondering: POC 3 gebruikt een eigen stackfile-naam:

```bash
docker stack deploy -c docker-stack.yml poc3
```

## Team

| Naam | ADR | POC |
|---|---|---|
| Tiebe Vaes | ADR-002 (Caching) | POC 2 (Redis) |
| Hoyin Man | ADR-003 (Authenticatie) | POC 1 (OAuth + JWT) |
| Jamyang Tenzin | ADR-005 (Messaging) | POC 3 (RabbitMQ) |
| Neta Kiala | ADR-004 (Database) | POC 4 (PostgreSQL locking) |
| Talia Journée | ADR-006 (Externe integratie) | POC 5 (Adapter + circuit breaker) |

ADR-001 (architecturale stijl) is gezamenlijk.
