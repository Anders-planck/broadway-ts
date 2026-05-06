export type PostgresEventStoreOptions = {
  readonly connectionString: string;
  readonly schemaName?: string;
  readonly eventsTableName?: string;
};

export const defaultPostgresEventsTableName = "broadway_events";
