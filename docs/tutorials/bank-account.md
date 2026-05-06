# Bank Account Tutorial

This tutorial builds a small event-sourced command flow:

```txt
DepositMoney command
  -> CommandBus
  -> command handler
  -> AggregateRepository.load()
  -> BankAccount.deposit()
  -> AggregateRepository.save()
  -> InMemoryEventStore.append()
```

The complete source lives in
[`examples/bank-account`](https://github.com/Anders-planck/broadway-ts/tree/main/examples/bank-account).

## 1. Define Schemas

Broadway TS validates raw input before a handler runs.

```ts
import { zodSchema } from "@broadway-ts/zod";
import { z } from "zod";

const depositMoneySchema = zodSchema(
  z.object({
    accountId: z.string().min(1),
    amount: z.number().positive(),
  }),
);

const moneyDepositedSchema = zodSchema(
  z.object({
    accountId: z.string().min(1),
    amount: z.number().positive(),
  }),
);
```

## 2. Define the Command

```ts
import {
  defineCommand,
  type DomainError,
  typeToken,
} from "@broadway-ts/core";
import type { EventStoreAppendError } from "@broadway-ts/event-sourcing";

export const DepositMoney = defineCommand({
  type: "bank.deposit-money",
  schema: depositMoneySchema,
  result: typeToken<void>(),
  error: typeToken<DomainError | EventStoreAppendError>(),
});
```

The command result is `void`. The expected handler failures are domain errors
and event store append errors.

## 3. Define the Event

```ts
import { defineEvent } from "@broadway-ts/event-sourcing";

export const MoneyDeposited = defineEvent({
  type: "bank.money-deposited",
  version: 1,
  schema: moneyDepositedSchema,
});
```

Event type and version must stay stable. Add new versions instead of changing
payload meaning in place.

## 4. Implement the Aggregate

```ts
import {
  domainError,
  err,
  ok,
  type DomainError,
  type Result,
} from "@broadway-ts/core";
import {
  EventSourcedAggregate,
  type EventEnvelope,
  type PendingEvent,
} from "@broadway-ts/event-sourcing";

export class BankAccount extends EventSourcedAggregate {
  static override aggregateType = "bank-account";

  balance = 0;

  deposit(amount: number): Result<void, DomainError> {
    if (amount <= 0) {
      return err(
        domainError("bank.invalid_amount", "Amount must be positive", { amount }),
      );
    }

    this.record(MoneyDeposited, {
      accountId: this.id,
      amount,
    });

    return ok(undefined);
  }

  protected apply(event: EventEnvelope | PendingEvent): void {
    if (event.type === MoneyDeposited.type) {
      const payload = event.payload as { amount: number };
      this.balance += payload.amount;
    }
  }
}
```

`deposit` enforces business rules and records the event. `apply` mutates state
from both replayed envelopes and new pending events.

## 5. Write the Handler

```ts
import {
  ok,
  type CommandHandler,
} from "@broadway-ts/core";
import type { AggregateRepository } from "@broadway-ts/event-sourcing";

export const createDepositMoneyHandler = (
  repository: AggregateRepository<BankAccount>,
): CommandHandler<typeof DepositMoney> => async (command) => {
  const loaded = await repository.load(BankAccount, command.payload.accountId);

  if (!loaded.ok) {
    return loaded;
  }

  const deposited = loaded.value.deposit(command.payload.amount);

  if (!deposited.ok) {
    return deposited;
  }

  const saved = await repository.save(BankAccount, loaded.value);

  if (!saved.ok) {
    return saved;
  }

  return ok(undefined);
};
```

The handler does not know how events are stored. It only depends on the
repository contract.

## 6. Wire the Flow in a Test

```ts
import { describe, expect, it } from "vitest";
import { CommandBus, ok } from "@broadway-ts/core";
import { AggregateRepository } from "@broadway-ts/event-sourcing";
import {
  FixedClock,
  InMemoryEventStore,
  SequenceIdProvider,
} from "@broadway-ts/testing";

describe("bank account", () => {
  it("deposits money through command bus and aggregate", async () => {
    const repository = new AggregateRepository<BankAccount>({
      eventStore: new InMemoryEventStore(),
      clock: new FixedClock("2026-05-05T00:00:00.000Z"),
      idProvider: new SequenceIdProvider(),
    });
    const commandBus = new CommandBus();

    commandBus.register(DepositMoney, createDepositMoneyHandler(repository));

    const commandResult = await commandBus.execute(DepositMoney, {
      accountId: "account-1",
      amount: 50,
    });
    const loaded = await repository.load(BankAccount, "account-1");

    expect(commandResult).toEqual(ok(undefined));
    expect(loaded.ok).toBe(true);
    if (loaded.ok) {
      expect(loaded.value.balance).toBe(50);
      expect(loaded.value.version).toBe(1);
    }
  });
});
```

Run it:

```bash
pnpm --filter bank-account-example test
```

## What to Change in Production

- Replace `InMemoryEventStore` with a production `EventStore` adapter.
- Use real clock and ID providers.
- Pass causation and correlation IDs from the command context into
  `repository.save`.
- Store read models separately from the aggregate event stream.
