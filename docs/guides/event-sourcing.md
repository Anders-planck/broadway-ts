# Event Sourcing

`@broadway-ts/event-sourcing` provides the contracts for event definitions,
event envelopes, aggregate rehydration, optimistic concurrency, and repository
save/load flows.

## Define Events

```ts
import { defineEvent } from "@broadway-ts/event-sourcing";
import { zodSchema } from "@broadway-ts/zod";
import { z } from "zod";

export const MoneyDeposited = defineEvent({
  type: "bank.money-deposited",
  version: 1,
  schema: zodSchema(
    z.object({
      accountId: z.string().min(1),
      amount: z.number().positive(),
    }),
  ),
});
```

Event definitions carry a stable `type`, an integer schema `version`, and a
payload schema.

## Create an Aggregate

```ts
import {
  EventSourcedAggregate,
  type EventEnvelope,
  type PendingEvent,
} from "@broadway-ts/event-sourcing";
import { ok } from "@broadway-ts/core";
import { MoneyDeposited } from "./events.js";

export class BankAccount extends EventSourcedAggregate {
  static override aggregateType = "bank-account";

  balance = 0;

  deposit(amount: number) {
    if (amount <= 0) {
      return {
        ok: false,
        error: {
          kind: "domain",
          code: "bank.invalid_deposit_amount",
          message: "Deposit amount must be positive",
        },
      } as const;
    }

    this.record(MoneyDeposited, { accountId: this.id, amount });
    return ok(undefined);
  }

  protected apply(event: EventEnvelope | PendingEvent): void {
    if (event.type === MoneyDeposited.type) {
      this.balance += (event.payload as { amount: number }).amount;
    }
  }
}
```

`record` appends a pending event and applies it immediately. `rehydrate` applies
persisted envelopes and clears pending events.

## Save and Load

```ts
import { AggregateRepository } from "@broadway-ts/event-sourcing";
import {
  FixedClock,
  InMemoryEventStore,
  SequenceIdProvider,
} from "@broadway-ts/testing";
import { BankAccount } from "./bank-account.js";

const repository = new AggregateRepository<BankAccount>({
  eventStore: new InMemoryEventStore(),
  clock: new FixedClock("2026-05-05T00:00:00.000Z"),
  idProvider: new SequenceIdProvider(),
});

const loaded = await repository.load(BankAccount, "account-1");
if (!loaded.ok) {
  throw new Error(loaded.error.message);
}

loaded.value.deposit(50);

const saved = await repository.save(BankAccount, loaded.value);
if (!saved.ok) {
  console.error(saved.error.code);
}
```

By default the stream name is:

```ts
`${Aggregate.aggregateType}-${aggregateId}`
```

Override it when your storage naming convention differs:

```ts
const repository = new AggregateRepository<BankAccount>({
  eventStore,
  clock,
  idProvider,
  streamName: (Aggregate, aggregateId) =>
    `${Aggregate.aggregateType}:${aggregateId}`,
});
```

## Expected Versions

`ExpectedVersion` controls optimistic concurrency.

| Value | Meaning |
| --- | --- |
| `number` | stream must currently be exactly that version |
| `"any"` | append without version check |
| `"no_stream"` | stream must not exist |
| `"stream_exists"` | stream must already contain events |

For a brand-new aggregate, use `"no_stream"` when duplicate creation must fail:

```ts
await repository.save(BankAccount, aggregate, "no_stream");
```

## Causation and Correlation

Pass causation and correlation IDs through `save` to preserve trace context in
event envelopes:

```ts
await repository.save(BankAccount, aggregate, aggregate.version, {
  causationId: "command-123",
  correlationId: "request-123",
});
```
