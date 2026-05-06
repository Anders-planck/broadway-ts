# Testing

`@broadway-ts/testing` provides deterministic infrastructure for package and app
tests. It is intentionally small: an in-memory event store, fixed clock,
sequence ID provider, and aggregate scenario helper.

## In-Memory Event Store

```ts
import { InMemoryEventStore } from "@broadway-ts/testing";

const eventStore = new InMemoryEventStore();

const result = await eventStore.readStream("bank-account-account-1");
```

The store follows the same `EventStore` contract as production adapters. It
validates `ExpectedVersion`, assigns stream versions, and returns copied stream
arrays to tests.

## Deterministic Providers

```ts
import { FixedClock, SequenceIdProvider } from "@broadway-ts/testing";

const clock = new FixedClock("2026-05-05T00:00:00.000Z");
const ids = new SequenceIdProvider("event");

clock.now(); // Date("2026-05-05T00:00:00.000Z")
ids.nextId(); // "event-1"
ids.nextId(); // "event-2"
```

Use them with `AggregateRepository` when snapshots must be stable.

## Aggregate Scenarios

Use `aggregateScenario` for direct aggregate tests without a repository.

```ts
import { aggregateScenario } from "@broadway-ts/testing";
import { BankAccount } from "../src/bank-account.js";

const scenario = aggregateScenario(BankAccount, "account-1")
  .given([])
  .when((account) => account.deposit(50));

expect(scenario.result.ok).toBe(true);
expect(scenario.pendingEvents).toHaveLength(1);
expect(scenario.aggregate.balance).toBe(50);
```

The helper returns:

- `result`: whatever the aggregate action returned
- `pendingEvents`: a snapshot of newly recorded pending events
- `aggregate`: the mutated aggregate instance

## Type-Level Tests

Public API inference is covered with Vitest `expectTypeOf` assertions in package
test files:

```bash
pnpm typecheck
```

These assertions compile command/query definitions, event definitions, Zod
schemas, repositories, and testing helpers. `pnpm run ci` runs them through the
same typecheck step.
