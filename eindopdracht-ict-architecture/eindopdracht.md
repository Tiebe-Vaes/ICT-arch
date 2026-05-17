# Eindopdracht ICT Architecture — Travel Planning App

AP Hogeschool, 2e jaar Toegepaste Informatica.

**Case:** platform voor het plannen en delen van reizen met vrienden, met gedeeld budgetbeheer, activiteitenplanning en integraties met externe diensten (hotels, vluchten, payment providers).

**Team:** 5 leden.

| Naam | ADR | POC |
|---|---|---|
| Jamyang Tenzin | ADR-002 (Caching) | POC 2 (Redis) |
| Tiebe Vaes | ADR-003 (Authenticatie) | POC 1 (OAuth + JWT) |
| Talia Journée | ADR-005 (Messaging) | POC 3 (RabbitMQ) |
| Neta Kiala | ADR-004 (Database) | POC 4 (PostgreSQL locking) |
| Hoyin Man | ADR-006 (Externe integratie) | POC 5 (Adapter + circuit breaker) |

ADR-001 (architecturale stijl) is gezamenlijk.

---

## Inhoudsopgave

1. [Karakteristieken](#1-karakteristieken)
2. [Logische componenten](#2-logische-componenten)
3. [ADR-001 — Architecturale stijl](#3-adr-001--architecturale-stijl)
4. [Verdere ADR's](#4-verdere-adrs)
5. [C4-diagrammen](#5-c4-diagrammen)
6. [Proofs of Concept](#6-proofs-of-concept)

---

## 1. Karakteristieken

Top 7 quality attributes voor de applicatie.

### 1.1 Availability

Gebruikers bevinden zich in verschillende tijdzones en kunnen op elk moment toegang nodig hebben tot hun reisplanning, boekingen en budgetinformatie. Ook tijdens de reis zelf moet de applicatie betrouwbaar beschikbaar blijven, bijvoorbeeld om reservaties te raadplegen of wijzigingen door te voeren. Daarom moet het systeem ontworpen worden met minimale downtime en een hoge beschikbaarheid.

### 1.2 Confidentiality

De applicatie verwerkt gevoelige gegevens zoals persoonlijke informatie, reisdata, locaties en mogelijk betalingsgegevens. Deze informatie mag enkel toegankelijk zijn voor bevoegde gebruikers. Ongeautoriseerde toegang kan leiden tot privacyproblemen, misbruik of veiligheidsrisico's. Daarom moet het systeem vertrouwelijkheid garanderen via sterke authenticatie, toegangscontrole en versleuteling.

### 1.3 Interoperability

De applicatie integreert externe diensten van reisbureaus, hotels, vluchtenplatformen en andere aanbieders. Deze externe partijen gebruiken elk hun eigen API's, dataformaten en protocollen. Het systeem moet in staat zijn om vlot te communiceren met deze heterogene diensten, en moet ook nieuwe integraties kunnen toevoegen zonder de kern van de applicatie te hertekenen.

### 1.4 Fault Tolerance

Externe diensten zoals hotel-API's of vluchtdatabanken kunnen tijdelijk onbeschikbaar zijn. De applicatie mag hierdoor niet volledig uitvallen. Componenten moeten onafhankelijk van elkaar falen, en het systeem moet gracieus degraderen — bijvoorbeeld door gecachte data te tonen of de gebruiker te informeren zonder verlies van reeds ingevoerde planningsdata.

### 1.5 Latency

Gebruikers zoeken gelijktijdig door grote hoeveelheden activiteiten, hotels en vluchten. Trage zoekresultaten leiden rechtstreeks tot frustratie en verlaten sessies. Zeker op mobiele apparaten of bij beperkte dataverbinding tijdens een reis is een lage responstijd cruciaal voor een goede gebruikerservaring.

### 1.6 Data Consistency

Meerdere vrienden werken gelijktijdig aan hetzelfde reisplan en budget. Conflicterende wijzigingen moeten correct afgehandeld worden. Dit is een echte architecturale uitdaging die keuzes beïnvloedt tussen eventual consistency en strong consistency, met directe impact op gebruikerservaring en data-integriteit.

### 1.7 Scalability

De applicatie heeft duidelijke gebruikspieken (vakantieperiodes). Dit heeft een directe impact op architecturale keuzes zoals horizontale schaalbaarheid, load balancing en elastische infrastructuur. Het systeem moet pieken kunnen opvangen zonder degradatie van beschikbaarheid of latency.

---

## 2. Logische componenten

Bepaald via de actor-action approach, voor de keuze van een architecturale stijl. Componenten zijn geen services en staan los van enige implementatiebeslissing.

### 2.1 Actoren

- Gast: een niet-ingelogde bezoeker.
- Reiziger: een geregistreerde gebruiker die reizen plant en deelt met anderen.
- Groepsbeheerder: een reiziger met extra rechten binnen een specifieke reis.
- System: automatische acties die zonder directe gebruikersinteractie plaatsvinden.
- Extern systeem: een derde partij zoals een reisbureau, hotel of betalingsprovider.

### 2.2 Actor-action tabel

| Actor | Acties | Component |
|---|---|---|
| Gast | Registreren, inloggen | Gebruikersbeheer |
| Reiziger | Profiel beheren | Gebruikersbeheer |
| Reiziger | Reis bekijken | Reisbeheer |
| Reiziger | Activiteit voorstellen, stemmen op activiteit | Activiteitenplanning |
| Reiziger | Uitgave registreren, budgetoverzicht raadplegen | Budgetbeheer |
| Reiziger | Betaling initiëren | Betalingen |
| Groepsbeheerder | Reis aanmaken, bewerken, verwijderen | Reisbeheer |
| Groepsbeheerder | Deelnemers uitnodigen en beheren | Reisbeheer |
| Groepsbeheerder | Totaalbudget instellen | Budgetbeheer |
| System | Externe prijzen en beschikbaarheid opvragen | Integratie |
| System | Budget bijwerken na betalingsbevestiging | Budgetbeheer |
| System | Notificatie versturen bij gebeurtenis | Notificatie |
| Extern systeem | Prijzen en beschikbaarheid aanleveren | Integratie |
| Extern systeem | Betalingsbevestiging aanleveren | Betalingen |

### 2.3 Takenoverzicht per component

#### Gebruikersbeheer

- Registratie van nieuwe gebruikers
- Authenticatie (inloggen, uitloggen, wachtwoord herstellen)
- Profielbeheer (naam, e-mail, voorkeuren)
- Autorisatie: bepalen wat een gebruiker mag binnen een reis

#### Reisbeheer

- Aanmaken, bewerken en verwijderen van reizen
- Instellen van reisdetails (bestemming, datums, beschrijving)
- Uitnodigen van deelnemers via link of e-mail
- Beheren van de ledenlijst (toevoegen, verwijderen, rollen toewijzen)
- Overzicht van alle reizen van een gebruiker

#### Activiteitenplanning

- Voorstellen van activiteiten (naam, datum, locatie, beschrijving)
- Stemmen op voorgestelde activiteiten
- Definitief inplannen van activiteiten in een tijdlijn
- Overzicht van de reisagenda

#### Budgetbeheer

- Instellen van een totaalbudget per reis
- Registreren van individuele uitgaven door deelnemers
- Automatisch berekenen van wie hoeveel verschuldigd is aan wie (splits)
- Bewaken van het budgetplafond en signaleren bij overschrijding
- Overzicht van alle uitgaven en openstaande bedragen per deelnemer
- Budget bijwerken na ontvangst van een betalingsbevestiging

#### Integratie

- Opvragen van beschikbaarheid en prijzen bij hotels en reisbureaus
- Vertalen van externe dataformaten naar interne domeinmodellen
- Afhandelen van fouten en time-outs bij externe diensten

#### Betalingen

- Initiëren van betalingen via een externe betalingsprovider
- Verwerken en valideren van betalingsbevestigingen
- Doorgeven van bevestigde betalingen aan Budgetbeheer
- Afhandelen van mislukte of geannuleerde betalingen

#### Notificatie

- Versturen van uitnodigingen voor een reis
- Notificeren bij nieuwe activiteitsvoorstellen of wijzigingen
- Waarschuwen bij budgetoverschrijding
- Bevestigen van betalingen en uitgaven
- Ondersteunen van meerdere kanalen (e-mail, in-app)

---

## 3. ADR-001 — Architecturale stijl

Status: Accepted. Formaat: [MADR 3.0](https://adr.github.io/madr/). Lokale template: [`docs/adr/template.md`](docs/adr/template.md). Volledige ADR: [`docs/adr/ADR-001-architecture-style.md`](docs/adr/ADR-001-architecture-style.md).

### 3.1 Beslissing

We kiezen voor een **modulaire monoliet** in Node.js. Eén deploybare backend, met de modules uit hoofdstuk 2 (User & Auth, Trip, Budget, Planning, Integration, Notification, Audit) als interne pakketten. Module-grenzen worden bewaakt via boundary-tests in CI.

De tweede keuze is **microservices met event-driven communicatie**. Conceptueel sluit die stijl beter aan bij Scalability en Fault Tolerance, maar de operationele overhead (service mesh, distributed tracing, eventual consistency over services) past niet binnen een team van vijf en een MVP van zes maanden.

### 3.2 Waarom modulaire monoliet

De doorslag ligt bij Data Consistency en time-to-market. Gedeeld budget tussen vrienden vereist ACID-transacties; eventual consistency over services maakt settle-up onnodig complex. Eén database, één deploybare unit, geen netwerklatency tussen modules. Pakketgrenzen leveren wel de discipline om later — indien nodig — modules af te splitsen naar services.

### 3.3 Overwogen stijlen

Alle stijlen uit de cursus zijn overwogen: klassieke monoliet, layered, modulaire monoliet, microservices, event-driven, space-based, microkernel, SOA, pipeline en serverless. De volledige pro/con-analyse per stijl staat in het ADR-bestand. De korte versie:

- **Klassieke monoliet** en **layered** lossen het grens-probleem niet op.
- **Space-based**, **microkernel** en **pipeline** passen niet bij een interactieve, transactionele applicatie.
- **SOA** komt neer op een zwaardere variant van microservices.
- **Serverless** botst met de opgelegde Docker Swarm-deployment.
- **Event-driven** wordt niet als hoofdstijl gekozen, maar wel ingezet voor asynchrone side effects (zie ADR-005).

### 3.4 Gevolgen

Sterke kanten: snel ontwikkelpad, ACID out-of-the-box, één artifact om te deployen en monitoren, en een duidelijk migratiepad naar microservices later. Zwakke kanten: de hele applicatie schaalt als geheel mee (gemitigeerd via meerdere replicas op Swarm), één falende module kan de hele app raken, en de module-grenzen vragen actieve bewaking — anders glijdt de codebase richting een ongestructureerde monoliet.

---

## 4. Verdere ADR's

Vijf bijkomende ADR's voor de belangrijkste beslissingen. Volledige inhoud per ADR in `docs/adr/`.

| ADR | Onderwerp | Status | Gekoppelde POC |
|---|---|---|---|
| [ADR-002](docs/adr/ADR-002-caching.md) | Caching van externe reisgegevens (Redis) | Accepted | POC 2 |
| [ADR-003](docs/adr/ADR-003-authentication.md) | Authenticatie (OAuth2 + eigen JWT) | Accepted | POC 1 |
| [ADR-004](docs/adr/ADR-004-database.md) | Database en concurrency-strategie (PostgreSQL) | Accepted | POC 4 |
| [ADR-005](docs/adr/ADR-005-messaging-system.md) | Messaging binnen modulaire monoliet (RabbitMQ) | Accepted | POC 3 |
| [ADR-006](docs/adr/ADR-006-externe-integratie.md) | Externe integratie (adapter + circuit breaker) | Accepted | POC 5 |

---

## 5. C4-diagrammen

Modellering volgens het C4-model met Structurizr DSL. De DSL-broncode staat hieronder; de gerenderde views staan onder `docs/images/`.

### 5.1 System Context

![System Context](docs/images/c4-context.png)

### 5.2 Container

![Containers](docs/images/c4-containers.png)

### 5.3 Deployment

![Deployment](docs/images/c4-deployment.png)

### 5.4 Structurizr DSL

Volledige DSL: [`docs/c4_diagrammen/structure.dsl`](docs/c4_diagrammen/structure.dsl).

```dsl
workspace "Travel Planning App" "ICT Architecture Assignment" {

    model {
        # Actors
        traveler = person "Traveler" "Plant trips, beheert budget, nodigt vrienden uit"
        admin    = person "Admin" "Modereert gebruikers en trips"

        # Externe systemen
        oauthProvider   = softwareSystem "OAuth Provider (GitHub)" "Externe identity provider" "External System"
        hotelApi        = softwareSystem "Hotel Booking API"       "Externe hotelprovider"     "External System"
        travelAgency    = softwareSystem "Travel Agency API"       "Externe vlucht-/reisprovider" "External System"
        paymentProvider = softwareSystem "Payment Provider"        "Externe betaalprovider"    "External System"

        # Eigen systeem — modulaire monoliet (ADR-001)
        travelApp = softwareSystem "Travel Planning System" "Plannen en delen van reizen met vrienden" {
            webApp   = container "Web Frontend" "SPA voor trips, budget, planning" "React"
            traefik  = container "Traefik" "Reverse proxy / ingress, TLS-terminatie" "Traefik"
            backend  = container "Backend (Modulaire Monoliet)" "Eén deploybare unit met modules: Auth, Trip, Planning, Budget, Integration, Notification, Audit" "Node.js / Express"
            worker   = container "Background Worker" "Zelfde image als backend, andere entrypoint. Consumeert events uit RabbitMQ (notificaties, audit)" "Node.js"
            postgres = container "PostgreSQL"   "Trips, users, budget, audit log" "PostgreSQL 16" "Database"
            redis    = container "Redis Cache"  "Cache van externe API-responses en sessies" "Redis 7"   "Database"
            rabbit   = container "RabbitMQ"     "Event bus voor asynchrone side effects" "RabbitMQ 3"   "Messaging"
        }

        # System context
        traveler  -> travelApp "Plant en deelt reizen via"
        admin     -> travelApp "Modereert via"
        travelApp -> oauthProvider   "Login delegeren naar"
        travelApp -> hotelApi        "Hotels zoeken/boeken"
        travelApp -> travelAgency    "Vluchten/reizen zoeken"
        travelApp -> paymentProvider "Betalingen afhandelen"

        # Container relaties
        traveler -> webApp  "Gebruikt"
        admin    -> webApp  "Gebruikt"
        webApp   -> traefik "HTTPS"
        traefik  -> backend "Routeert REST/JSON"
        backend  -> postgres "Leest/schrijft (ACID)"
        backend  -> redis    "Cached externe responses"
        backend  -> rabbit   "Publiceert domeinevents"
        worker   -> rabbit   "Consumeert events"
        worker   -> postgres "Schrijft notificaties / audit"

        # Externe integraties op container-niveau
        backend -> oauthProvider   "OAuth2 authorization code"
        backend -> hotelApi        "HTTP via ACL"
        backend -> travelAgency    "HTTP via ACL"
        backend -> paymentProvider "HTTP via ACL"

        # Deployment — testcluster: 3 managers + 2 workers
        deploymentEnvironment "Production" {
            deploymentNode "Docker Swarm Cluster" "3 managers, 2 workers" {
                deploymentNode "Manager 1" "Linux VM — ingress" {
                    containerInstance traefik
                    containerInstance webApp
                }
                deploymentNode "Manager 2" "Linux VM" {
                    containerInstance backend
                }
                deploymentNode "Manager 3" "Linux VM" {
                    containerInstance backend
                    containerInstance worker
                }
                deploymentNode "Worker 1" "Linux VM — stateful data" {
                    containerInstance postgres
                    containerInstance redis
                }
                deploymentNode "Worker 2" "Linux VM — messaging" {
                    containerInstance rabbit
                }
            }
        }
    }

    views {
        systemContext travelApp "SystemContext" {
            include *
            autoLayout
        }

        container travelApp "Containers" {
            include *
            autoLayout
        }

        deployment travelApp "Production" "Deployment" {
            include *
            autoLayout
        }

        styles {
            element "Person" {
                shape Person
                background #08427B
                color #ffffff
            }
            element "Software System" {
                background #1168BD
                color #ffffff
            }
            element "External System" {
                background #999999
                color #ffffff
            }
            element "Container" {
                background #438DD5
                color #ffffff
            }
            element "Database" {
                shape Cylinder
                background #2E7C8F
                color #ffffff
            }
            element "Messaging" {
                shape Pipe
                background #C97A2E
                color #ffffff
            }
        }
    }
}
```

---

## 6. Proofs of Concept

Vijf POC's, één per teamlid. Elke POC is een aparte directory met eigen `README.md`. Opstartcommando vanuit de POC-directory:

```bash
docker stack deploy -c poc.yaml poc
```

(Uitzondering: zie de README per POC indien een afwijkende start vereist is.)

| POC | Onderwerp | Quality attribute(s) | Directory |
|---|---|---|---|
| 1 | OAuth login + eigen JWT (GitHub) | Confidentiality | [`poc/poc-1/`](poc/poc-1/) |
| 2 | Redis caching van reisgegevens | Performance, Availability, Resilience | [`poc/poc-2/`](poc/poc-2/) |
| 3 | RabbitMQ messaging binnen modulaire monoliet | Fault Tolerance, Loose Coupling, Scalability | [`poc/poc-3/`](poc/poc-3/) |
| 4 | PostgreSQL concurrent budget updates (FOR UPDATE) | Data Consistency, Fault Tolerance | [`poc/poc-4/`](poc/poc-4/) |
| 5 | Integration Layer — adapter + circuit breaker (mock hotel API) | Interoperability, Fault Tolerance | [`poc/poc-5/`](poc/poc-5/) |

POC 3 wijkt af van het standaard-commando: zie [`poc/poc-3/README.md`](poc/poc-3/README.md) (gebruikt `docker-stack.yml` en vereist eerst een image-build). POC 1 vereist een ingevuld `.env`-bestand met GitHub OAuth credentials. Docker Swarm bouwt geen images automatisch — `docker build` is altijd een aparte stap vóór `docker stack deploy`.
