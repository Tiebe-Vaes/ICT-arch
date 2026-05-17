# ADR-004 — Keuze van database en concurrency-strategie

Formaat gebaseerd op MADR (Markdown Architectural Decision Records), versie 3.0.  
Referentie: https://adr.github.io/madr/

---

## Status

Accepted

---

## Context and Problem Statement

Het platform laat groepen reizigers toe om gezamenlijk reizen te plannen en gedeelde uitgaven te beheren. Gebruikers kunnen gelijktijdig budgetten aanpassen, betalingen registreren en kosten verdelen. Hierdoor ontstaan risico’s op race conditions, verloren updates en inconsistente financiële gegevens wanneer meerdere transacties tegelijk worden uitgevoerd.

De applicatie gebruikt een modulaire monolietarchitectuur (ADR-001) waarbij alle modules dezelfde primaire datastore delen. De datastructuur is sterk relationeel: gebruikers, reizen, activiteiten, budgetposten en boekingen zijn nauw met elkaar verbonden en vereisen consistente transacties over meerdere tabellen.

Daarnaast moet het systeem binnen zes maanden productieklaar zijn met een team van vijf ontwikkelaars zonder dedicated DBA. De gekozen oplossing moet daarom niet alleen technisch correct zijn, maar ook beheersbaar qua operationele complexiteit.

POC 4 valideert specifiek de afhandeling van gelijktijdige budgetupdates en bevestigt dat row-level locking noodzakelijk is om race conditions correct te voorkomen.

---

## Decision Drivers

Gerangschikt volgens prioriteit:

1. Sterke data consistentie via ACID-transacties
2. Correcte concurrency-afhandeling via locking
3. Lage operationele complexiteit voor een klein team
4. Goede ondersteuning voor relationele datastructuren
5. Fault tolerance via replicatie en backups
6. Eenvoudige deploybaarheid binnen Docker Swarm
7. Migratiepad naar schaalbare oplossingen indien nodig

---

## Considered Options

1. PostgreSQL (gekozen, zie POC 4)
2. MySQL / MariaDB
3. MongoDB (document)
4. Cassandra (eventual consistency)
5. CockroachDB (distributed SQL)
6. SQLite

---

## Decision Outcome

Gekozen: **PostgreSQL 15**.  
Tweede keuze: **MySQL / MariaDB**.

### Motivatie

PostgreSQL biedt volledige ACID-transacties, betrouwbare row-level locking en sterke ondersteuning voor relationele data. Dit maakt het bijzonder geschikt voor gedeeld budgetbeheer waarbij meerdere gebruikers gelijktijdig wijzigingen kunnen uitvoeren.

Via `SELECT ... FOR UPDATE` kunnen kritieke budgetrecords expliciet vergrendeld worden tijdens transacties. Hierdoor worden race conditions en verloren updates voorkomen zonder extra complexiteit in de applicatielaag.

De relationele aard van PostgreSQL sluit goed aan bij de domeinstructuur van het platform, waarin gebruikers, reizen, activiteiten en budgetposten sterk gekoppeld zijn. Daarnaast beschikt PostgreSQL over mature tooling, uitstekende documentatie en een stabiel officieel Docker-image dat eenvoudig integreert binnen Docker Swarm.

POC 4 valideert dat PostgreSQL row-level locking correct werkt onder gelijktijdige belasting en bevestigt dat de gekozen aanpak voldoet aan de concurrency-vereisten van het systeem.

MySQL/MariaDB werd beschouwd als tweede keuze omdat het eveneens ACID-transacties ondersteunt via InnoDB. PostgreSQL biedt echter rijkere SQL-functionaliteit, sterkere concurrency-features en betere ondersteuning voor complexe transactiescenario’s.

---

## Pros and Cons of the Options

### 1. PostgreSQL (gekozen, zie POC 4)

#### Pro

- Volledige ACID-compliance inclusief serializable isolation
- Betrouwbare row-level locking via `SELECT ... FOR UPDATE`
- Sterke ondersteuning voor complexe transacties
- Geschikt voor relationele datastructuren
- Mature ecosystem en actieve community
- Officieel Docker-image met goede Swarm-compatibiliteit
- Ondersteuning voor JSON, CTEs en window functions
- Geen licentiekosten
- Gevalideerd via POC 4

