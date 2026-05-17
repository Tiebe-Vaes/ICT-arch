# POC 3 - RabbitMQ messaging met Docker Stack

## Doel

Deze POC toont aan dat de applicatie een modulaire monoliet kan blijven, terwijl asynchrone side effects via RabbitMQ worden verwerkt.

De gekozen scenario-flow is een tripuitnodiging:

1. De `trip-api` verwerkt de kernactie synchroon: een gebruiker uitnodigen voor een trip.
2. De API publiceert daarna een domeinevent: `TripMemberInvited`.
3. RabbitMQ routeert dat event naar de juiste queues.
4. De `notification-worker` verwerkt het event asynchroon en simuleert een notificatie.
5. De `audit-worker` verwerkt hetzelfde event asynchroon en simuleert audit logging.
6. Als de notificatie faalt, wordt het bericht opnieuw geprobeerd en daarna naar een dead-letter queue gestuurd.

## Wat is anders dan Docker Compose?

Deze versie gebruikt Docker Swarm via `docker stack deploy`.

Belangrijke verschillen:

- Docker Stack bouwt geen images met `build:`.
- Daarom bouwen we eerst lokaal één image: `poc3-rabbitmq-app:latest`.
- Daarna deployen we de services met `docker stack deploy`.
- `container_name` wordt niet gebruikt in Docker Stack.
- `depends_on` met healthchecks werkt niet zoals in Docker Compose.
- Daarom proberen de API en workers zelf tot 30 keer verbinding te maken met RabbitMQ.

Voor een lokale schooldemo is dit nog steeds eenvoudig, want Docker Desktop draait meestal als single-node swarm.

## Structuur

```text
poc-3-docker-stack/
├── docker-stack.yml
├── deploy-stack.ps1
├── remove-stack.ps1
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

## Starten met PowerShell

Ga naar de POC-folder:

```powershell
cd C:\Users\lycan\Desktop\ICT-arch\eindopdracht-ict-architecture\poc\poc-3-docker-stack
```

Start/deploy alles:

```powershell
.\deploy-stack.ps1
```

Als PowerShell scripts blokkeert, gebruik dan:

```powershell
powershell -ExecutionPolicy Bypass -File .\deploy-stack.ps1
```

## Handmatig starten zonder script

```powershell
docker swarm init
docker build -t poc3-rabbitmq-app:latest .\app
docker stack deploy -c docker-stack.yml poc3
```

Als Swarm al actief is, mag `docker swarm init` worden overgeslagen.

## Controleren of alles draait

```powershell
docker stack services poc3
```

Je zou ongeveer dit moeten zien:

```text
poc3_rabbitmq              replicated   1/1
poc3_trip-api              replicated   1/1
poc3_notification-worker   replicated   1/1
poc3_audit-worker          replicated   1/1
```

Meer details:

```powershell
docker stack ps poc3
```

API health check:

```powershell
Invoke-RestMethod -Method Get -Uri "http://localhost:8080/health"
```

Verwacht:

```text
status service
------ -------
ok     trip-api
```

## RabbitMQ dashboard

Open:

```text
http://localhost:15672
```

Login:

```text
username: guest
password: guest
```

Interessante plekken in de dashboard:

- `Queues and Streams`
- `Exchanges`
- `Queues and Streams -> notification.trip-events`
- `Queues and Streams -> audit.events`
- `Queues and Streams -> notification.dead-letter`

## Demo 1 - Normale succesvolle flow

PowerShell:

```powershell
$body = @{
  invitedUserId = "user-456"
  invitedByUserId = "user-789"
} | ConvertTo-Json

Invoke-RestMethod `
  -Method Post `
  -Uri "http://localhost:8080/trips/paris-2026/invitations" `
  -ContentType "application/json" `
  -Body $body
