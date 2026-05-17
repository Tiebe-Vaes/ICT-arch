# ADR-005 — Messaging binnen de modulaire monoliet

## Status

Accepted

## Context and Problem Statement

De applicatie is een platform voor het plannen en delen van reizen met vrienden. Gebruikers kunnen samen reizen beheren, activiteiten plannen, budgetten delen, externe reis- en hotelgegevens raadplegen en notificaties ontvangen.

In ADR-001 is gekozen voor een modulaire monoliet als architecturale stijl. Deze keuze geeft lage operationele complexiteit, snelle time-to-market en sterke data consistency binnen één deploybare backend. Toch heeft de applicatie ook processen die niet onmiddellijk in de gebruikersrequest moeten worden afgehandeld. Voorbeelden zijn notificaties, e-mails, herinneringen, audit logging, synchronisatie met externe diensten en achtergrondverwerking.

De vraag is hoe modules binnen de modulaire monoliet met elkaar communiceren wanneer een actie in één module gevolgen heeft voor andere modules. Voorbeelden:

- Wanneer een gebruiker wordt uitgenodigd voor een trip, moet de Notification-module een push- of e-mailnotificatie versturen.
- Wanneer een expense wordt toegevoegd, kan een audit log worden bijgewerkt.
- Wanneer een externe hotel- of vlucht-API tijdelijk niet beschikbaar is, mag de rest van de applicatie niet blokkeren.
- Wanneer een activiteit wijzigt, moeten deelnemers eventueel een notificatie krijgen.
- Wanneer een boeking wordt geïmporteerd, moet de tripplanning worden bijgewerkt zonder alle externe integratielogica in de Trip-module te plaatsen.

Het probleem is dat directe synchrone koppeling tussen alle modules de modulaire monoliet op termijn kan veranderen in een sterk gekoppelde monoliet. Tegelijk is een volledig event-driven architectuur te complex voor de kernlogica, vooral voor gedeeld budgetbeheer waar sterke consistentie belangrijk is.

## Decision Drivers

Gerangschikt naar gewicht.

1. Data Consistency voor tripbeheer en gedeeld budget
2. Lage operationele complexiteit voor een team van 5 personen
3. Fault Tolerance bij externe API's en notificatiekanalen
4. Lage latency voor gebruikersacties in de mobiele en webapplicatie
5. Losse koppeling tussen modules binnen de modulaire monoliet
6. Schaalbaarheid voor achtergrondtaken en notificaties
7. Voorbereiding op latere migratie naar microservices

## Considered Options

1. Alleen synchrone module-calls
2. In-process domain events zonder message broker
3. RabbitMQ met publish-subscribe messaging
4. Kafka als event-streaming platform
5. Volledig event-driven architectuur voor alle domeinlogica

## Decision Outcome

Gekozen optie: RabbitMQ met publish-subscribe messaging voor asynchrone processen, gecombineerd met synchrone module-calls voor transactionele kernlogica.

De applicatie blijft een modulaire monoliet. Event-driven messaging wordt dus niet gekozen als hoofdarchitectuur, maar als ondersteunend patroon binnen en rond de modulaire monoliet.

De kernregels zijn:

- Commands en queries die onmiddellijk consistent moeten zijn, blijven synchroon.
- Domeinacties kunnen events publiceren na een geslaagde database-transactie.
- Asynchrone side effects worden via RabbitMQ verwerkt.
- Betrouwbare publicatie gebeurt via het Transactional Outbox Pattern.
- Consumers moeten idempotent zijn, zodat dubbele events geen foutieve toestand veroorzaken.
- Foutieve berichten gaan na retries naar een dead-letter queue.

Tweede keuze: In-process domain events zonder RabbitMQ.

Deze optie is eenvoudiger, maar minder robuust bij meerdere replicas, crashes of langere achtergrondtaken. Omdat de applicatie op Docker Swarm met meerdere replicas kan draaien, is een externe message broker beter verdedigbaar.

## Pros and Cons of the Options

### 1. Alleen synchrone module-calls

Pro:

- Eenvoudig te begrijpen en te implementeren
- Makkelijk te debuggen
- Geen extra infrastructuur nodig
- Sterke consistentie binnen één request en één database-transactie

Con:

- Modules worden sneller aan elkaar gekoppeld
- Trage side effects, zoals e-mail of externe API-calls, vertragen gebruikersrequests
- Minder fault tolerant bij uitval van externe diensten
- Moeilijker om achtergrondtaken apart te schalen

Verworpen als enige oplossing, omdat notificaties, integraties en achtergrondtaken niet allemaal synchroon in de request-flow horen.

### 2. In-process domain events zonder message broker

Pro:

- Past goed bij een modulaire monoliet
- Geen extra broker nodig
- Modules kunnen reageren op events zonder directe call vanuit de bronmodule
- Eenvoudiger dan RabbitMQ of Kafka

Con:

- Events verdwijnen bij applicatiecrashes
- Niet geschikt voor betrouwbare verwerking over meerdere replicas
- Geen duidelijke retry- of dead-letter-mechanismen
- Minder bruikbaar voor background workers buiten het hoofdproces

Verworpen als hoofdoplossing, maar wel bruikbaar voor eenvoudige interne events die geen gegarandeerde aflevering nodig hebben.

### 3. RabbitMQ met publish-subscribe messaging

Pro:

