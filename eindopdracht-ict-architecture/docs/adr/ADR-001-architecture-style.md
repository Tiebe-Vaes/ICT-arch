# ADR-001 — Keuze van architecturale stijl

Formaat gebaseerd op MADR (Markdown Architectural Decision Records), versie 3.0.
Referentie: https://adr.github.io/madr/

## Status

Proposed

## Context and Problem Statement

De applicatie is een platform voor het plannen en delen van reizen met vrienden, met gedeeld budgetbeheer, activiteitenplanning en integraties met externe diensten (hotels, vluchten, payment providers). Het team bestaat uit 5 personen en moet binnen 6 maanden een productieklare versie opleveren.

Welke architecturale stijl past het beste bij de combinatie van functionele scope, niet-functionele eisen en de constraints van het team?

Niet-functionele eisen (zie `docs/characteristics.md`):

1. Availability
2. Confidentiality
3. Interoperability
4. Fault Tolerance
5. Latency
6. Data Consistency
7. Scalability

Constraints:

- Team van 5, gemengde seniority
- 6 maanden tot productie
- Deploy op Docker Swarm testcluster (3 managers + 2 workers)
- Beperkt budget voor cloud-managed diensten

## Decision Drivers

Gerangschikt naar gewicht:

1. Time-to-market binnen 6 maanden met een team van 5
2. Beheersbare operationele complexiteit (geen dedicated DevOps)
3. Sterke Data Consistency voor gedeeld budget (vermijden van eventual-consistency-bugs)
4. Schaalbaarheid voor vakantiepieken
5. Fault tolerance bij uitval van externe API's
6. Migratiepad naar fijnmaziger architectuur indien later nodig

## Considered Options

Alle stijlen die in de les behandeld zijn of nog behandeld zullen worden:

1. Monoliet (klassiek, niet-modulair)
2. Layered architecture
3. Modulaire Monoliet
4. Microservices
5. Event-Driven Architecture
6. Space-Based Architecture
7. Microkernel (plug-in)
8. Service-Oriented Architecture (SOA)
9. Pipeline (pipes and filters)
10. Serverless (FaaS)

## Decision Outcome

Gekozen: Modulaire Monoliet.
Tweede keuze: Microservices met event-driven communicatie.

### Motivatie

Een modulaire monoliet geeft de operationele eenvoud van een monoliet, terwijl strikte module-grenzen (afgedwongen via package-structuur en tests zoals ArchUnit) een latere splitsing naar microservices mogelijk maken. Voor een team van 5 dat binnen 6 maanden moet leveren is dit het laagste-risico-pad: één deploybare unit, één database, ACID-transacties out-of-the-box (kritiek voor gedeeld budget), geen netwerklatency tussen modules.

Microservices zijn de tweede keuze omdat ze conceptueel beter aansluiten bij de quality attributes (per-component schalen, fout-isolatie), maar de operationele overhead (service mesh, distributed tracing, eventual consistency, deployment-orchestratie) een team van deze grootte binnen deze tijdspanne overbelast. Indien het team groter was geweest of de productionisatie-deadline ruimer, zou microservices de eerste keuze zijn.

## Pros and Cons of the Options

### 1. Monoliet (klassiek)

Pro:
- Simpelste deployment
- Eén codebase, eenvoudig debuggen

Con:
- Geen interne grenzen, leidt op termijn tot ongestructureerde codebase
- Geen voorbereiding op opsplitsing
- Verworpen: te weinig discipline voor een project van deze omvang

### 2. Layered

Pro:
- Klassieke separation of concerns (presentation, business, data)
- Bekend bij elke ontwikkelaar

Con:
- Verticale doorsneden door alle lagen bij elke feature (anemic-model risico)
- Voorkomt geen koppeling tussen domeinen
- Verworpen: lost het schaal- en grens-probleem niet op; kan wel intern in modules toegepast worden

### 3. Modulaire Monoliet (gekozen)

Pro:
- Lage operationele complexiteit, één artifact
- Strikte module-grenzen, voorbereiding op latere splitsing
- ACID-transacties binnen één database, ideaal voor budget-splits (Data Consistency)
- Geen netwerklatency tussen modules
- Snelle Time-to-Market

Con:
- Schaalbaarheid alleen voor de hele app, niet per module
- Vaste tech-stack voor alle modules
- Module-grenzen moeten actief bewaakt worden (boundary tests, code review)
- Eén falende module kan de hele app neerhalen

### 4. Microservices (tweede keuze)