```

Verwacht resultaat:

- De API antwoordt met `202 Accepted`.
- De invitation wordt opgeslagen in het geheugen van de API.
- De API publiceert een `TripMemberInvited` event naar RabbitMQ.
- De notification-worker verwerkt het event.
- De audit-worker verwerkt hetzelfde event.

Bekijk logs:

```powershell
docker service logs -f poc3_trip-api
```

```powershell
docker service logs -f poc3_notification-worker
```

```powershell
docker service logs -f poc3_audit-worker
```

## Demo 2 - Berichten zichtbaar maken in RabbitMQ

Normaal worden succesvolle berichten zo snel verwerkt dat ze niet lang zichtbaar blijven in de queue.

Om ze zichtbaar te maken, schaal je de workers tijdelijk naar 0:

```powershell
docker service scale poc3_notification-worker=0 poc3_audit-worker=0
```

Stuur daarna opnieuw een succesvolle invitation:

```powershell
$body = @{
  invitedUserId = "user-visible"
  invitedByUserId = "user-789"
} | ConvertTo-Json

Invoke-RestMethod `
  -Method Post `
  -Uri "http://localhost:8080/trips/visible-demo/invitations" `
  -ContentType "application/json" `
  -Body $body
```

Ga nu in RabbitMQ naar:

```text
Queues and Streams
```

Je zou berichten moeten zien wachten in:

```text
notification.trip-events
audit.events
```

Daarna schaal je de workers terug naar 1:

```powershell
docker service scale poc3_notification-worker=1 poc3_audit-worker=1
```

Refresh RabbitMQ. De berichten verdwijnen weer omdat ze geconsumeerd en geacknowledged zijn.

## Demo 3 - Retry en dead-letter queue

Gebruik `invitedUserId = "fail"` om de notification-worker bewust te laten falen.

```powershell
$body = @{
  invitedUserId = "fail"
  invitedByUserId = "user-789"
} | ConvertTo-Json

Invoke-RestMethod `
  -Method Post `
  -Uri "http://localhost:8080/trips/london-2026/invitations" `
  -ContentType "application/json" `
  -Body $body
```

Verwacht resultaat:

- De API antwoordt nog steeds met `202 Accepted`.
- De audit-worker verwerkt het event normaal.
- De notification-worker faalt bewust.
- Het bericht wordt 3 keer opnieuw geprobeerd.
- Daarna gaat het bericht naar `notification.dead-letter`.

Bekijk de notification logs:

```powershell
docker service logs -f poc3_notification-worker
```

Controleer daarna in RabbitMQ:

```text
Queues and Streams -> notification.dead-letter
```

## Services opschalen

Omdat dit Docker Stack/Swarm is, kan je workers eenvoudig opschalen.

Bijvoorbeeld twee notification workers:

```powershell
docker service scale poc3_notification-worker=2
```

Terug naar één:

```powershell
docker service scale poc3_notification-worker=1
```

Dit toont de scalability quality attribute: consumers kunnen onafhankelijk opgeschaald worden.

## Stoppen en opruimen

```powershell
.\remove-stack.ps1
```

Of handmatig:

```powershell
docker stack rm poc3
```

Wacht daarna enkele seconden tot Docker de services en het overlay-netwerk verwijdert.

## Belangrijke beperking

Deze POC publiceert het event rechtstreeks naar RabbitMQ. In de echte architectuur uit ADR-005 zou dit gecombineerd worden met het Transactional Outbox Pattern, zodat een databasewijziging en het aanmaken van een event betrouwbaar in dezelfde database-transactie gebeuren.

Voor deze POC is de focus bewust beperkt tot:

- publish-subscribe messaging
- asynchrone side effects
- retry
- dead-letter queue
- idempotente consumers
- Docker Stack deployment

## Waarom dit nog steeds past bij een modulaire monoliet

De code staat in één backend-codebase. De API en workers draaien wel als aparte processen, maar ze delen dezelfde codebase en hetzelfde domeinmodel.

Dat simuleert hoe een modulaire monoliet side effects kan uitbesteden aan background workers zonder meteen een microservice-architectuur te worden.

De kernactie blijft synchroon in de Trip-module. Notification en Audit reageren op events. Daardoor ontstaat losse koppeling, terwijl de hoofdarchitectuur een modulaire monoliet blijft.
