# Architecture

Broadway TS is split into small packages so applications can adopt CQRS first,
then add event sourcing only when needed.

## Package Boundaries

```txt
@broadway-ts/core
  Result, errors, schema contract, command/query definitions, buses

@broadway-ts/event-sourcing
  event definitions, event envelopes, EventStore, aggregate base, repository

@broadway-ts/zod
  Zod adapter for Schema<T>

@broadway-ts/testing
  deterministic test infrastructure

@broadway-ts/postgres
  future production EventStore adapter
```

The core package does not depend on event sourcing. The event-sourcing package
depends on the core error and result types. Validation adapters depend on the
core schema contract.

## Runtime Flow

```txt
raw input
  -> schema.parse(input)
  -> typed command/query
  -> bus middleware
  -> registered handler
  -> Result<T, E>
```

With event sourcing:

```txt
handler
  -> repository.load(Aggregate, id)
  -> aggregate.rehydrate(events)
  -> aggregate method records pending events
  -> repository.save(Aggregate, aggregate, expectedVersion)
  -> eventStore.append(streamId, eventData, expectedVersion)
  -> aggregate.markCommitted(envelopes)
```

## What Broadway TS Does Not Own

Broadway TS intentionally avoids owning:

- HTTP routing
- dependency injection
- database connections
- serialization frameworks
- background workers
- framework-specific module systems

Applications should compose Broadway TS with their framework of choice.
