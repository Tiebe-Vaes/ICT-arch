# POC 4 — PostgreSQL concurrent budget updates

## Hypothese

Wanneer meerdere gebruikers gelijktijdig hetzelfde reisbudget aanpassen, kan een standaard
PostgreSQL-transactie zonder expliciete locking leiden tot een lost update: de tweede transactie
overschrijft de wijziging van de eerste. Een SELECT ... FOR UPDATE voorkomt dit door de rij te
vergrendelen totdat de eerste transactie afgerond is.

**Quality attributes:**
- Data Consistency
- Fault Tolerance

---

## Stack

- PostgreSQL 15
- Node.js 20 (pg driver)
- Docker Swarm

---

## Structuur

```
poc-03-db-locking/
  app/
    index.js        -- simuleert gelijktijdige budget-updates
    package.json
  Dockerfile
  init.sql          -- tabelstructuur en begindata
  poc.yaml          -- Swarm stack
  README.md
```

---

## Bouwen en opstarten

Bouw het image op een Swarm manager-node:

```bash
docker build -t poc-04-app .
```

Start de stack:

```bash
docker stack deploy -f poc.yaml poc
```

Controleer of beide services draaien:

```bash
docker service ls
```

---

## Demo

De app voert twee scenario's automatisch uit bij het opstarten.

Bekijk de output via:

```bash
docker service logs poc_app
```

### Scenario 1 — zonder FOR UPDATE (lost update)

Beide transacties lezen de beginwaarde (0) voordat een van beide schrijft.
Transactie B overschrijft de wijziging van transactie A.
Het resultaat is 50 of 100 in plaats van het correcte 150.

### Scenario 2 — met FOR UPDATE (correct)

De SELECT ... FOR UPDATE vergrendelt de rij na het lezen.
Transactie B wacht totdat transactie A gecommit heeft.
Het resultaat is altijd 150.

### Verwachte output

```
=== Scenario 1: without FOR UPDATE (lost update) ===
Starting value: 0
[User A] Read: 0
[User B] Read: 0
[User A] Write: 100
[User B] Write: 50
Result: 50
Expected: 150 -- Correct: false

=== Scenario 2: with FOR UPDATE (correct) ===
Starting value: 0
[User A] Read (locked): 0
[User A] Write: 100
[User B] Read (locked): 100
[User B] Write: 150
Result: 150
Expected: 150 -- Correct: true
```

---

## Conclusie

Een standaard transactie zonder expliciete locking volstaat niet voor gelijktijdige
budgetupdates. SELECT ... FOR UPDATE garandeert dat elke transactie de meest recente
waarde leest en dat updates niet verloren gaan.

---

## Cleanup

```bash
docker stack rm poc
```