- Goede match voor asynchrone taken, notificaties en integraties
- Ondersteunt queues, retries en dead-letter queues
- Minder complex dan Kafka
- Past binnen Docker Swarm
- Modules blijven losser gekoppeld
- Background workers kunnen apart schalen
- Bereidt de applicatie voor op latere opsplitsing naar microservices

Con:

- Extra infrastructuurcomponent
- Meer operationele complexiteit dan alleen synchrone calls
- Vereist duidelijke eventcontracten
- Vereist idempotente consumers
- Debugging wordt moeilijker door asynchroon gedrag

Gekozen, omdat dit de beste balans geeft tussen fault tolerance, loose coupling en beheersbare complexiteit.

### 4. Kafka als event-streaming platform

Pro:

- Zeer schaalbaar
- Sterk voor event streaming en replay
- Geschikt voor analytics, audit trails en hoge throughput
- Interessant bij veel onafhankelijke services

Con:

- Operationeel zwaarder dan RabbitMQ
- Overkill voor het MVP
- Complexer deployment- en beheerproces
- Minder passend voor een team van 5 personen binnen 6 maanden

Verworpen voor het MVP. Kafka kan later overwogen worden indien de applicatie groeit naar veel services, analytics en event replay.

### 5. Volledig event-driven architectuur voor alle domeinlogica

Pro:

- Maximale ontkoppeling
- Goede schaalbaarheid
- Natuurlijke audit trail
- Modules kunnen volledig onafhankelijk reageren op gebeurtenissen

Con:

- Te complex voor transactionele kernlogica
- Eventual consistency maakt budgetbeheer moeilijker
- Meer risico op race conditions en inconsistenties
- Debugging en monitoring worden veel complexer
- Te zwaar voor een team van 5 personen binnen 6 maanden

Verworpen als hoofdarchitectuur. Event-driven wordt alleen gebruikt waar asynchroon gedrag meerwaarde biedt.

## Consequences

Positief:

- Gebruikersrequests blijven sneller omdat trage side effects buiten de request-flow vallen.
- Externe API-problemen of notificatieproblemen leggen de kernfunctionaliteit niet plat.
- Modules blijven losser gekoppeld doordat ze reageren op events in plaats van elkaar rechtstreeks overal aan te roepen.
- Background workers kunnen apart opgeschaald worden.
- De modulaire monoliet krijgt een duidelijk migratiepad naar microservices.
- RabbitMQ past goed bij POC's rond pub-sub, notificaties en fault tolerance.

Negatief:

- Er komt extra infrastructuur bij.
- Het team moet duidelijke eventnamen, payloads en eigenaarschap afspreken.
- Asynchrone verwerking maakt debugging moeilijker.
- Consumers moeten idempotent zijn.
- Er moet monitoring komen op queues, retries en dead-letter queues.
- Er is extra discipline nodig om niet alle domeinlogica event-driven te maken.

## Implementation Notes

### Algemene structuur

De backend blijft één deploybare modulaire monoliet. Binnen de codebase worden modules duidelijk gescheiden, bijvoorbeeld:

- User & Auth
- Trip Management
- Budget & Payment
- Planning & Route
- Integration Layer
- Notification
- Audit Log
- Background Jobs

Modules mogen synchrone calls gebruiken voor directe, transactionele use cases. Voor indirecte gevolgen publiceren modules domeinevents.

### Event flow

Voorbeeldflow bij een tripuitnodiging:

1. De Trip-module valideert de gebruiker, trip en rechten.
2. De Trip-module schrijft de uitnodiging naar PostgreSQL.
3. In dezelfde database-transactie wordt een record toegevoegd aan de outbox-tabel.
4. Een background publisher leest de outbox-tabel.
5. De publisher publiceert `TripMemberInvited` naar RabbitMQ.
6. De Notification-module consumeert het event.
7. De Notification-module verstuurt een pushmelding, e-mail of in-app notificatie.
8. Bij falen wordt het bericht opnieuw geprobeerd.
9. Na meerdere mislukte pogingen gaat het bericht naar een dead-letter queue.

### Transactional Outbox Pattern

Om te voorkomen dat een databasewijziging lukt maar het event niet gepubliceerd wordt, gebruiken we een outbox-tabel.

Voorbeeldvelden:

- `id`
- `event_type`
- `aggregate_type`
- `aggregate_id`
- `payload`
- `created_at`
- `published_at`
- `retry_count`
- `status`

De applicatie schrijft de domeinwijziging en het outbox-event in dezelfde database-transactie. Daarna publiceert een aparte worker de events naar RabbitMQ.

### Event naming

Events krijgen namen in de verleden tijd, omdat ze iets beschrijven dat al gebeurd is.

Voorbeelden:

- `TripCreated`
- `TripMemberInvited`
- `TripUpdated`
- `ExpenseAdded`
- `ExpenseSettled`
- `ActivityPlanned`
- `ActivityChanged`
- `BookingImported`
- `ExternalProviderFailed`
- `NotificationRequested`

### Event payload

Een event bevat alleen data die consumers nodig hebben. Het event mag geen volledige interne database-entiteiten lekken.

Voorbeeld:

```json
{
  "eventId": "6f9b2c15-8c3c-4b53-9c4e-ff78c219e91c",
  "eventType": "TripMemberInvited",
  "occurredAt": "2026-05-14T18:30:00Z",
  "tripId": "trip-123",
  "invitedUserId": "user-456",
  "invitedByUserId": "user-789",
  "correlationId": "req-abc"
}
```