#### Con

- Schaalbaarheid voornamelijk verticaal
- Horizontale sharding vereist extra tooling zoals Citus
- Vereist periodiek onderhoud (`VACUUM`, `ANALYZE`)
- Hogere resourceconsumptie dan SQLite

---

### 2. MySQL / MariaDB

#### Pro

- ACID-compliant met InnoDB
- Breed ondersteund door hostingproviders
- Eenvoudige operationele setup
- Goede prestaties voor standaard CRUD-operaties

#### Con

- Minder uitgebreide SQL-functionaliteit dan PostgreSQL
- Minder mature concurrency-features
- Complexere transacties historisch minder consistent
- Divergentie tussen MySQL en MariaDB verhoogt onderhoudscomplexiteit

---

### 3. MongoDB (document)

#### Pro

- Flexibel schema
- Goede horizontale schaalbaarheid
- Geschikt voor documentgeoriënteerde data

#### Con

- Minder geschikt voor sterk relationele domeinen
- Complexe transacties moeilijker beheersbaar
- Eventual consistency verhoogt risico op inconsistente budgetdata
- Vereist embedding of handmatige referentie-structuren
- Slechte aansluiting bij transactionele budgetlogica

---

### 4. Cassandra (eventual consistency)

#### Pro

- Hoge beschikbaarheid
- Zeer schaalbaar voor write-heavy workloads
- Geen single point of failure

#### Con

- Eventual consistency conflicteert met financiële transacties
- Geen joins of relationele querymogelijkheden
- Vereist zware denormalisatie
- Operationeel complex
- Niet geschikt voor transactionele budgetlogica

---

### 5. CockroachDB (distributed SQL)

#### Pro

- Gedistribueerde ACID-transacties
- Horizontale schaalbaarheid
- PostgreSQL-compatibele SQL-interface
- Hoge fault tolerance

#### Con

- Hoge operationele complexiteit
- Meer resource-overhead
- Overkill voor verwachte initiële belasting
- Minder mature tooling dan PostgreSQL
- Moeilijker beheer zonder DBA

---

### 6. SQLite

#### Pro

- Zeer lichtgewicht
- Zero-config
- Eenvoudig voor lokaal development

#### Con

- Slechte ondersteuning voor gelijktijdige schrijfacties
- Niet geschikt voor multi-user webapplicaties
- Beperkte schaalbaarheid
- Geen geschikte oplossing voor concurrency-intensieve workloads

---

## Consequences

### Positief

- ACID-transacties garanderen consistente budgetsplitsingen
- Row-level locking voorkomt race conditions
- Eén centrale relationele datastore vereenvoudigt de modulaire monoliet
- Geen eventual consistency-problemen in kernlogica
- Eenvoudige integratie binnen Docker Swarm
- Mature tooling voor backups, migraties en monitoring

### Negatief

- Verticale schaalbaarheid blijft een beperking
- Database vormt initieel een single point of failure
- Periodiek onderhoud vereist aandacht bij groeiende datasets
- Horizontale schaalbaarheid vereist later bijkomende infrastructuur

---

## Implementation Notes

- PostgreSQL versie: `postgres:15`
- Deploy via officieel Docker Hub-image
- Persistentie via Docker named volumes
- Database enkel bereikbaar via intern Swarm overlay network
- Geen publieke blootstelling van de databasecontainer
- Kritieke transacties gebruiken expliciete `SELECT ... FOR UPDATE`
- Isolatieniveau standaard op `READ COMMITTED`
- Voor gevoelige budgetoperaties kan `SERIALIZABLE` gebruikt worden
- Schema-migraties via Flyway of Liquibase
- Redis wordt enkel gebruikt als cachelaag, niet als primaire datastore
- Regelmatige backups en health checks worden voorzien

---

## Related Decisions

- ADR-001 — Modulaire monoliet
- ADR-005 — Messaging / outbox pattern

---

## Validation

- POC 4 valideert correcte row-level locking bij gelijktijdige budgetupdates
- Integratietests bevestigen atomiciteit van budgettransacties
- Geen verloren updates onder gelijktijdige belasting
- Persistentie getest via container-herstarts
- p95 querylatency blijft onder 100 ms bij normale belasting
- Heroverweging gepland na eerste productie-iteratie indien schaalvereisten toenemen