# ADR-004 — Keuze van database en concurrency-strategie

Formaat: MADR 3.0. Referentie: https://adr.github.io/madr/

## Status

Draft

## Context and Problem Statement

TODO — beschrijf de noodzaak van een transactionele primaire opslag voor gedeeld budget, concurrent updates, schema-evolutie. Valideer met POC 4.

## Decision Drivers

1. Data Consistency (ACID, locking)
2. Operationele complexiteit
3. Fault Tolerance via replicatie en backups
4. Migratiepad bij latere opsplitsing

## Considered Options

1. PostgreSQL (gekozen, zie POC 4)
2. MySQL / MariaDB
3. MongoDB (document)
4. Cassandra (eventual consistency)
5. CockroachDB (distributed SQL)
6. SQLite

## Decision Outcome

TODO — gekozen optie en 2e keuze met motivatie.

## Pros and Cons of the Options

TODO

## Consequences

TODO

## Implementation Notes

TODO — schema per module, connection pooling, `SELECT ... FOR UPDATE` voor budget-updates, outbox-tabel voor messaging, backup-strategie.

## Related Decisions

- ADR-001 (Modulaire monoliet)
- ADR-005 (Messaging / outbox)

## Validation

POC 4 bewijst dat row-level locking lost updates voorkomt bij concurrent budget-updates.
