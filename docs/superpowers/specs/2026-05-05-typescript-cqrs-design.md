# Broadway TS Design

## Purpose

Broadway TS is a TypeScript-first CQRS and Event Sourcing toolkit inspired by Broadway for PHP. It is a public npm library, not an application framework.

The project starts spec-first, then implements a minimal prototype that proves the public API before adding production adapters.

## Goals

- Provide a framework-agnostic CQRS core for TypeScript applications.
- Keep the core universal: Node.js, browsers, Edge runtimes, Deno, and Bun.
- Use schema-first command, query, and event definitions.
- Preserve TypeScript safety across handlers, buses, middleware, errors, and event payloads.
- Keep Event Sourcing optional through a separate package.
- Support public npm distribution with strict ESM packaging.
- Avoid hard dependencies on frameworks, databases, dependency injection containers, or Node built-ins in the core.

## Non-Goals

- Broadway TS will not be a full web framework.
- The core will not include database persistence.
- The core will not require Zod, Valibot, or any specific validation library.
- The first milestone will not include every production feature: snapshots, sagas, outbox, inbox, advanced subscriptions, and framework adapters come later.

## Repository Layout

```text
broadway-ts/
  docs/
    superpowers/
      specs/
        2026-05-05-typescript-cqrs-design.md
  packages/
    core/
    event-sourcing/
    zod/
    testing/
    postgres/
  examples/
    bank-account/
```

## Package Strategy

### `@broadway-ts/core`

Contains the CQRS foundation:

- command definitions
- query definitions
- command bus
- query bus
- handler registry
- typed middleware pipeline
- `Result<T, E>`
- discriminated error contracts
- Standard Schema-compatible validation abstraction
- clock and ID provider contracts

The package must remain framework-agnostic, database-agnostic, and free of Node-only APIs.

### `@broadway-ts/event-sourcing`

Adds Event Sourcing primitives:

- event definitions
- event envelopes
- expected version contract
- event store interface
- aggregate root
- aggregate repository
- stream naming strategy
- projector and subscription contracts

This package depends on `@broadway-ts/core`, but `@broadway-ts/core` must not depend on it.

### `@broadway-ts/zod`

Official Zod adapter:

- adapts Zod schemas to the core validation contract
- preserves payload inference
- maps Zod issues to Broadway TS validation issues

Zod remains optional. Users can provide any compatible schema adapter.

### `@broadway-ts/testing`

Testing utilities:

- command bus handler tests
- query bus handler tests
- aggregate scenario tests
- projector tests
- in-memory event store
- deterministic clock and ID providers

### `@broadway-ts/postgres`

Postgres adapter:

- event store implementation
- optimistic concurrency checks
- JSON payload and metadata persistence
- projection checkpoint storage

This package is not allowed to shape the core API. It implements contracts defined elsewhere.

## Tooling

- pnpm workspaces
- TypeScript strict mode
- ESM-only packages
- explicit `exports`
- tsup for builds
- Vitest for tests
- Changesets for release management

## Schema Contract

The core accepts schemas through a minimal Standard Schema-compatible contract. The exact adapter surface should be small:

```ts
type ParseResult<T> =
  | { ok: true; value: T }
  | { ok: false; issues: ValidationIssue[] };

interface Schema<T> {
  parse(input: unknown): ParseResult<T> | Promise<ParseResult<T>>;
}
```

Command, query, and event definitions infer payload types from their schema:

```ts
const DepositMoney = defineCommand({
  type: "bank.deposit-money",
  schema: depositMoneySchema,
});

const GetBalance = defineQuery({
  type: "bank.get-balance",
  schema: getBalanceSchema,
});
```

## Result Contract

Public APIs use explicit results instead of exceptions for normal control flow:

```ts
type Result<T, E = CqrsError> =
  | { ok: true; value: T }
  | { ok: false; error: E };
```

Handlers return `Result` values. Middleware and buses preserve that contract.

Unexpected runtime exceptions can still be caught by boundary middleware, but library APIs should model expected failures as typed errors.

## Error Contract

The core uses discriminated error objects:

```ts
type CqrsError =
  | ValidationError
  | HandlerNotFoundError
  | DomainError
  | ConcurrencyError
  | PersistenceError;
```

Every error has:

- `kind`
- `code`
- `message`
- optional structured details

Example:

```ts
type DomainError = {
  kind: "domain";
  code: string;
  message: string;
  details?: unknown;
};
```

Class-based errors may be supported by helpers or adapters, but the core representation is serializable data.

## Middleware

Command and query buses use typed middleware pipelines:

```ts
type CommandMiddleware<C, R, E> = (
  command: C,
  ctx: CommandContext,
  next: () => Promise<Result<R, E>>
) => Promise<Result<R, E>>;
```

