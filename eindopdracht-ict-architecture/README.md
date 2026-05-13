# Eindopdracht ICT Architecture

AP Hogeschool — 2e jaar Toegepaste Informatica.

App-case: planning en delen van reizen met vrienden (budget, activiteiten, integraties met reisbureaus/hotels).

## Structuur

- `docs/characteristics.md` — 7 quality attributes + motivatie
- `docs/logical-components.md` — logische componenten (actor-action)
- `docs/adr/` — ADR's (MADR-formaat)
- `docs/c4/diagrams.dsl` — Structurizr DSL (Context, Container, Deployment)
- `poc/` — 5 deploybare POC's
  - `poc-template/` — kopieerbaar template voor teamleden
  - `poc-1/` — JWT horizontal scaling (uitgewerkt voorbeeld)
  - `poc-2/` t/m `poc-5/` — leeg, per teamlid in te vullen

## Deployment testcluster

Docker Swarm: 3 managers + 2 workers.

Elke POC deploybaar via:

```bash
docker stack deploy -f poc.yaml poc
```

## Team

TODO — namen + ADR/POC-eigenaarschap.
