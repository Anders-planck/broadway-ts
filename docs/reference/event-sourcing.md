# Event Sourcing Reference

Package: `@broadway-ts/event-sourcing`

## Event Definitions

```ts
const Event = defineEvent({
  type: "context.event-name",
  version: 1,
  schema,
});
```

Exports:

- `defineEvent`
- `parseEventPayload`
- `EventDefinition`
- `EventPayloadOf<TDefinition>`

## Event Data Types

- `PendingEvent`: event recorded by an aggregate before persistence
- `EventData`: event payload plus metadata ready for append
- `EventEnvelope`: persisted event with `streamId`, `streamVersion`, and
  occurrence data

## EventStore

```ts
type ExpectedVersion = number | "any" | "no_stream" | "stream_exists";

interface EventStore {
  append(
    streamId: string,
    events: readonly EventData[],
    expectedVersion: ExpectedVersion,
  ): Promise<Result<readonly EventEnvelope[], EventStoreAppendError>>;

  readStream(
    streamId: string,
  ): Promise<Result<readonly EventEnvelope[], PersistenceError>>;
}
```

## EventSourcedAggregate

Extend `EventSourcedAggregate` for domain aggregates.

Required:

- constructor inherited from base takes `id`
- static `aggregateType`
- protected `apply(event)` implementation

Main methods:

- `record(definition, payload, metadata?)`
- `rehydrate(events)`
- `markCommitted(events)`

Main properties:

- `id`
- `version`
- `pendingEvents`

## AggregateRepository

```ts
const repository = new AggregateRepository({
  eventStore,
  clock,
  idProvider,
  streamName,
});
```

Methods:

- `load(Aggregate, aggregateId)`
- `save(Aggregate, aggregate, expectedVersion?, context?)`

The default stream name is `${Aggregate.aggregateType}-${aggregateId}`.

## Type-Level Coverage

Event-sourcing inference is covered in
`packages/event-sourcing/test/type-inference.test.ts`.

Covered surfaces:

- `defineEvent`
- `EventPayloadOf<TDefinition>`
- event type and version literals
- `AggregateRepository.load`
- `AggregateRepository.save`

Run:

```bash
pnpm --filter @broadway-ts/event-sourcing typecheck
```
