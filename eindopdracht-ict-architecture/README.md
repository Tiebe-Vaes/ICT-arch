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
  - `poc-5/` — nog in te vullen

## POC's draaien

Elke POC heeft een eigen `README.md` met run-instructies. De meeste POC's draaien op Docker Swarm:

```bash
docker stack deploy -f poc.yaml poc
```

Uitzondering: POC 3 draait via Docker Compose (`docker compose up`).

## Team

TODO — namen + ADR/POC-eigenaarschap.
