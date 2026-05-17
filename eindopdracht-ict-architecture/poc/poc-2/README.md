# POC 2 — Redis Caching van reisgegevens


## Doel
Deze POC gebruikt redis caching om veelgebruikte reisgegevens sneller beschikbaar te maken en de belasting op externe diensten te verminderen.

**Quality attributes:** ...
- Performance 
- Availability
- Resilience

## Stack
- Travel Service (Node.js + Express)
- Redis (cache)
- Mock Travel API (externe dienst met trage response)
- Docker Swarm

## Run
```bash
docker swarm init
docker build -t poc-travel-service ./travel-service
docker build -t poc-mock-api ./mock-api
docker stack deploy -c poc.yaml poc
```

## Demo

### Stap 1 — basisgedrag tonen (cache miss)

```bash
curl http://localhost:8080/trip/1
```
verwacht:
- trage response (2 sec)
- log: `Cache miss`
- data komt van mock-api

### Stap 2 — edge case (cache werkt)

```bash
curl http://localhost:8080/trip/1
```
verwacht:
- snelle response (in ms)
- log: `Cache hit`
- data komt van Redis

### Stap 3 — faalscenario (externe API down)

```bash
docker service scale poc_mock-api=0
curl http://localhost:8080/trip/1
```
verwacht:
- data blijft beschickbaar via Redis cache


### Logs

```bash
docker service logs poc_travel-service
```
## Cache Strategy (TLL)
Deze POC gebruikt de TTL-strategie (Time To Live) in Redis.

- Elke cache entry is maar tijdelijk geldig
- TTL = 60 sec
- Daarna wordt de cache automatisch verwijderd

Dit voorkomt dat stale (verouderde) data permanent in de cache blijft.

## Resultaat
De POC toont aan dat caching:
- de responstijd verlaagt bij herhaalde requests
- de load op externe diensten vermindert
- het system blijft beschikbaar bij uitval van externe API's

## Cleanup
```bash
docker stack rm poc
```
