/**
 * Placeholder exports for the future Broadway TS Postgres event store adapter.
 *
 * @packageDocumentation
 */

/** Options planned for the future Postgres event store adapter. */
export type PostgresEventStoreOptions = {
  readonly connectionString: string;
  readonly schemaName?: string;
  readonly eventsTableName?: string;
};

/** Default events table name for the future Postgres adapter. */
export const defaultPostgresEventsTableName = "broadway_events";
