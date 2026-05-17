# POC X — <naam>

Template voor een POC. Kopieer deze map, hernoem naar je POC-nummer en pas inhoud aan.

## Doel
Welke vraag beantwoordt deze POC? Welke quality attribute(s) bewijst hij?

**Quality attributes:** ...

## Stack
Korte opsomming van technologieën / containers.

## Run
Kies wat past bij je POC (lokaal, Compose of Swarm):

```bash
# lokaal
npm install && npm start

# of Docker Compose
docker compose up --build

# of Docker Swarm
docker stack deploy -c poc.yaml poc
```

## Demo
```bash
# Stap 1 — basisgedrag tonen
curl ...

# Stap 2 — edge case / faalscenario
...

# Stap 3 — verifieer gedrag
...
```

## Resultaat
Wat zou je moeten zien? Welke conclusie trek je?

## Cleanup
```bash
# afhankelijk van runtime
docker compose down -v
# of
docker stack rm poc
```
