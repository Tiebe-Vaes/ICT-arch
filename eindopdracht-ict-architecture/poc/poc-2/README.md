# POC X — <naam>

Template voor een POC. Kopieer deze map, hernoem naar je POC-nummer en pas inhoud aan.

## Doel
Welke vraag beantwoordt deze POC? Welke quality attribute(s) bewijst hij?

**Quality attributes:** ...

## Stack
Korte opsomming containers/images.

## Run
```bash
docker stack deploy -f poc.yaml poc
```

## Demo
```bash
# Stap 1 — basisgedrag tonen
curl ...

# Stap 2 — edge case / faalscenario
docker service scale ...

# Stap 3 — verifieer gedrag
docker service logs poc_<service>
```

## Resultaat
Wat zou je moeten zien? Welke conclusie trek je?

## Cleanup
```bash
docker stack rm poc
```
