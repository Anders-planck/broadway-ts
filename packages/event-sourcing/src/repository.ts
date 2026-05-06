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

export type AggregateConstructor<TAggregate extends EventSourcedAggregate> = {
  readonly aggregateType: string;
  new (id: string): TAggregate;
};

export type StreamNameStrategy<TAggregate extends EventSourcedAggregate> = (
  Aggregate: AggregateConstructor<TAggregate>,
  aggregateId: string,
) => string;

export type AggregateRepositoryOptions<TAggregate extends EventSourcedAggregate> = {
  readonly eventStore: EventStore;
  readonly clock: Clock;
  readonly idProvider: IdProvider;
  readonly streamName?: StreamNameStrategy<TAggregate>;
};

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

  async save(
    Aggregate: AggregateConstructor<TAggregate>,
    aggregate: TAggregate,
    expectedVersion: ExpectedVersion = aggregate.version,
    context: {
      readonly causationId?: string;
      readonly correlationId?: string;
    } = {},
  ): Promise<Result<readonly EventEnvelope[], ConcurrencyError | PersistenceError>> {
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
