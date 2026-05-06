import type {
  AggregateConstructor,
  EventEnvelope,
  EventSourcedAggregate,
  PendingEvent,
} from "@broadway-ts/event-sourcing";

export const aggregateScenario = <TAggregate extends EventSourcedAggregate>(
  Aggregate: AggregateConstructor<TAggregate>,
  aggregateId: string,
) => ({
  given(events: readonly EventEnvelope[]) {
    const aggregate = new Aggregate(aggregateId);
    aggregate.rehydrate(events);

    return {
      when(action: (aggregate: TAggregate) => unknown) {
        const result = action(aggregate);
        return {
          result,
          pendingEvents: aggregate.pendingEvents as readonly PendingEvent[],
          aggregate,
        };
      },
    };
  },
});
