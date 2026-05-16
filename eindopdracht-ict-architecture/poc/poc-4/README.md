# POC 3 — PostgreSQL Concurrent Budget Updates

## Doel

Deze proof of concept onderzoekt hoe PostgreSQL transacties en locking-mechanismen gebruikt kunnen worden om consistente budgetdata te garanderen wanneer meerdere gebruikers gelijktijdig wijzigingen uitvoeren aan hetzelfde reisbudget.

De POC demonstreert hoe PostgreSQL race conditions en verloren updates voorkomt via transacties en row-level locking.

**Quality attributes:**
- Data Consistency
- Fault Tolerance

---

## Stack

- PostgreSQL 15
- Docker Swarm

---

## Run

```bash
docker stack deploy -c poc.yaml poc
```

Controleer of de service draait:

```bash
docker service ls
```

---

## Demo

### Stap 1 — open eerste databaseverbinding

Open een terminal en voer uit:

```bash
docker exec -it $(docker ps -q -f name=poc_db) psql -U postgres -d budgetdb
```

Start een transactie en voer een update uit:

```sql
BEGIN;

UPDATE budget
SET uitgegeven_budget = uitgegeven_budget + 100
WHERE id = 1;
```

Voer nog geen `COMMIT` uit.

---

### Stap 2 — open tweede databaseverbinding

Open een tweede terminal en voer opnieuw uit:

```bash
docker exec -it $(docker ps -q -f name=poc_db) psql -U postgres -d budgetdb
```

Voer een tweede update uit:

```sql
BEGIN;

UPDATE budget
SET uitgegeven_budget = uitgegeven_budget + 50
WHERE id = 1;
```

Deze query zal wachten totdat de eerste transactie afgerond is.

---

### Stap 3 — voltooi de eerste transactie

Ga terug naar terminal 1 en voer uit:

```sql
COMMIT;
```

Daarna zal de tweede transactie verder uitgevoerd worden.

---

## Resultaat

De tweede transactie wordt tijdelijk geblokkeerd totdat de eerste transactie afgerond is.

Hierdoor voorkomt PostgreSQL conflicterende gelijktijdige wijzigingen op hetzelfde budgetrecord.

Deze POC toont aan dat PostgreSQL transacties en row-level locking consistente gedeelde budgetdata kunnen garanderen binnen een collaboratieve reisapplicatie waarin meerdere gebruikers gelijktijdig hetzelfde reisbudget aanpassen.

---

## Cleanup

```bash
docker stack rm poc
```