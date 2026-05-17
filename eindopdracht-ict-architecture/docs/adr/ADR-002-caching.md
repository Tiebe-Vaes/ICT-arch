# ADR-002 — Caching van externe reisgegevens

Formaat: MADR 3.0. Referentie: https://adr.github.io/madr/

## Status

Accepted

## Context and Problem Statement

De applicatie maakt gebruik van externe diensten voor het ophalen van reisgegevens zoals hotelinformatie, activiteiten  en reisdetails. Deze externe API's kunnen trage responstijden hebben of tijdelijk onbeschikbaar zijn.

Bij elke gebruikseraanvraag rechtsreeks communiceren met externe diensten kan leiden tot:
- hogere latency
- hogere belasting op de externe API's
- slechtere gebruikerservaring
- verminderde beschikbaarheid bij API-uitval

Bepaalde reisgegevens worden meerdere keren opnieuw gevraagd zoals:
- populaire bestemmingen
- gedeelde reizen
- hotelinformatie
- activiteiten

De technische vraag is of caching gebruikt kan worden om respostijden te verbeteren en de afhankelijkheid op externe diensten te verminderen.


## Decision Drivers

- Lage Latency voor herhaalde requests
- Availability / Fault Tolerance bij externe API-uitval
- Kost (minder externe API-calls)
- Beperkte operationele complexiteit

## Considered Options

1. In-memory cache per backend-instance
2. Redis als gedeelde cache (gekozen, zie POC 2)
3. CDN / edge cache
4. Database materialized views

## Decision Outcome

Gekozen optie: Redis als gedeelde cache

De applicatie gebruikt Redis als centrale cache layer tussen de backend services en de externe API's.

1. De backendservice controleert eerst of gegevens aanwezig zijn in Redis.
2. Indien aanwezig wordt de cached data onmiddellijk teruggetrokken.
3. Indien niet aanwezig, wordt de externe API aangesproken.
4. Het resultaat wordt opgeslagen in Redis voor toekomstige aanvragen.

Tweede optie: In-memory cache per backend-instance

Deze oplossing heeft lagere operationele complexiteit, maar ondersteunt schaalbare deployment minder goed omdat cache-data niet gedeeld wordt tussen instances.

## Pros and Cons of the Options

### Optie 1: In-memory cache per backend-instance

Pros
- Geen extra container nodig
- Snelle toegang tot data

Cons
- Cache wordt niet gedeeld tussen instances
- Cache verdwijnt bij restart

### Optie 2: Redis als gedeelde cache

Pros
- Lage latency
- Gedeelde cache tussen meerdere instances
- Vermindert belasting op externe API's
- Ondersteunt fault tolerance

Cons
- Extra infrastructuurcomponent
- Extra geheugenverbruik

### Optie 3: CDN / edge cache

Pros
- Hoge performantie voor statiche content
- Lage latency wereldwijd

Cons
- Minder geschikt voor dynamische reisgegevens
- Complexere configuratie

### Optie 4: Database materialized views

Pros
- Centrale opslag
- Integratie met bestaande database

Cons
- Tragere toegang dan Redis
- Extra belasting op database
- Minder geschikt voor tijdelijke cache-data

## Consequences

Positieve gevolgen 
- Snellere responstijden voor herhaalde requests
- Lagere belasting op externe API's
- Betere gebruikerservaring
- Hogere beschikbaarheid bij tijdelijke API-uitval
- Betere schaalbaarheid van backend services

Negatieve gevolgen 
- Extra operationele component (Redis)
- Extra monitoring en cachebeheer nodig

## Implementation Notes
- Redis wordt gebruikt als gedeelde cache layer.
- Cache entries gebruiken een TTL-strategie(Time To Live)
- Cache keys volgens een vaste formaat zoals:
```text
  trip:{id}
  hotel:{id}
  destination:{name}
```
## Related Decisions

- ADR-001 (Modulaire monoliet)

## Validation

POC 2 toont cache-miss, cache-hit en gracieus gedrag bij externe API-uitval.

## Referenties

- Nishtala, R. et al. (2013). *Scaling Memcache at Facebook.* USENIX NSDI. https://www.usenix.org/conference/nsdi13/technical-sessions/presentation/nishtala — productie-evidence dat een gedeelde in-memory cache-laag tussen app en backing store latency en backend-belasting drastisch verlaagt; rechtvaardigt onze keuze voor Redis boven in-memory per instance.
- Yan, G., & Li, J. (2022). *Towards Latency Awareness for Content Delivery Network Caching.* USENIX ATC. https://www.usenix.org/conference/atc22/presentation/yan-gang — peer-reviewed empirische studie: latency-aware caching verlaagt p99-latency 5–15% afhankelijk van backend-RTT; onderbouwt onze latency- en availability-claim bij trage externe API's.
