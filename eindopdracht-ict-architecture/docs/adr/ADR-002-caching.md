# ADR-002 — Caching van externe reisgegevens

Formaat: MADR 3.0. Referentie: https://adr.github.io/madr/

## Status

Draft

## Context and Problem Statement

TODO — beschrijf het probleem rond trage externe hotel/vlucht-API's, herhaalde queries, beschikbaarheid wanneer externe diensten falen. Valideer met POC 2.

## Decision Drivers

1. Latency
2. Availability / Fault Tolerance bij externe API-uitval
3. Kost (minder externe API-calls)
4. Operationele complexiteit

## Considered Options

1. Geen cache (altijd live)
2. In-memory cache per backend-instance
3. Redis als gedeelde cache (gekozen, zie POC 2)
4. CDN / edge cache
5. Database materialized views

## Decision Outcome

TODO — gekozen optie en 2e keuze met motivatie.

## Pros and Cons of the Options

TODO

## Consequences

TODO

## Implementation Notes

TODO — TTL-strategie, cache-key-conventie, stale-while-revalidate, eviction.

## Related Decisions

- ADR-001 (Modulaire monoliet)

## Validation

POC 2 toont cache-miss, cache-hit en gracieus gedrag bij externe API-uitval.
