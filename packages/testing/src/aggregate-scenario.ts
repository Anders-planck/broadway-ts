import type {
  AggregateConstructor,
  EventEnvelope,
  EventSourcedAggregate,
  PendingEvent,
} from "@broadway-ts/event-sourcing";

/** Build a direct aggregate test scenario from given events and one action. */
export const aggregateScenario = <TAggregate extends EventSourcedAggregate>(
  Aggregate: AggregateConstructor<TAggregate>,
  aggregateId: string,
) => ({
  given(events: readonly EventEnvelope[]) {
    const aggregate = new Aggregate(aggregateId);
    aggregate.rehydrate(events);

    return {
      when<TResult>(action: (aggregate: TAggregate) => TResult) {
        const result = action(aggregate);
        return {
          result,
          pendingEvents: [...aggregate.pendingEvents] as readonly PendingEvent[],
          aggregate,
        };
      },
    };
  },
});
