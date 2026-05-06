import type { ConcurrencyError, PersistenceError, Result } from "@broadway-ts/core";
import type { EventData, EventEnvelope } from "./events.js";

export type ExpectedVersion = number | "any" | "no_stream" | "stream_exists";

export type EventStoreAppendError = ConcurrencyError | PersistenceError;

export interface EventStore {
  append(
    streamId: string,
    events: readonly EventData[],
    expectedVersion: ExpectedVersion,
  ): Promise<Result<readonly EventEnvelope[], EventStoreAppendError>>;

  readStream(streamId: string): Promise<Result<readonly EventEnvelope[], PersistenceError>>;
}
