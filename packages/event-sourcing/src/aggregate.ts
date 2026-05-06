import type {
  EventDefinition,
  EventEnvelope,
  EventPayloadOf,
  PendingEvent,
} from "./events.js";

export abstract class EventSourcedAggregate {
  static aggregateType = "aggregate";

  readonly id: string;
  #version = 0;
  #pendingEvents: PendingEvent[] = [];

  constructor(id: string) {
    this.id = id;
  }

  get version(): number {
    return this.#version;
  }

  get pendingEvents(): readonly PendingEvent[] {
    return this.#pendingEvents;
  }

  rehydrate(events: readonly EventEnvelope[]): void {
    for (const event of events) {
      this.apply(event);
      this.#version = event.streamVersion;
    }
    this.#pendingEvents = [];
  }

  markCommitted(events: readonly EventEnvelope[]): void {
    if (events.length > 0) {
      this.#version = events[events.length - 1]!.streamVersion;
    }
    this.#pendingEvents = [];
  }

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

  protected abstract apply(event: EventEnvelope | PendingEvent): void;
}
