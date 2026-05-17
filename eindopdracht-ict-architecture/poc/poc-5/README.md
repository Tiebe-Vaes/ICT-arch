# POC 5 — External Integration Component

Deze POC laat zien hoe de **External Integration**-component werkt in isolatie.
Het toont twee dingen aan:

1. Het **Adapter-patroon** — externe API-formaten worden vertaald naar interne modellen. Geen enkel ander component ziet ruwe Booking.com-JSON.
2. **Veerkracht** — time-outdetectie, retry met exponentiële backoff, en een circuit breaker die opent wanneer de provider blijft falen.

## Services

| Service | Poort | Rol |
|---|---|---|
| `mock-hotel-api` | 3000 | Nep externe hotel-API (simuleert Booking.com) |
| `integration-service` | 5000 | De daadwerkelijke component die wordt aangetoond |

## Starten

Bouw eerst de images (vereist voor Docker Swarm):

```bash
docker build -t poc-mock-hotel-api      ./mock-hotel-api
docker build -t poc-integration-service ./integration-service
```

Daarna deployen:

```bash
docker stack deploy -f poc.yaml poc
```

Wacht ~5 seconden totdat beide services zijn opgestart en controleer daarna:

```bash
curl http://localhost:5000/health
curl http://localhost:5000/hotels?city=rome
```

## Circuit breaker demonstreren

De mock-API ondersteunt vier faalscenario's, in te stellen via `FAILURE_MODE` in `poc.yaml`.

### Stap 1 — Normaal gedrag

`FAILURE_MODE: "none"` (standaard). Hotels worden normaal teruggegeven.

```bash
curl http://localhost:5000/hotels?city=rome
```

Verwacht: lijst van hotels + `"state": "CLOSED"` in het circuit-veld.

### Stap 2 — Onstabiele provider

Pas `poc.yaml` aan, zet `FAILURE_MODE: "flaky"` en herdeployer:

```bash
docker stack deploy -f poc.yaml poc
```

Roep het endpoint meerdere keren aan. In de logs zijn retries zichtbaar,
totdat het circuit na 3 fouten opent:

```bash
# Bekijk de logs van de integration service
docker service logs -f poc_integration-service

# Blijf in een ander terminal aanroepen
for i in $(seq 1 10); do curl -s http://localhost:5000/hotels?city=rome | jq .; sleep 1; done
```

Verwacht: de eerste aanroepen slagen (intern wordt geretryed), daarna opent het circuit en falen requests direct met `"state": "OPEN"`.

### Stap 3 — Circuit zien herstellen

Na 15 seconden gaat het circuit naar `HALF_OPEN` en stuurt het een probeaanroep naar de provider.
Als die slaagt, sluit het circuit weer. Volg dit live:

```bash
watch -n 2 'curl -s http://localhost:5000/circuit | jq .'
```

### Stap 4 — Totale uitval

Zet `FAILURE_MODE: "timeout"` of `"error"`. Het circuit opent snel
en alle requests worden direct geblokkeerd (fail fast — geen wachten op een time-out).

## Stoppen

```bash
docker stack rm poc
```

## Architectuurnotitie

De integration-service is geïmplementeerd in **Node.js** (Express). In de daadwerkelijke
modulaire monoliet zouden `BookingComAdapter` en de facade leven binnen het
`module-external-integration`-pakket en direct aangeroepen worden door andere
modules — zonder HTTP. De HTTP-laag bestaat hier alleen om de POC
observeerbaar en uitvoerbaar te maken als losse containers.
