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

Elke POC heeft een eigen `README.md` met volledige run-instructies. Raadpleeg die voor de exacte stappen — de meeste POC's vereisen meerdere commando's.

**Algemeen patroon (POC 2, 4, 5):** images bouwen vóór deployment, dan deployen:

```bash
docker build -t <image-naam> ./<service-folder>
docker stack deploy -c poc.yaml poc
```

**POC 1** vereist ook eerst een `.env`-bestand op basis van `.env.example` (GitHub OAuth credentials).

**POC 3** gebruikt een andere stackfile-naam én vereist een eigen image build:

```bash
docker build -t poc3-rabbitmq-app:latest ./app
docker stack deploy -c docker-stack.yml poc3
```

Docker Swarm bouwt geen images automatisch — `docker build` is altijd een aparte stap.

## Team

| Naam | ADR | POC |
|---|---|---|
| Jamyang Tenzin| ADR-002 (Caching) | POC 2 (Redis) |
| Tiebe Vaes| ADR-003 (Authenticatie) | POC 1 (OAuth + JWT) |
| Talia Journée| ADR-005 (Messaging) | POC 3 (RabbitMQ) |
| Neta Kiala | ADR-004 (Database) | POC 4 (PostgreSQL locking) |
| Hoyin Man| ADR-006 (Externe integratie) | POC 5 (Adapter + circuit breaker) |

ADR-001 (architecturale stijl) is gezamenlijk.