Pro:
- Per-service schalen, sluit goed aan bij Scalability-driver
- Fout-isolatie (Fault Tolerance)
- Tech-vrijheid per service
- Onafhankelijke deployments per team

Con:
- Hoge operationele overhead: service discovery, tracing, monitoring, secrets, gateway
- Eventual consistency vereist saga-patterns voor budget-splits, foutgevoelig
- Network latency tussen services
- Te zwaar voor team van 5 in 6 maanden

### 5. Event-Driven

Pro:
- Sterke decoupling, schaalbaar bij hoge throughput
- Natuurlijke fit voor notificaties en async integraties

Con:
- Volledig event-gedreven kernlogica maakt budget-consistency complex
- Debug- en traceability-uitdaging
- Verworpen als hoofdstijl; wordt wel intern ingezet voor notificaties en integraties (ADR-005)

### 6. Space-Based

Pro:
- Extreme schaalbaarheid, geen centrale database als bottleneck
- Geschikt voor extreem hoge concurrent loads

Con:
- Overkill voor verwachte load
- Complexe data-grid en cache-coherence
- Verworpen: niet gerechtvaardigd door eisen

### 7. Microkernel (plug-in)

Pro:
- Goede pasvorm voor productlijnen met variabele uitbreidingen
- Stabiele kern, plug-ins voor variatie

Con:
- Onze externe integraties zijn beter af met een Anti-Corruption Layer (ADR-004) dan met een plug-in-model
- Verworpen: kern van de app is geen producthost

### 8. SOA

Pro:
- Onafhankelijke services rond business-capabilities
- Hergebruik over de organisatie

Con:
- Vaak gekoppeld aan enterprise service bus, te zwaar voor één applicatie
- In de praktijk overgenomen en verfijnd door microservices
- Verworpen: zwaardere variant van microservices zonder de moderne tooling

### 9. Pipeline (pipes and filters)

Pro:
- Geschikt voor sequentiële datatransformaties

Con:
- De domeinlogica is niet primair een transformatie-pipeline
- Verworpen: past niet bij een interactieve, transactionele applicatie

### 10. Serverless (FaaS)

Pro:
- Geen infrastructuurbeheer, automatische scaling
- Pay-per-use bij lage load

Con:
- Vendor-lock-in
- Cold starts, latency-piek bij intermitterend gebruik
- Past slecht bij de opgelegde Docker Swarm-deployment
- Verworpen: conflicteert met de constraint over deploybare stack

## Consequences

Positief:

- Snel werkend product binnen 6 maanden
- Lage infrastructuurkost en operationele last
- ACID-transacties beschermen budget-splits tegen eventual-consistency-bugs
- Migratiepad: modules kunnen later afgesplitst worden naar services indien nodig

Negatief:

- Bij forse groei moet er gemigreerd worden naar microservices, niet gratis
- Hele app schaalt mee zelfs als enkel Search piek heeft
- Module-grenzen vereisen discipline; zonder tests glijdt de codebase richting big ball of mud

## Implementation Notes

- Eén deploybare backend (bijvoorbeeld Spring Boot of .NET) met expliciete modules: User, Trip, Budget, Integration (ACL), Planning, Notification
- Module-boundary tests (ArchUnit of equivalent) in CI
- PostgreSQL als primaire opslag, Redis als cache
- RabbitMQ voor async notificaties en achtergrondtaken (zie ADR-005)
- Anti-Corruption Layer per externe partner (ADR-004)
- Deployment op Docker Swarm (ADR-006), Traefik als ingress

## Reflectie team en budget

Bij een groter team en groter budget zou de keuze van bij dag één microservices zijn, met service mesh, multi-region setup en Kafka als event-backbone.

Bij een kleiner team en kleiner budget zou de keuze een niet-modulaire monoliet op één VPS zijn, zonder event-bus en zonder cache, omdat zelfs de modulaire discipline dan een te hoge kost zou zijn.

## Related Decisions

- ADR-002 (Database)
- ADR-003 (Authenticatie)
- ADR-004 (Externe API-integratie)
- ADR-005 (Messaging)
- ADR-006 (Deployment)
- ADR-007 (Frontend)

## Validation

- Module-boundary tests slagen in CI
- Deploy-tijd van een nieuwe versie blijft onder 5 minuten
- p95 latency van kritieke endpoints onder 300 ms
- Geen circulaire afhankelijkheden tussen modules na 3 maanden
- Heroverweging op het einde van de eerste productie-iteratie: blijft modulaire monoliet houdbaar, of is afsplitsing nodig?

