import { concurrencyError, ok, type ConcurrencyError, type Result } from "@broadway-ts/core";
import type {
  EventData,
  EventEnvelope,
  EventStore,
  ExpectedVersion,
} from "@broadway-ts/event-sourcing";

export class InMemoryEventStore implements EventStore {
  readonly #streams = new Map<string, EventEnvelope[]>();

  async append(
    streamId: string,
    events: readonly EventData[],
    expectedVersion: ExpectedVersion,
  ): Promise<Result<readonly EventEnvelope[], ConcurrencyError>> {
    if (events.length === 0) {
      return ok([]);
    }

    const stream = this.#streams.get(streamId) ?? [];
    const currentVersion = stream.length;

    if (!this.#matchesExpectedVersion(currentVersion, expectedVersion)) {
      return {
        ok: false,
        error: concurrencyError(expectedVersion, currentVersion),
      };
    }

    const appended = events.map((event, index) => ({
      ...event,
      streamId,
      streamVersion: currentVersion + index + 1,
    }));

    this.#streams.set(streamId, [...stream, ...appended]);
    return ok(appended);
  }

  async readStream(streamId: string): Promise<Result<readonly EventEnvelope[], never>> {
    return ok([...(this.#streams.get(streamId) ?? [])]);
  }

  #matchesExpectedVersion(currentVersion: number, expectedVersion: ExpectedVersion): boolean {
    if (expectedVersion === "any") {
      return true;
    }

    if (expectedVersion === "no_stream") {
      return currentVersion === 0;
    }

    if (expectedVersion === "stream_exists") {
      return currentVersion > 0;
    }

    return currentVersion === expectedVersion;
  }
}
