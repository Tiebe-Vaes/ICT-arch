# ADR-006 — Externe integratie via adapterpatroon + circuit breaker

Formaat: MADR 3.0. Referentie: https://adr.github.io/madr/

## Status

Accepted

## Context and Problem Statement

De reisplanningsapplicatie moet communiceren met meerdere externe diensten: hotels, reisagentschappen, vluchtzoekmachines en activiteitenproviders. Elk van deze systemen heeft zijn eigen protocol, dataformaat, authenticatiemechanisme en foutgedrag. Hoe zorgen we ervoor dat de rest van de applicatie niet afhankelijk wordt van deze heterogeniteit, en dat een storing bij één externe provider geen cascade van fouten veroorzaakt in de rest van het systeem?

## Decision Drivers

- Externe API's zijn buiten onze controle: ze kunnen wijzigen, uitvallen of verzoeken throttlen
- Elke provider gebruikt andere authenticatie (API-sleutel, OAuth2, eigen tokens)
- Antwoorden van providers moeten genormaliseerd worden naar een intern datamodel
- Trage externe calls (100ms–3s) mogen de responsiviteit van de applicatie niet ondermijnen
- Het toevoegen van een nieuwe provider mag geen wijzigingen vereisen in andere componenten
- Credentials van externe diensten moeten centraal beheerd worden

## Considered Options

- **Dedicated integratieservice met adapterpatroon** — één component verantwoordelijk voor alle uitgaande communicatie, met per provider een adapter die vertaalt naar het interne model
- **Directe calls vanuit domeincomponenten** — elk component (Trip, Budget, ...) roept externe API's zelf aan

## Decision Outcome

Gekozen optie: **dedicated integratieservice met adapterpatroon**

Elke externe provider krijgt een eigen adapter die zijn specifieke API vertaalt naar een uniform intern contract (bv. `zoekHotels(criteria)`, `bevestigBoeking(details)`). De integratieservice is de enige component die rechtstreeks met externe systemen communiceert. Hij beheert retries, timeouts, circuit breaking en caching centraal.
## Pros and Cons of the Options

### Dedicated integratieservice met adapterpatroon
pros:

- Domeincomponenten zijn volledig afgeschermd van externe API-wijzigingen
- Credentials en foutafhandeling op één plaats beheerd
- Nieuwe providers toevoegen = nieuwe adapter schrijven, niets anders aanpassen
- Caching op integratieniveau verbetert de responsiviteit

cons:

- Extra netwerkhop bij elke externe aanroep
- Potentieel single point of failure (mitigatie: horizontaal schalen)

### Directe calls vanuit domeincomponenten
pros:
- Eenvoudiger initieel te implementeren

cons:
- Credential- en foutbeheer verspreid over het hele systeem
- Swappen of toevoegen van providers vereist wijzigingen in meerdere componenten


## Consequences

- De integratieservice wordt een zelfstandig inzetbaar onderdeel binnen de modulaire monoliet
- Circuit breakers per provider voorkomen dat een falende externe dienst de hele applicatie trager maakt
- Het adapterpatroon maakt het mogelijk om providers te vervangen of toe te voegen zonder regressie in andere modules
- De module is horizontaal schaalbaar als externe API-calls een bottleneck vormen


## Implementation Notes
- Sla tijdelijk gecachte resultaten op in Redis met een TTL afgestemd op de aard van de data (beschikbaarheid hotel: kort; activiteiteninformatie: langer)
- Definieer interne DTO's los van de externe API-contracten zodat externe wijzigingen enkel de adapter raken

## Related Decisions

- ADR-001 (Modulaire monoliet)
- ADR-002 (caching) 

## Validation

POC 5 — demonstreert hoe een adapter een externe hotel-API normaliseert naar één intern model, inclusief retry met exponentiële backoff en circuit breaking bij uitval van de provider.

## Referenties

- Montesi, F., & Weber, J. (2016). *Circuit Breakers, Discovery, and API Gateways in Microservices.* arXiv:1609.05830. https://arxiv.org/abs/1609.05830 — academische behandeling van circuit-breaker semantiek en effect op fault isolation; onderbouwt circuit breaking per externe provider.
- Heorhiadi, V., et al. (2016). *Gremlin: Systematic Resilience Testing of Microservices.* IEEE ICDCS. https://ieeexplore.ieee.org/document/7536384 — peer-reviewed empirische validatie dat circuit breakers cascading failures bij externe-dependency-uitval voorkomen.
- Bucchiarone, A., Dragoni, N., Dustdar, S., Larsen, S. T., & Mazzara, M. (2018). *From Monolithic to Microservices: An Experience Report from the Banking Domain.* *IEEE Software*, 35(3). https://ieeexplore.ieee.org/document/8354433 — peer-reviewed industrieel verslag dat anti-corruption layers en adapters aanbeveelt als ontkoppeling tussen modern systeem en heterogene externe systemen.
