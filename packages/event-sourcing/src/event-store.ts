import type { ConcurrencyError, PersistenceError, Result } from "@broadway-ts/core";
import type { EventData, EventEnvelope } from "./events.js";

/** Expected stream version used to protect event appends from stale writes. */
export type ExpectedVersion = number | "any" | "no_stream" | "stream_exists";

/** Errors an event store append may return. */
export type EventStoreAppendError = ConcurrencyError | PersistenceError;

/** Append-only event storage contract used by aggregate repositories. */
export interface EventStore {
  append(
    streamId: string,
    events: readonly EventData[],
    expectedVersion: ExpectedVersion,
  ): Promise<Result<readonly EventEnvelope[], EventStoreAppendError>>;

  readStream(streamId: string): Promise<Result<readonly EventEnvelope[], PersistenceError>>;
}
