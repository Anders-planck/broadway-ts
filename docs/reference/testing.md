# Testing Reference

Package: `@broadway-ts/testing`

## InMemoryEventStore

Implements the `EventStore` contract in memory.

```ts
const eventStore = new InMemoryEventStore();
```

Supports:

- `append(streamId, events, expectedVersion)`
- `readStream(streamId)`
- numeric expected versions
- `"any"`
- `"no_stream"`
- `"stream_exists"`

## FixedClock

```ts
const clock = new FixedClock("2026-05-05T00:00:00.000Z");
clock.now();
```

Returns a copy of the configured `Date`.

## SequenceIdProvider

```ts
const ids = new SequenceIdProvider("event");
ids.nextId(); // "event-1"
```

## aggregateScenario

```ts
const scenario = aggregateScenario(Aggregate, "aggregate-1")
  .given(events)
  .when((aggregate) => aggregate.someAction());
```

Returns:

- `result`
- `pendingEvents`
- `aggregate`
