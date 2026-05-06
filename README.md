# Broadway TS

TypeScript-first CQRS and Event Sourcing toolkit inspired by Broadway for PHP.

Broadway TS is framework-agnostic. The core has no dependency on Node-only APIs,
web frameworks, databases, or dependency injection containers.

## Packages

| Package | Purpose |
| --- | --- |
| `@broadway-ts/core` | CQRS definitions, command/query buses, typed middleware, `Result`, errors, schema contract |
| `@broadway-ts/event-sourcing` | Event definitions, envelopes, aggregate base, event store contracts, aggregate repository |
| `@broadway-ts/zod` | Zod adapter for the core schema contract |
| `@broadway-ts/testing` | In-memory event store, deterministic providers, aggregate scenario helper |
| `@broadway-ts/postgres` | Postgres package shell for the future event store adapter |

## Status

Prototype. Public APIs are being validated before the first npm release.

## Install

Packages are not published yet. After the first release:

```bash
pnpm add @broadway-ts/core @broadway-ts/event-sourcing
pnpm add @broadway-ts/zod zod
```

## Quick Example

```ts
import {
  CommandBus,
  defineCommand,
  ok,
  typeToken,
} from "@broadway-ts/core";
import {
  AggregateRepository,
  EventSourcedAggregate,
  defineEvent,
  type EventEnvelope,
  type PendingEvent,
} from "@broadway-ts/event-sourcing";
import {
  FixedClock,
  InMemoryEventStore,
  SequenceIdProvider,
} from "@broadway-ts/testing";
import { zodSchema } from "@broadway-ts/zod";
import { z } from "zod";

const DepositMoney = defineCommand({
  type: "bank.deposit-money",
  schema: zodSchema(z.object({
    accountId: z.string().min(1),
    amount: z.number().positive(),
  })),
  result: typeToken<void>(),
});

const MoneyDeposited = defineEvent({
  type: "bank.money-deposited",
  version: 1,
  schema: zodSchema(z.object({
    accountId: z.string(),
    amount: z.number().positive(),
  })),
});

class BankAccount extends EventSourcedAggregate {
  static override aggregateType = "bank-account";

  balance = 0;

  deposit(amount: number) {
    this.record(MoneyDeposited, { accountId: this.id, amount });
    return ok(undefined);
  }

  protected apply(event: EventEnvelope | PendingEvent): void {
    if (event.type === MoneyDeposited.type) {
      this.balance += (event.payload as { amount: number }).amount;
    }
  }
}

const repository = new AggregateRepository<BankAccount>({
  eventStore: new InMemoryEventStore(),
  clock: new FixedClock("2026-05-05T00:00:00.000Z"),
  idProvider: new SequenceIdProvider(),
});

const commandBus = new CommandBus();

commandBus.register(DepositMoney, async (command) => {
  const loaded = await repository.load(BankAccount, command.payload.accountId);
  if (!loaded.ok) return loaded;

  const deposited = loaded.value.deposit(command.payload.amount);
  if (!deposited.ok) return deposited;

  const saved = await repository.save(BankAccount, loaded.value);
  if (!saved.ok) return saved;

  return ok(undefined);
});
```

See [`examples/bank-account`](examples/bank-account) for a complete flow.

## Documentation

The documentation site lives in [`docs`](docs).

```bash
pnpm docs:dev
pnpm docs:build
pnpm docs:preview
```

Current docs:

- [Getting Started](docs/getting-started.md)
- [Command and Query Bus](docs/guides/command-query-bus.md)
- [Event Sourcing](docs/guides/event-sourcing.md)
- [Testing](docs/guides/testing.md)
- [Reference](docs/reference/core.md)

## Development

```bash
pnpm install
pnpm test
pnpm typecheck
pnpm build
```

## Release

Changesets is configured, but npm publishing is not enabled until `NPM_TOKEN`
is added to repository secrets and the package scope is confirmed.

```bash
pnpm changeset
pnpm version-packages
pnpm release
```

## Roadmap

- Postgres event store implementation
- Projection checkpoints
- Event upcasting
- Outbox/inbox support
- Snapshot support
- Type-level tests
- Framework adapters

## License

MIT