Middleware supports:

- validation
- logging hooks
- tracing metadata
- authorization
- timeout and cancellation
- transaction boundaries through adapters

The core does not ship a dependency injection container. Handlers receive dependencies through explicit factories or external adapters.

## Event Definitions

Event definitions use `type` and `version`:

```ts
const MoneyDeposited = defineEvent({
  type: "bank.money-deposited",
  version: 1,
  schema: moneyDepositedSchema,
});
```

Versions are explicit to make event evolution visible and testable.

## Event Envelope

Persisted and published events use a complete envelope:

```ts
type EventEnvelope<TPayload, TMetadata = unknown> = {
  eventId: string;
  type: string;
  version: number;
  streamId: string;
  streamVersion: number;
  aggregateType?: string;
  aggregateId?: string;
  payload: TPayload;
  metadata: TMetadata;
  causationId?: string;
  correlationId?: string;
  occurredAt: Date;
};
```

The envelope supports aggregate streams, global projections, process managers, audit logs, retries, idempotency, and cross-service correlation.

## Expected Version

Event store appends use explicit optimistic concurrency semantics:

```ts
type ExpectedVersion =
  | number
  | "any"
  | "no_stream"
  | "stream_exists";
```

Semantics:

- `number`: append only if current stream version equals that number
- `"no_stream"`: append only if stream does not exist
- `"stream_exists"`: append only if stream exists
- `"any"`: append without concurrency checks

## Stream Naming

The low-level event store accepts explicit `streamId` values.

The aggregate repository provides a default stream naming strategy based on `aggregateType` and `aggregateId`, while allowing callers to override the strategy.

## Aggregate Model

Aggregates are provided by `@broadway-ts/event-sourcing`.

They:

- rehydrate from historical events
- record new events
- apply events to state
- expose pending events for repositories
- return `Result` values for domain failures

Example shape:

```ts
class BankAccount extends EventSourcedAggregate {
  static aggregateType = "bank-account";

  deposit(amount: number): Result<void, DomainError> {
    if (amount <= 0) {
      return err(domainError("bank.invalid_amount", "Amount must be positive"));
    }

    this.record(MoneyDeposited, {
      accountId: this.id,
      amount,
    });

    return ok(undefined);
  }
}
```

The exact aggregate API can evolve during prototype work, but it must keep domain failures explicit and typed.

## Runtime Model

The core and event-sourcing packages are universal:

- no direct `fs`
- no direct Node `crypto`
- no `Buffer`
- no process globals
- injected clock
- injected ID provider

Node, browser, Edge, Deno, and Bun support comes from avoiding runtime-specific APIs in shared packages.

## First Prototype Scope

The prototype should implement:

- workspace setup
- `@broadway-ts/core`
- `@broadway-ts/event-sourcing`
- `@broadway-ts/zod`
- `@broadway-ts/testing`
- a minimal `examples/bank-account`

The prototype should prove:

- schema-first command definition
- typed command handler
- command bus execution
- `Result` propagation
- discriminated errors
- event definition
- aggregate recording and rehydration
- in-memory event store
- aggregate scenario test

`@broadway-ts/postgres` can exist as an empty package shell during the prototype, but production persistence should wait until the core contracts are validated.

## Testing Strategy

Tests should cover behavior before internals:

- command bus dispatch and missing handler errors
- query bus dispatch and missing handler errors
- schema validation success and failure
- middleware ordering and short-circuit behavior
- aggregate rehydration
- aggregate pending events
- optimistic concurrency behavior in the in-memory event store
- Zod adapter issue mapping
- bank account example flow

Type-level tests should be added once the public API settles.

## Open Decisions

- Exact package scope if npm organization name changes from `@broadway-ts`.
- Whether the schema contract should directly implement Standard Schema or use a tiny local adapter compatible with it.
- Whether aggregate event application should use method naming conventions, explicit pattern matching, or registered appliers.
- Whether metadata should default to `{}` or require explicit metadata.
- Exact release versioning policy for pre-1.0 packages.

## Approval State

Approved direction:

- public npm library
- monorepo modular architecture
- schema-first API
- Standard Schema-compatible core
- official Zod adapter
- abstract CQRS core
- Event Sourcing as separate package
- explicit `Result` values
- discriminated core errors
- full event envelopes
- explicit stream IDs with repository defaults
- `ExpectedVersion` union
- typed middleware pipeline
- no DI container in core
- universal runtime target
- ESM-only
- pnpm workspaces, tsup, Vitest, Changesets
- spec-first plus prototype approach
- repository directory: `broadway-ts/`
