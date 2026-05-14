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
docker stack deploy -f poc.yaml poc
```

## Demo
```bash
# Stap 1 — basisgedrag tonen (cache miss)
curl http://localhost:8080/trip/1

# Stap 2 — edge case (cache werkt)
curl http://localhost:8080/trip/1

# Stap 3 — faalscenario (externe API down)
docker service scale poc_mock-api=0
curl http://localhost:8080/trip/1

# Logs
docker service logs poc_travel-service
```

## Resultaat
De POC toont aan dat caching:
- de responstijd verlaagt bij herhaalde requests
- de load op externe diensten vermindert
- het system blijft beschikbaar bij uitval van externe API's

## Cleanup
```bash
docker stack rm poc
```
