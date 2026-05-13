# POC 1 — Horizontale scaling met JWT

## Doel
Aantonen dat stateless JWT-auth horizontaal schaalt: 3 replicas achter een ingress, elke request landt op een willekeurige replica zonder sessie-affiniteit.

Quality attributes: Availability, Scalability.

## Run
```bash
docker stack deploy -f poc.yaml poc
```

## Demo
```bash
# 1. Login en ontvang JWT
curl -s -X POST http://localhost/login -d '{"user":"a"}' -H 'content-type: application/json'

# 2. Zelfde token, 10 requests, verschillende replicas
for i in {1..10}; do curl -s http://localhost/me -H "Authorization: Bearer <TOKEN>"; done

# 3. Bekijk welke replica antwoordde
docker service logs poc_app
```

## Resultaat
Verwacht: requests verdeeld over 3 replicas, allemaal 200 OK. Geen sticky sessions nodig.
