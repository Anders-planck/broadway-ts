import type {
  EventDefinition,
  EventEnvelope,
  EventPayloadOf,
  PendingEvent,
} from "./events.js";

/** Base class for aggregates that rebuild state from event streams. */
export abstract class EventSourcedAggregate {
  /** Logical aggregate type used by default stream naming and pending events. */
  static aggregateType = "aggregate";

  /** Aggregate identity. */
  readonly id: string;
  #version = 0;
  #pendingEvents: PendingEvent[] = [];

  constructor(id: string) {
    this.id = id;
  }

  /** Current persisted stream version after rehydration or commit. */
  get version(): number {
    return this.#version;
  }

  /** Events recorded by the aggregate but not yet committed. */
  get pendingEvents(): readonly PendingEvent[] {
    return this.#pendingEvents;
  }

  /** Rebuild aggregate state from persisted event envelopes. */
  rehydrate(events: readonly EventEnvelope[]): void {
    for (const event of events) {
      this.apply(event);
      this.#version = event.streamVersion;
    }
    this.#pendingEvents = [];
  }

  /** Mark pending events as committed and advance the aggregate version. */
  markCommitted(events: readonly EventEnvelope[]): void {
    if (events.length > 0) {
      this.#version = events[events.length - 1]!.streamVersion;
    }
    this.#pendingEvents = [];
  }

  /** Record a new pending event and apply it to current aggregate state. */
  protected record<TDefinition extends EventDefinition<string, number, unknown>>(
    definition: TDefinition,
    payload: EventPayloadOf<TDefinition>,
    metadata: Record<string, unknown> = {},
  ): void {
    const aggregateType = (this.constructor as typeof EventSourcedAggregate).aggregateType;
    const event: PendingEvent<EventPayloadOf<TDefinition>> = {
      type: definition.type,
      version: definition.version,
      aggregateType,
      aggregateId: this.id,
      payload,
      metadata,
    };

    this.#pendingEvents.push(event);
    this.apply(event);
  }

  /** Apply one persisted or pending event to aggregate state. */
  protected abstract apply(event: EventEnvelope | PendingEvent): void;
}
