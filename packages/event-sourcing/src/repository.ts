import {
  ok,
  type ConcurrencyError,
  type PersistenceError,
  type Result,
} from "@broadway-ts/core";
import { EventSourcedAggregate } from "./aggregate.js";
import type { EventData, EventEnvelope, PendingEvent } from "./events.js";
import type { EventStore, ExpectedVersion } from "./event-store.js";
import type { Clock, IdProvider } from "./providers.js";

/** Constructor contract required by aggregate repositories. */
export type AggregateConstructor<TAggregate extends EventSourcedAggregate> = {
  readonly aggregateType: string;
  new (id: string): TAggregate;
};

/** Function that maps an aggregate type and id to an event stream id. */
export type StreamNameStrategy<TAggregate extends EventSourcedAggregate> = (
  Aggregate: AggregateConstructor<TAggregate>,
  aggregateId: string,
) => string;

/** Dependencies and options for an aggregate repository. */
export type AggregateRepositoryOptions<TAggregate extends EventSourcedAggregate> = {
  readonly eventStore: EventStore;
  readonly clock: Clock;
  readonly idProvider: IdProvider;
  readonly streamName?: StreamNameStrategy<TAggregate>;
};

/** Loads and saves event-sourced aggregates through an EventStore. */
export class AggregateRepository<TAggregate extends EventSourcedAggregate> {
  readonly #eventStore: EventStore;
  readonly #clock: Clock;
  readonly #idProvider: IdProvider;
  readonly #streamName: StreamNameStrategy<TAggregate>;

  constructor(options: AggregateRepositoryOptions<TAggregate>) {
    this.#eventStore = options.eventStore;
    this.#clock = options.clock;
    this.#idProvider = options.idProvider;
    this.#streamName =
      options.streamName ??
      ((Aggregate, aggregateId) => `${Aggregate.aggregateType}-${aggregateId}`);
  }

  /** Load an aggregate by replaying all events from its stream. */
  async load(
    Aggregate: AggregateConstructor<TAggregate>,
    aggregateId: string,
  ): Promise<Result<TAggregate, PersistenceError>> {
    const streamId = this.#streamName(Aggregate, aggregateId);
    const events = await this.#eventStore.readStream(streamId);

    if (!events.ok) {
      return events;
    }

    const aggregate = new Aggregate(aggregateId);
    aggregate.rehydrate(events.value);

    return ok(aggregate);
  }

  /** Append pending events and mark the aggregate committed on success. */
  async save(
    Aggregate: AggregateConstructor<TAggregate>,
    aggregate: TAggregate,
    expectedVersion: ExpectedVersion = aggregate.version,
    context: {
      readonly causationId?: string;
      readonly correlationId?: string;
    } = {},
  ): Promise<Result<readonly EventEnvelope[], ConcurrencyError | PersistenceError>> {
    if (aggregate.pendingEvents.length === 0) {
      return ok([]);
    }

    const streamId = this.#streamName(Aggregate, aggregate.id);
    const events = aggregate.pendingEvents.map((event) =>
      this.#toEventData(event, context),
    );

    const appended = await this.#eventStore.append(streamId, events, expectedVersion);

    if (appended.ok) {
      aggregate.markCommitted(appended.value);
    }

    return appended;
  }

  #toEventData(
    event: PendingEvent,
    context: {
      readonly causationId?: string;
      readonly correlationId?: string;
    },
  ): EventData {
    return {
      eventId: this.#idProvider.nextId(),
      type: event.type,
      version: event.version,
      ...(event.aggregateType === undefined ? {} : { aggregateType: event.aggregateType }),
      ...(event.aggregateId === undefined ? {} : { aggregateId: event.aggregateId }),
      payload: event.payload,
      metadata: event.metadata,
      ...(context.causationId === undefined ? {} : { causationId: context.causationId }),
      ...(context.correlationId === undefined
        ? {}
        : { correlationId: context.correlationId }),
      occurredAt: this.#clock.now(),
    };
  }
}
