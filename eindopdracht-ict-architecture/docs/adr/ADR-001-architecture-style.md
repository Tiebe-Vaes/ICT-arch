# ADR-001 — Keuze van architecturale stijl

Formaat: [MADR 3.0](https://adr.github.io/madr/). Lokale template: [`template.md`](template.md).

## Status

Accepted

## Context

De applicatie is een platform om reizen te plannen en te delen met vrienden, met gedeeld budgetbeheer, activiteitenplanning en integraties met externe diensten zoals hotels, vluchten en payment providers. Het team telt vijf personen en heeft zes maanden om een productieklare versie op te leveren. De testcluster is een Docker Swarm met drie managers en twee workers, het budget voor managed services is beperkt.

De vraag is simpel: welke architecturale stijl past het beste bij deze combinatie van functionele scope, de zeven karakteristieken uit hoofdstuk 1 en de constraints van het team?

## Wat de keuze stuurt

De zwaarste driver is **Data Consistency**: gedeeld budget tussen vrienden mag geen ruimte laten voor verloren updates of onduidelijke saldo's. Daarna komen **time-to-market** (zes maanden, vijf mensen) en **beheersbare operationele complexiteit** (geen dedicated DevOps). Daaronder volgen Scalability voor vakantiepieken, Fault Tolerance bij externe API's, en een redelijk migratiepad voor het geval de applicatie later toch fijnmaziger moet.

## Overwogen opties

Alle stijlen uit de cursus zijn beoordeeld:

1. Klassieke monoliet
2. Layered
3. Modulaire monoliet
4. Microservices
5. Event-driven architecture
6. Space-based
7. Microkernel (plug-in)
8. SOA
9. Pipeline (pipes and filters)
10. Serverless (FaaS)

## Beslissing

We kiezen voor een **modulaire monoliet**. Tweede keuze is **microservices met event-driven communicatie**.

Een modulaire monoliet geeft de eenvoud van een monoliet — één database, één deploybare unit, ACID out-of-the-box — terwijl strikte module-grenzen later toelaten om delen af te splitsen. Voor een team van vijf binnen zes maanden is dat het laagste-risico-pad. Microservices sluiten conceptueel beter aan bij Scalability en Fault Tolerance, maar de operationele overhead (service mesh, distributed tracing, saga's voor budget-consistency, deployment-orchestratie) overbelast deze teamgrootte binnen dit tijdsbestek. Bij een groter team of meer runway zou microservices de eerste keuze zijn.

## Analyse per stijl

### Klassieke monoliet

Eenvoudig te deployen en te debuggen, één codebase. Maar zonder interne grenzen glijdt zo'n project bij deze omvang snel af naar een ongestructureerde codebase, zonder voorbereiding op opsplitsing. Verworpen wegens te weinig discipline op lange termijn.

### Layered

De klassieke scheiding tussen presentation, business en data is bekend bij iedereen, maar lost het grens-probleem tussen domeinen niet op: features snijden verticaal door alle lagen heen en koppeling tussen domeinen blijft. Niet geschikt als hoofdstijl, wel bruikbaar als interne structuur binnen modules.

### Modulaire monoliet (gekozen)

Behoudt de operationele eenvoud van een monoliet maar voegt expliciete module-grenzen toe. ACID-transacties binnen één database lossen het kernprobleem op (budget-splits), geen netwerklatency tussen modules, snelle ontwikkelcyclus. De prijs: heel de app schaalt mee bij piek in één module, één falende module kan alles meeslepen, en de grenzen moeten actief bewaakt worden — anders zakt het terug naar een klassieke monoliet.

### Microservices (tweede keuze)

Per-service schalen, fout-isolatie, technologische vrijheid, onafhankelijke deployments. Op papier de beste fit voor Scalability en Fault Tolerance. In de praktijk vergt het discovery, tracing, monitoring, een gateway, secret-management en saga's voor cross-service consistency. Voor budget-splits over services moet je expliciet patronen als Saga of Outbox introduceren — foutgevoelig en operationeel zwaar. Te veel voor vijf mensen in zes maanden.

### Event-driven

Maximale ontkoppeling en goede pasvorm voor notificaties en integraties, maar volledig event-gedreven kernlogica maakt budget-consistency erg lastig en monitoring complex. We zetten event-driven wél gericht in voor asynchrone side effects via RabbitMQ (zie ADR-005), maar niet als hoofdstijl.

### Space-based

Ontworpen voor extreme concurrent loads zonder centrale database als bottleneck, met een data-grid. Voor onze verwachte load is dat overkill, en de complexiteit van cache-coherence rechtvaardigt de keuze niet.

### Microkernel (plug-in)

Past bij productlijnen met variabele uitbreidingen rond een stabiele kern. Onze externe integraties zijn beter gediend met een Anti-Corruption Layer (zie ADR-004) dan met een plug-in-model. Verworpen: de kern van de app is geen producthost.

### SOA

Onafhankelijke services rond business-capabilities, vaak gekoppeld aan een enterprise service bus. In de praktijk is dit grotendeels overgenomen en verfijnd door microservices, met betere moderne tooling. Verworpen als zwaardere variant van microservices.

### Pipeline (pipes and filters)

Sterk voor sequentiële datatransformaties, maar de domeinlogica hier is interactief en transactioneel, geen verwerkingspijplijn. Niet passend.

### Serverless (FaaS)

Geen infrastructuurbeheer en automatische scaling klinken aantrekkelijk, maar de opgelegde Docker Swarm-deployment maakt FaaS irrelevant, naast cold starts en vendor-lock-in.

## Gevolgen

Aan de positieve kant: een werkend product binnen zes maanden, lage infrastructuurkost, ACID-transacties die budget-splits beschermen, en een duidelijk migratiepad — modules kunnen later afgesplitst worden naar services indien nodig.

Aan de negatieve kant: bij forse groei moet er gemigreerd worden naar microservices, wat geen gratis stap is. De hele app schaalt mee, ook als enkel zoek piek heeft. En zonder discipline (boundary-tests in CI) glijdt de codebase af naar een big ball of mud.

## Implementatie

Eén deploybare backend in Node.js met expliciete modules: User & Auth, Trip, Budget, Planning, Integration (ACL), Notification, Audit. Module-boundary-tests in CI. PostgreSQL als primaire opslag (ADR-004), Redis als cache (ADR-002), RabbitMQ voor asynchrone side effects (ADR-005). Anti-Corruption Layer per externe partner. Deployment op Docker Swarm met Traefik als ingress.

## Reflectie op team en budget

Met een groter team en groter budget zou de keuze van bij dag één microservices zijn, met service mesh, multi-region en Kafka als event-backbone. Met een kleiner team en kleiner budget zou het een niet-modulaire monoliet op één VPS worden, zonder event-bus en zonder cache, omdat zelfs modulaire discipline dan een te hoge prijs heeft.

## Gerelateerd

- [ADR-002](ADR-002-caching.md) — Caching
- [ADR-003](ADR-003-authentication.md) — Authenticatie
- [ADR-004](ADR-004-database.md) — Database
- [ADR-005](ADR-005-messaging-system.md) — Messaging
- [ADR-006](ADR-006-externe-integratie.md) — Externe integratie

## Validatie

We hertoetsen deze beslissing op het einde van de eerste productie-iteratie. Concreet bekijken we of de module-boundary-tests blijven slagen, of de deploy-tijd onder vijf minuten blijft, of de p95 latency van kritieke endpoints onder driehonderd milliseconde zit, en of er na drie maanden geen circulaire afhankelijkheden tussen modules zijn ontstaan. Indien een module structureel piek-load veroorzaakt of een eigen schaalprofiel nodig heeft, bekijken we afsplitsing naar een service.

## Referenties

- Su, R., & Li, X. (2024). _Modular Monolith: Is This the Trend in Software Architecture?_ In _Proc. 1st Int. Workshop on New Trends in Software Architecture (NTSA)_, ACM. https://dl.acm.org/doi/10.1145/3643657.3643911 — grijze-literatuur review van 64 studies; bevestigt dat modulaire monoliet voordelen van monoliet en microservices combineert en een migratiepad biedt.
- _Modular Monolith Architecture in Cloud Environments: A Systematic Literature Review_ (2025). _Future Internet_, 17(11), 496. MDPI. https://www.mdpi.com/1999-5903/17/11/496 — SLR identificeert adoption drivers (vereenvoudigde deployment, maintainability, lagere orchestration-overhead) die overeenkomen met onze drivers.
- Blinowski, G., Ojdowska, A., & Przybyłek, A. (2022). _Monolithic vs. Microservice Architecture: A Performance and Scalability Evaluation._ _IEEE Access_. https://ieeexplore.ieee.org/document/9717259/ — empirische meting: monoliet ~6% hogere throughput onder concurrency, geen significant verschil in load. Onderbouwt dat microservices voor onze verwachte load geen performance-winst opleveren.
- Fritzsch, J., Schmid, T., & Wagner, S. (2019). _Microservices Migration in Industry: Intentions, Strategies, and Challenges._ IEEE ICSME. https://arxiv.org/pdf/1906.04702 — interview-studie: gebrek aan microservices-expertise wordt even vaak genoemd als decompositie-uitdagingen, wat past bij ons team van 5 zonder dedicated DevOps.
- Capuano, F., & Muccini, H. (2022). _A Systematic Literature Review on Migration to Microservices: a Quality Attributes perspective._ IEEE/ACM ICSA-C. https://ieeexplore.ieee.org/document/9779831/ — documenteert migratie-uitdagingen die we vermijden door modulair-monoliet-first.
- Fowler, M. (2015). _MonolithFirst._ https://martinfowler.com/bliki/MonolithFirst.html en _MicroservicePremium._ https://martinfowler.com/bliki/MicroservicePremium.html — autoriteitsbronnen voor de "monolith first"-strategie en de productiviteitskost van microservices bij kleine teams.
