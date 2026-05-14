# ICT Architecture - Eindopdracht Team 5

AP Hogeschool, 2e jaar Toegepaste Informatica.

Case: reisplannings-app met groepsbudget en externe integraties (kaart-, weer-, valuta-API).

## Folder-structuur

```
ICT arch/
├── README.md                            (dit bestand - lokaal, niet in repo)
├── project-context.md                   (lokale notities Tiebe, niet delen)
└── eindopdracht-ict-architecture/       (de eigenlijke repo - dit pushen we)
    ├── README.md                        (publieke README)
    ├── docs/
    │   ├── characteristics.md           (7 karakteristieken - KLAAR)
    │   ├── logical-components.md        (skelet - TODO actor-action tabel)
    │   ├── adr/                         (7 ADR's - ADR-001 work in progress, rest skelet)
    │   └── c4/                          (Structurizr DSL - skelet)
    └── poc/
        ├── poc-template/                (kopieer dit als je een POC start)
        ├── poc-1/                       (JWT scaling - in progress, Tiebe)
        ├── poc-2/                       (leeg)
        ├── poc-3/                       (leeg)
        ├── poc-4/                       (leeg)
        └── poc-5/                       (leeg)
```

## Werkverdeling (5 POC's, 5 mensen)

| POC | Onderwerp | Linkt naar ADR |
|---|---|---|
| 1 | OAuth login (fase 1) + JWT scaling (fase 2) - GitHub provider | ADR-003 auth, ADR-006 deployment |
| 2 | Caching van reis- en hoteldata | ADR-005 performance, ADR-007 external integrations
| 3 | 
| 4 | 
| 5 | 

Wijs jezelf toe aan een POC. Werk in `poc/poc-N/` op basis van `poc-template/`.

## Status

### Klaar
- 7 karakteristieken (`docs/characteristics.md`) -> best nog finetunen
- ADR-001 architectuurstijl work-in-progress (modulaire monoliet gekozen, stijlen-overweging nog niet 100% af)
- Skelet C4 model (`docs/c4/diagrams.dsl`)
- POC-template + POC 1 README & poc.yaml (OAuth/GitHub gekozen, fase 1 in progress)


### Nog te doen
- ADR-002 t/m ADR-006 volledig uitwerken (drivers + opties + trade-offs + consequenties)
- `docs/logical-components.md` actor-action tabel invullen
- C4 maken en renderen naar `docs/c4/exports/`
- POC 1 t/m 5 volledig bouwen (Dockerfile, app, poc.yaml, README)


## Conventies (belangrijk)

- **Geen emoji's, geen pijl-symbolen.** Tekst alleen. Geldt voor alle docs en code-comments.
- **Documenten in het Nederlands.** Code-comments mogen Engels.
- **Geen secrets in git.** Gebruik Docker Swarm secrets of `.env` (in `.gitignore`).
- **ADR's volgen MADR-template** (`docs/adr/template.md`).
- **Elke POC heeft**: `app/` met code, `Dockerfile`, `poc.yaml` (Swarm stack), `README.md` met hypothese + demo-stappen.

## Stack

- Backend: Node.js + Express (POC 1), rest TBD per POC
- Auth: GitHub OAuth 2.0 (POC 1)
- DB: PostgreSQL
- Cache: Redis
- Messaging: RabbitMQ
- Deployment: Docker Swarm (3 managers + 2 workers)
- Ingress: Traefik
- Frontend: React + React Native (monorepo) - skelet in ADR-006

## Lokaal opzetten

```bash
git clone <repo-url>
cd eindopdracht-ict-architecture
# kies een POC
cd poc/poc-1
docker stack deploy -c poc.yaml poc1
```

Zie per-POC `README.md` voor exacte demo-stappen.


