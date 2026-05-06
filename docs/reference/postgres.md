# Postgres Reference

Package: `@broadway-ts/postgres`

This package is a placeholder for the future Postgres event store adapter.

Current exports:

```ts
type PostgresEventStoreOptions = {
  readonly tableName?: string;
};

const defaultPostgresEventsTableName = "broadway_events";
```

Planned adapter responsibilities:

- implement `EventStore`
- persist append-only event envelopes
- enforce optimistic concurrency with transaction-level guarantees
- support projection checkpoints
- expose migration SQL or migration helpers
