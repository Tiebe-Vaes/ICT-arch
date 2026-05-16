# POC 3 - RabbitMQ messaging binnen een modulaire monoliet

## Doel

Deze POC toont aan dat de applicatie een modulaire monoliet kan blijven, terwijl asynchrone side effects via RabbitMQ worden verwerkt.

De gekozen scenario-flow is een tripuitnodiging:

1. De `trip-api` verwerkt de kernactie synchroon: een gebruiker uitnodigen voor een trip.
2. De API publiceert daarna een domeinevent: `TripMemberInvited`.
3. De `notification-worker` verwerkt het event asynchroon en simuleert een notificatie.
4. De `audit-worker` verwerkt hetzelfde event asynchroon en simuleert audit logging.
5. Als de notificatie faalt, wordt het bericht opnieuw geprobeerd en daarna naar een dead-letter queue gestuurd.

## Gelinkte ADR

Deze POC valideert ADR-005: Messaging binnen de modulaire monoliet.

Belangrijk: deze POC kiest niet voor een volledig event-driven architectuur. De kernlogica blijft synchroon. RabbitMQ wordt alleen gebruikt voor asynchrone side effects zoals notificaties en audit logging.

## Quality attributes

- Fault Tolerance: een falende notificatie breekt de kernactie niet.
- Latency: de API-response hoeft niet te wachten tot notificatie en audit logging afgewerkt zijn.
- Loose Coupling: de Trip-module kent de interne implementatie van Notification en Audit niet.
- Scalability: workers kunnen apart opgeschaald worden.

## Structuur

```text
poc-3-rabbitmq-messaging/
├── compose.yaml
├── README.md
└── app/
    ├── Dockerfile
    ├── package.json
    └── src/
        ├── api.js
        ├── messaging/
        │   └── rabbitmq.js
        ├── modules/
        │   └── trip/
        │       └── tripService.js
        └── workers/
            ├── auditWorker.js
            └── notificationWorker.js
```

## Run

Start alles met Docker Compose:

```bash
cd eindopdracht-ict-architecture/poc/poc-3-rabbitmq-messaging
docker compose up --build
```

RabbitMQ Management UI:

```text
http://localhost:15672
username: guest
password: guest
```

## Demo 1 - Normale flow

Maak een tripuitnodiging aan:

```bash
curl -X POST http://localhost:8080/trips/paris-2026/invitations \
  -H "Content-Type: application/json" \
  -d '{"invitedUserId":"user-456","invitedByUserId":"user-789"}'
```

Verwacht resultaat:

- De API antwoordt meteen met `202 Accepted`.
- De response zegt dat de invitation is opgeslagen en dat side effects via RabbitMQ verwerkt worden.
- In de logs zie je dat de notification-worker een notificatie simuleert.
- In de logs zie je dat de audit-worker een audit log simuleert.

## Demo 2 - Consumer tijdelijk offline

Stop alleen de notification worker:

```bash
docker compose stop notification-worker
```

Maak opnieuw een tripuitnodiging aan:

```bash
curl -X POST http://localhost:8080/trips/rome-2026/invitations \
  -H "Content-Type: application/json" \
  -d '{"invitedUserId":"user-111","invitedByUserId":"user-789"}'
```

De API blijft werken, omdat de kernactie niet afhankelijk is van de notification worker.

Start de worker opnieuw:

```bash
docker compose start notification-worker
```

Verwacht resultaat:

- Het bericht stond in RabbitMQ te wachten.
- Na de herstart verwerkt de notification-worker het bericht alsnog.

## Demo 3 - Retry en dead-letter queue

Gebruik `invitedUserId` met waarde `fail`. De notification-worker simuleert dan een fout.

```bash
curl -X POST http://localhost:8080/trips/london-2026/invitations \
  -H "Content-Type: application/json" \
  -d '{"invitedUserId":"fail","invitedByUserId":"user-789"}'
```

Verwacht resultaat:

- De API antwoordt nog steeds met `202 Accepted`.
- De audit-worker verwerkt het event normaal.
- De notification-worker faalt bewust.
- Het bericht wordt 3 keer opnieuw geprobeerd.
- Daarna gaat het bericht naar de queue `notification.dead-letter`.

Je kan dit controleren in de RabbitMQ Management UI bij Queues.

## Waarom dit past bij een modulaire monoliet

Deze POC gebruikt meerdere processen in Docker, maar de code staat in één backend-codebase. Dat simuleert hoe een modulaire monoliet aparte modules en workers kan hebben zonder meteen naar microservices te gaan.

De Trip-module is eigenaar van de kernactie. Notification en Audit reageren alleen op events. Daardoor ontstaat losse koppeling, terwijl de hoofdarchitectuur een modulaire monoliet blijft.

## Belangrijke beperking

Deze POC publiceert het event rechtstreeks naar RabbitMQ. In de echte architectuur uit ADR-005 zou dit gecombineerd worden met het Transactional Outbox Pattern, zodat een databasewijziging en het aanmaken van een event betrouwbaar in dezelfde database-transactie gebeuren.

Voor de POC is de focus bewust beperkt tot:

- publish-subscribe messaging
- asynchrone side effects
- retry
- dead-letter queue
- idempotente consumers

## Cleanup

```bash
docker compose down -v
```
