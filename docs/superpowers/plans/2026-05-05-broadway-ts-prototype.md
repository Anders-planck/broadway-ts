# Broadway TS Prototype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first Broadway TS prototype: framework-agnostic TypeScript CQRS core, optional Event Sourcing package, Zod adapter, testing helpers, and a bank account example.

**Architecture:** The monorepo uses strict ESM packages with `@broadway-ts/core` as the only foundation package. Event Sourcing, Zod, testing utilities, and Postgres contracts depend on core instead of shaping it.

**Tech Stack:** pnpm workspaces, TypeScript strict mode, tsup, Vitest, Changesets, Zod.

---

## File Structure

- Create: `package.json` root workspace scripts and shared dev tools.
- Create: `pnpm-workspace.yaml` workspace package globs.
- Create: `tsconfig.base.json` shared strict TypeScript config.
- Create: `.gitignore` generated files and dependencies.
- Create: `.changeset/config.json` Changesets config.
- Create: `packages/core/package.json` npm metadata for `@broadway-ts/core`.
- Create: `packages/core/tsconfig.json` package TS config.
- Create: `packages/core/src/result.ts` `Result`, `ok`, `err`, helpers.
- Create: `packages/core/src/errors.ts` serializable discriminated error contracts.
- Create: `packages/core/src/schema.ts` validation schema contract.
- Create: `packages/core/src/definition.ts` command/query definitions and parsing.
- Create: `packages/core/src/bus.ts` command/query buses, registries, middleware pipeline.
- Create: `packages/core/src/index.ts` public exports.
- Create: `packages/core/test/*.test.ts` core behavior tests.
- Create: `packages/zod/package.json` npm metadata for `@broadway-ts/zod`.
- Create: `packages/zod/tsconfig.json` package TS config.
- Create: `packages/zod/src/index.ts` Zod schema adapter.
- Create: `packages/zod/test/zod-schema.test.ts` adapter tests.
- Create: `packages/event-sourcing/package.json` npm metadata for `@broadway-ts/event-sourcing`.
- Create: `packages/event-sourcing/tsconfig.json` package TS config.
- Create: `packages/event-sourcing/src/events.ts` event definitions and envelope types.
- Create: `packages/event-sourcing/src/providers.ts` injected clock and ID providers.
- Create: `packages/event-sourcing/src/event-store.ts` event store contracts.
- Create: `packages/event-sourcing/src/aggregate.ts` event-sourced aggregate base.
- Create: `packages/event-sourcing/src/repository.ts` aggregate repository.
- Create: `packages/event-sourcing/src/index.ts` public exports.
- Create: `packages/event-sourcing/test/aggregate.test.ts` aggregate behavior tests.
- Create: `packages/testing/package.json` npm metadata for `@broadway-ts/testing`.
- Create: `packages/testing/tsconfig.json` package TS config.
- Create: `packages/testing/src/in-memory-event-store.ts` in-memory event store.
- Create: `packages/testing/src/providers.ts` deterministic test providers.
- Create: `packages/testing/src/aggregate-scenario.ts` aggregate scenario helper.
- Create: `packages/testing/src/index.ts` public exports.
- Create: `packages/testing/test/in-memory-event-store.test.ts` store concurrency tests.
- Create: `packages/postgres/package.json` npm metadata for `@broadway-ts/postgres`.
- Create: `packages/postgres/tsconfig.json` package TS config.
- Create: `packages/postgres/src/index.ts` Postgres option contracts.
- Create: `examples/bank-account/package.json` example metadata.
- Create: `examples/bank-account/tsconfig.json` example TS config.
- Create: `examples/bank-account/src/bank-account.ts` example domain, commands, events, handler.
- Create: `examples/bank-account/test/bank-account.test.ts` end-to-end example test.

---

### Task 1: Workspace Scaffold

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `tsconfig.base.json`
- Create: `.gitignore`
- Create: `.changeset/config.json`

- [ ] **Step 1: Create root package metadata**

Use this content for `package.json`:

```json
{
  "name": "broadway-ts",
  "private": true,
  "type": "module",
  "packageManager": "pnpm@9.15.0",
  "scripts": {
    "build": "pnpm -r build",
    "test": "pnpm -r test",
    "typecheck": "pnpm -r typecheck"
  },
  "devDependencies": {
    "@changesets/cli": "^2.27.12",
    "tsup": "^8.3.5",
    "typescript": "^5.7.3",
    "vitest": "^2.1.8"
  }
}
```

- [ ] **Step 2: Create workspace globs**

Use this content for `pnpm-workspace.yaml`:

```yaml
packages:
  - "packages/*"
  - "examples/*"
```

- [ ] **Step 3: Create shared TypeScript config**

Use this content for `tsconfig.base.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "skipLibCheck": true
  }
}
```

- [ ] **Step 4: Ignore generated files**

Use this content for `.gitignore`:

```gitignore
node_modules/
dist/
coverage/
.turbo/
*.tsbuildinfo
```

- [ ] **Step 5: Configure Changesets**

Use this content for `.changeset/config.json`:

```json
{
  "$schema": "https://unpkg.com/@changesets/config@3.1.1/schema.json",
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "fixed": [],
  "linked": [],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": []
}
```

- [ ] **Step 6: Install workspace dependencies**

Run:

```bash
pnpm install
```

Expected: command exits with status `0` and creates `pnpm-lock.yaml`.

- [ ] **Step 7: Commit workspace scaffold**

Run:

```bash
git add package.json pnpm-workspace.yaml tsconfig.base.json .gitignore .changeset/config.json pnpm-lock.yaml
git commit -m "chore: scaffold workspace"
```

Expected: commit succeeds.

---

### Task 2: Core Result, Errors, and Schema Contracts

**Files:**
- Create: `packages/core/package.json`
- Create: `packages/core/tsconfig.json`
- Create: `packages/core/src/result.ts`
- Create: `packages/core/src/errors.ts`
- Create: `packages/core/src/schema.ts`
- Create: `packages/core/src/index.ts`
- Create: `packages/core/test/result-error-schema.test.ts`

- [ ] **Step 1: Create the failing core foundation test**

Use this content for `packages/core/test/result-error-schema.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  domainError,
  err,
  handlerNotFoundError,
  isErr,
  isOk,
  ok,
  type Schema,
  unknownSchema,
  validationError,
} from "../src/index.js";

describe("core foundations", () => {
  it("creates explicit ok and err results", () => {
    const success = ok(42);
    const failure = err(domainError("bank.invalid_amount", "Amount must be positive"));

    expect(isOk(success)).toBe(true);
    expect(success.value).toBe(42);
    expect(isErr(failure)).toBe(true);
    expect(failure.error.kind).toBe("domain");
  });

  it("creates serializable validation and handler errors", () => {
    const validation = validationError([
      { path: ["amount"], message: "Expected positive number", code: "too_small" },
    ]);
    const missingHandler = handlerNotFoundError("command", "bank.deposit-money");

    expect(validation.kind).toBe("validation");
    expect(validation.code).toBe("validation.invalid_payload");
    expect(validation.issues[0]?.path).toEqual(["amount"]);
    expect(missingHandler.kind).toBe("handler_not_found");
    expect(missingHandler.message).toContain("bank.deposit-money");
  });

  it("accepts unknown payloads through unknownSchema", async () => {
    const parsed = await unknownSchema.parse({ value: 1 });

    expect(parsed).toEqual(ok({ value: 1 }));
  });

  it("returns schema validation failures with issues", async () => {
    const rejectingSchema: Schema<number> = {
      parse() {
        return {
          ok: false,
          issues: [{ path: ["amount"], message: "Expected number", code: "invalid_type" }],
        };
      },
    };

    const parsed = await rejectingSchema.parse("not-a-number");

    expect(parsed).toEqual({
      ok: false,
      issues: [{ path: ["amount"], message: "Expected number", code: "invalid_type" }],
    });
    if (!parsed.ok) {
      expect(parsed.issues[0]?.path).toEqual(["amount"]);
    }
  });
});
```

- [ ] **Step 2: Run the failing test**

Run:

```bash
pnpm --filter @broadway-ts/core test -- result-error-schema
```

Expected: FAIL because `@broadway-ts/core` does not exist yet.

- [ ] **Step 3: Add core package metadata**

Use this content for `packages/core/package.json`:

```json
{
  "name": "@broadway-ts/core",
  "version": "0.0.0",
  "type": "module",
  "description": "Framework-agnostic CQRS core for Broadway TS.",
  "sideEffects": false,
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsup src/index.ts --format esm --dts --clean",
    "test": "vitest run",
    "typecheck": "tsc -p tsconfig.json --noEmit"
  }
}
```

Use this content for `packages/core/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": ".",
    "outDir": "dist"
  },
  "include": ["src", "test"]
}
```

- [ ] **Step 4: Implement Result helpers**

Use this content for `packages/core/src/result.ts`:

```ts
import type { CqrsError } from "./errors.js";

export type Awaitable<T> = T | Promise<T>;

export type Ok<T> = {
  readonly ok: true;
  readonly value: T;
};

export type Err<E> = {
  readonly ok: false;
  readonly error: E;
};

export type Result<T, E = CqrsError> = Ok<T> | Err<E>;

export const ok = <T>(value: T): Ok<T> => ({ ok: true, value });

export const err = <E>(error: E): Err<E> => ({ ok: false, error });

export const isOk = <T, E>(result: Result<T, E>): result is Ok<T> => result.ok;

export const isErr = <T, E>(result: Result<T, E>): result is Err<E> => !result.ok;
```

- [ ] **Step 5: Implement serializable errors**

Use this content for `packages/core/src/errors.ts`:

```ts
export type ValidationIssue = {
  readonly path: readonly (string | number)[];
  readonly message: string;
  readonly code?: string;
};

export type ValidationError = {
  readonly kind: "validation";
  readonly code: "validation.invalid_payload";
  readonly message: string;
  readonly issues: readonly ValidationIssue[];
};

export type HandlerNotFoundError = {
  readonly kind: "handler_not_found";
  readonly code: "handler.not_found";
  readonly message: string;
  readonly handlerType: "command" | "query";
  readonly messageType: string;
};

export type DomainError = {
  readonly kind: "domain";
  readonly code: string;
  readonly message: string;
  readonly details?: unknown;
};

export type ConcurrencyError = {
  readonly kind: "concurrency";
  readonly code: "event_store.concurrency_conflict";
  readonly message: string;
  readonly expectedVersion?: number | string;
  readonly actualVersion?: number;
};

export type PersistenceError = {
  readonly kind: "persistence";
  readonly code: string;
  readonly message: string;
  readonly cause?: unknown;
};

export type CqrsError =
  | ValidationError
  | HandlerNotFoundError
  | DomainError
  | ConcurrencyError
  | PersistenceError;

export const validationError = (issues: readonly ValidationIssue[]): ValidationError => ({
  kind: "validation",
  code: "validation.invalid_payload",
  message: "Payload validation failed",
  issues,
});

export const handlerNotFoundError = (
  handlerType: "command" | "query",
  messageType: string,
): HandlerNotFoundError => ({
  kind: "handler_not_found",
  code: "handler.not_found",
  message: `No ${handlerType} handler registered for ${messageType}`,
  handlerType,
  messageType,
});

export const domainError = (
  code: string,
  message: string,
  details?: unknown,
): DomainError => ({
  kind: "domain",
  code,
  message,
  ...(details === undefined ? {} : { details }),
});

export const concurrencyError = (
  expectedVersion: number | string,
  actualVersion?: number,
): ConcurrencyError => ({
  kind: "concurrency",
  code: "event_store.concurrency_conflict",
  message: "Event stream concurrency conflict",
  expectedVersion,
  ...(actualVersion === undefined ? {} : { actualVersion }),
});

export const persistenceError = (
  code: string,
  message: string,
  cause?: unknown,
): PersistenceError => ({
  kind: "persistence",
  code,
  message,
  ...(cause === undefined ? {} : { cause }),
});
```

- [ ] **Step 6: Implement schema contract**

Use this content for `packages/core/src/schema.ts`:

```ts
import type { ValidationIssue } from "./errors.js";
import { ok, type Awaitable, type Ok } from "./result.js";

export type ParseFailure = {
  readonly ok: false;
  readonly issues: readonly ValidationIssue[];
};

export type ParseResult<T> = Ok<T> | ParseFailure;

export interface Schema<T> {
  parse(input: unknown): Awaitable<ParseResult<T>>;
}

export type InferSchema<TSchema> = TSchema extends Schema<infer TValue> ? TValue : never;

export const unknownSchema: Schema<unknown> = {
  parse(input: unknown) {
    return ok(input);
  },
};
```

- [ ] **Step 7: Export core foundation modules**

Use this content for `packages/core/src/index.ts`:

```ts
export * from "./result.js";
export * from "./errors.js";
export * from "./schema.js";
```

- [ ] **Step 8: Run core foundation test**

Run:

```bash
pnpm --filter @broadway-ts/core test -- result-error-schema
```

Expected: PASS for `core foundations`.

- [ ] **Step 9: Commit core foundation**

Run:

```bash
git add packages/core
git commit -m "feat(core): add result error and schema contracts"
```

Expected: commit succeeds.

---

### Task 3: Core Command and Query Definitions

**Files:**
- Create: `packages/core/src/definition.ts`
- Create: `packages/core/test/definition.test.ts`
- Modify: `packages/core/src/index.ts`

- [ ] **Step 1: Create the failing definition test**

Use this content for `packages/core/test/definition.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  defineCommand,
  defineQuery,
  ok,
  parseCommand,
  parseQuery,
  typeToken,
  type Schema,
} from "../src/index.js";

const numberSchema: Schema<number> = {
  parse(input) {
    return typeof input === "number"
      ? ok(input)
      : {
          ok: false,
          issues: [{ path: [], message: "Expected number", code: "invalid_type" }],
        };
  },
};

describe("message definitions", () => {
  it("defines and parses typed commands", async () => {
    const DepositMoney = defineCommand({
      type: "bank.deposit-money",
      schema: numberSchema,
      result: typeToken<void>(),
    });

    const parsed = await parseCommand(DepositMoney, 50);

    expect(parsed).toEqual(ok({ type: "bank.deposit-money", payload: 50 }));
  });

  it("defines and parses typed queries", async () => {
    const GetBalance = defineQuery({
      type: "bank.get-balance",
      schema: numberSchema,
      result: typeToken<number>(),
    });

    const parsed = await parseQuery(GetBalance, 123);

    expect(parsed).toEqual(ok({ type: "bank.get-balance", payload: 123 }));
  });

  it("maps schema issues into validation errors", async () => {
    const DepositMoney = defineCommand({
      type: "bank.deposit-money",
      schema: numberSchema,
    });

    const parsed = await parseCommand(DepositMoney, "50");

    expect(parsed.ok).toBe(false);
    if (!parsed.ok) {
      expect(parsed.error.kind).toBe("validation");
      expect(parsed.error.issues[0]?.code).toBe("invalid_type");
    }
  });
});
```

- [ ] **Step 2: Run the failing definition test**

Run:

```bash
pnpm --filter @broadway-ts/core test -- definition
```

Expected: FAIL because `defineCommand` and `defineQuery` are not exported.

- [ ] **Step 3: Implement definitions**

Use this content for `packages/core/src/definition.ts`:

```ts
import { err, ok, type Result } from "./result.js";
import { validationError, type CqrsError, type ValidationError } from "./errors.js";
import type { InferSchema, Schema } from "./schema.js";

export type TypeToken<T> = {
  readonly __type?: T;
};

export const typeToken = <T>(): TypeToken<T> => ({});

type TokenValue<TToken, TFallback> = TToken extends TypeToken<infer TValue>
  ? TValue
  : TFallback;

export type MessageDefinition<
  TKind extends "command" | "query",
  TType extends string,
  TPayload,
  TResult = unknown,
  TError extends CqrsError = CqrsError,
> = {
  readonly kind: TKind;
  readonly type: TType;
  readonly schema: Schema<TPayload>;
  readonly result?: TypeToken<TResult>;
  readonly error?: TypeToken<TError>;
};

export type CommandDefinition<
  TType extends string,
  TPayload,
  TResult = unknown,
  TError extends CqrsError = CqrsError,
> = MessageDefinition<"command", TType, TPayload, TResult, TError>;

export type QueryDefinition<
  TType extends string,
  TPayload,
  TResult = unknown,
  TError extends CqrsError = CqrsError,
> = MessageDefinition<"query", TType, TPayload, TResult, TError>;

export type PayloadOf<TDefinition> =
  TDefinition extends MessageDefinition<"command" | "query", string, infer TPayload, unknown, CqrsError>
    ? TPayload
    : never;

export type ResultOf<TDefinition> =
  TDefinition extends MessageDefinition<"command" | "query", string, unknown, infer TResult, CqrsError>
    ? TResult
    : never;

export type ErrorOf<TDefinition> =
  TDefinition extends MessageDefinition<"command" | "query", string, unknown, unknown, infer TError>
    ? TError
    : never;

export type MessageOf<TDefinition extends MessageDefinition<"command" | "query", string, unknown, unknown, CqrsError>> = {
  readonly type: TDefinition["type"];
  readonly payload: PayloadOf<TDefinition>;
};

export type CommandOf<TDefinition extends CommandDefinition<string, unknown, unknown, CqrsError>> =
  MessageOf<TDefinition>;

export type QueryOf<TDefinition extends QueryDefinition<string, unknown, unknown, CqrsError>> =
  MessageOf<TDefinition>;

export const defineCommand = <
  const TType extends string,
  TSchema extends Schema<unknown>,
  TResultToken extends TypeToken<unknown> | undefined = undefined,
  TErrorToken extends TypeToken<CqrsError> | undefined = undefined,
>(config: {
  readonly type: TType;
  readonly schema: TSchema;
  readonly result?: TResultToken;
  readonly error?: TErrorToken;
}): CommandDefinition<
  TType,
  InferSchema<TSchema>,
  TokenValue<TResultToken, unknown>,
  TokenValue<TErrorToken, CqrsError> & CqrsError
> => ({
  kind: "command",
  type: config.type,
  schema: config.schema as Schema<InferSchema<TSchema>>,
  result: config.result,
  error: config.error,
});

export const defineQuery = <
  const TType extends string,
  TSchema extends Schema<unknown>,
  TResultToken extends TypeToken<unknown> | undefined = undefined,
  TErrorToken extends TypeToken<CqrsError> | undefined = undefined,
>(config: {
  readonly type: TType;
  readonly schema: TSchema;
  readonly result?: TResultToken;
  readonly error?: TErrorToken;
}): QueryDefinition<
  TType,
  InferSchema<TSchema>,
  TokenValue<TResultToken, unknown>,
  TokenValue<TErrorToken, CqrsError> & CqrsError
> => ({
  kind: "query",
  type: config.type,
  schema: config.schema as Schema<InferSchema<TSchema>>,
  result: config.result,
  error: config.error,
});

const parseMessage = async <
  TDefinition extends MessageDefinition<"command" | "query", string, unknown, unknown, CqrsError>,
>(
  definition: TDefinition,
  input: unknown,
): Promise<Result<MessageOf<TDefinition>, ValidationError>> => {
  const parsed = await definition.schema.parse(input);

  if (!parsed.ok) {
    return err(validationError(parsed.issues));
  }

  return ok({
    type: definition.type,
    payload: parsed.value,
  } as MessageOf<TDefinition>);
};

export const parseCommand = <
  TDefinition extends CommandDefinition<string, unknown, unknown, CqrsError>,
>(
  definition: TDefinition,
  input: unknown,
): Promise<Result<CommandOf<TDefinition>, ValidationError>> => parseMessage(definition, input);

export const parseQuery = <
  TDefinition extends QueryDefinition<string, unknown, unknown, CqrsError>,
>(
  definition: TDefinition,
  input: unknown,
): Promise<Result<QueryOf<TDefinition>, ValidationError>> => parseMessage(definition, input);
```

- [ ] **Step 4: Export definitions**

Update `packages/core/src/index.ts` to:

```ts
export * from "./result.js";
export * from "./errors.js";
export * from "./schema.js";
export * from "./definition.js";
```

- [ ] **Step 5: Run definition tests**

Run:

```bash
pnpm --filter @broadway-ts/core test -- definition
```

Expected: PASS for `message definitions`.

- [ ] **Step 6: Run typecheck**

Run:

```bash
pnpm --filter @broadway-ts/core typecheck
```

Expected: PASS.

- [ ] **Step 7: Commit definitions**

Run:

```bash
git add packages/core
git commit -m "feat(core): add command and query definitions"
```

Expected: commit succeeds.

---

### Task 4: Core Buses and Typed Middleware

**Files:**
- Create: `packages/core/src/bus.ts`
- Create: `packages/core/test/bus.test.ts`
- Modify: `packages/core/src/index.ts`

- [ ] **Step 1: Create the failing bus test**

Use this content for `packages/core/test/bus.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  CommandBus,
  QueryBus,
  defineCommand,
  defineQuery,
  ok,
  typeToken,
  type DomainError,
  type Schema,
} from "../src/index.js";

const stringSchema: Schema<string> = {
  parse(input) {
    return typeof input === "string"
      ? ok(input)
      : {
          ok: false,
          issues: [{ path: [], message: "Expected string", code: "invalid_type" }],
        };
  },
};

const DepositMoney = defineCommand({
  type: "bank.deposit-money",
  schema: stringSchema,
  result: typeToken<void>(),
  error: typeToken<DomainError>(),
});

const GetBalance = defineQuery({
  type: "bank.get-balance",
  schema: stringSchema,
  result: typeToken<number>(),
});

describe("buses", () => {
  it("executes command handlers through middleware in order", async () => {
    const calls: string[] = [];
    const bus = new CommandBus();

    bus.use(async (_command, _ctx, next) => {
      calls.push("before");
      const result = await next();
      calls.push("after");
      return result;
    });

    bus.register(DepositMoney, async (command) => {
      calls.push(command.payload);
      return ok(undefined);
    });

    const result = await bus.execute(DepositMoney, "handler");

    expect(result).toEqual(ok(undefined));
    expect(calls).toEqual(["before", "handler", "after"]);
  });

  it("returns validation errors before handler execution", async () => {
    const bus = new CommandBus();
    let handled = false;

    bus.register(DepositMoney, async () => {
      handled = true;
      return ok(undefined);
    });

    const result = await bus.execute(DepositMoney, 123);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe("validation");
    }
    expect(handled).toBe(false);
  });

  it("returns handler_not_found for missing command handlers", async () => {
    const bus = new CommandBus();
    const result = await bus.execute(DepositMoney, "account-1");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe("handler_not_found");
      expect(result.error.handlerType).toBe("command");
    }
  });

  it("executes query handlers", async () => {
    const bus = new QueryBus();

    bus.register(GetBalance, async () => ok(100));

    const result = await bus.execute(GetBalance, "account-1");

    expect(result).toEqual(ok(100));
  });
});
```

- [ ] **Step 2: Run the failing bus test**

Run:

```bash
pnpm --filter @broadway-ts/core test -- bus
```

Expected: FAIL because `CommandBus` and `QueryBus` are not exported.

- [ ] **Step 3: Implement buses and middleware**

Use this content for `packages/core/src/bus.ts`:

```ts
import {
  handlerNotFoundError,
  type CqrsError,
  type HandlerNotFoundError,
  type ValidationError,
} from "./errors.js";
import {
  parseCommand,
  parseQuery,
  type CommandDefinition,
  type CommandOf,
  type ErrorOf,
  type QueryDefinition,
  type QueryOf,
  type ResultOf,
} from "./definition.js";
import { err, type Awaitable, type Result } from "./result.js";

export type BusContext = {
  readonly correlationId?: string;
  readonly causationId?: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
  readonly signal?: AbortSignal;
};

export type CommandHandler<
  TDefinition extends CommandDefinition<string, unknown, unknown, CqrsError>,
  TContext extends BusContext = BusContext,
> = (
  command: CommandOf<TDefinition>,
  ctx: TContext,
) => Awaitable<Result<ResultOf<TDefinition>, ErrorOf<TDefinition>>>;

export type QueryHandler<
  TDefinition extends QueryDefinition<string, unknown, unknown, CqrsError>,
  TContext extends BusContext = BusContext,
> = (
  query: QueryOf<TDefinition>,
  ctx: TContext,
) => Awaitable<Result<ResultOf<TDefinition>, ErrorOf<TDefinition>>>;

export type CommandMiddleware<
  TDefinition extends CommandDefinition<string, unknown, unknown, CqrsError>,
  TContext extends BusContext = BusContext,
> = (
  command: CommandOf<TDefinition>,
  ctx: TContext,
  next: () => Promise<Result<ResultOf<TDefinition>, ErrorOf<TDefinition> | CqrsError>>,
) => Awaitable<Result<ResultOf<TDefinition>, ErrorOf<TDefinition> | CqrsError>>;

export type QueryMiddleware<
  TDefinition extends QueryDefinition<string, unknown, unknown, CqrsError>,
  TContext extends BusContext = BusContext,
> = (
  query: QueryOf<TDefinition>,
  ctx: TContext,
  next: () => Promise<Result<ResultOf<TDefinition>, ErrorOf<TDefinition> | CqrsError>>,
) => Awaitable<Result<ResultOf<TDefinition>, ErrorOf<TDefinition> | CqrsError>>;

type AnyCommandHandler<TContext extends BusContext> = (
  command: CommandOf<CommandDefinition<string, unknown, unknown, CqrsError>>,
  ctx: TContext,
) => Promise<Result<unknown, CqrsError>>;

type AnyQueryHandler<TContext extends BusContext> = (
  query: QueryOf<QueryDefinition<string, unknown, unknown, CqrsError>>,
  ctx: TContext,
) => Promise<Result<unknown, CqrsError>>;

type AnyCommandMiddleware<TContext extends BusContext> = (
  command: CommandOf<CommandDefinition<string, unknown, unknown, CqrsError>>,
  ctx: TContext,
  next: () => Promise<Result<unknown, CqrsError>>,
) => Promise<Result<unknown, CqrsError>>;

type AnyQueryMiddleware<TContext extends BusContext> = (
  query: QueryOf<QueryDefinition<string, unknown, unknown, CqrsError>>,
  ctx: TContext,
  next: () => Promise<Result<unknown, CqrsError>>,
) => Promise<Result<unknown, CqrsError>>;

type BusError<TDefinition> = ErrorOf<TDefinition> | ValidationError | HandlerNotFoundError | CqrsError;

export class CommandBus<TContext extends BusContext = BusContext> {
  readonly #handlers = new Map<string, AnyCommandHandler<TContext>>();
  readonly #middleware: AnyCommandMiddleware<TContext>[] = [];

  register<TDefinition extends CommandDefinition<string, unknown, unknown, CqrsError>>(
    definition: TDefinition,
    handler: CommandHandler<TDefinition, TContext>,
  ): this {
    this.#handlers.set(definition.type, async (command, ctx) =>
      handler(command as CommandOf<TDefinition>, ctx),
    );
    return this;
  }

  use<TDefinition extends CommandDefinition<string, unknown, unknown, CqrsError>>(
    middleware: CommandMiddleware<TDefinition, TContext>,
  ): this {
    this.#middleware.push(async (command, ctx, next) =>
      middleware(command as CommandOf<TDefinition>, ctx, next),
    );
    return this;
  }

  async execute<TDefinition extends CommandDefinition<string, unknown, unknown, CqrsError>>(
    definition: TDefinition,
    input: unknown,
    ctx = {} as TContext,
  ): Promise<Result<ResultOf<TDefinition>, BusError<TDefinition>>> {
    const parsed = await parseCommand(definition, input);

    if (!parsed.ok) {
      return err(parsed.error);
    }

    const handler = this.#handlers.get(definition.type);

    if (!handler) {
      return err(handlerNotFoundError("command", definition.type));
    }

    const invokeHandler = () => handler(parsed.value, ctx);
    const pipeline = this.#middleware.reduceRight(
      (next, middleware) => () => middleware(parsed.value, ctx, next),
      invokeHandler,
    );

    const result = await pipeline();
    return result as Result<ResultOf<TDefinition>, BusError<TDefinition>>;
  }
}

export class QueryBus<TContext extends BusContext = BusContext> {
  readonly #handlers = new Map<string, AnyQueryHandler<TContext>>();
  readonly #middleware: AnyQueryMiddleware<TContext>[] = [];

  register<TDefinition extends QueryDefinition<string, unknown, unknown, CqrsError>>(
    definition: TDefinition,
    handler: QueryHandler<TDefinition, TContext>,
  ): this {
    this.#handlers.set(definition.type, async (query, ctx) =>
      handler(query as QueryOf<TDefinition>, ctx),
    );
    return this;
  }

  use<TDefinition extends QueryDefinition<string, unknown, unknown, CqrsError>>(
    middleware: QueryMiddleware<TDefinition, TContext>,
  ): this {
    this.#middleware.push(async (query, ctx, next) =>
      middleware(query as QueryOf<TDefinition>, ctx, next),
    );
    return this;
  }

  async execute<TDefinition extends QueryDefinition<string, unknown, unknown, CqrsError>>(
    definition: TDefinition,
    input: unknown,
    ctx = {} as TContext,
  ): Promise<Result<ResultOf<TDefinition>, BusError<TDefinition>>> {
    const parsed = await parseQuery(definition, input);

    if (!parsed.ok) {
      return err(parsed.error);
    }

    const handler = this.#handlers.get(definition.type);

    if (!handler) {
      return err(handlerNotFoundError("query", definition.type));
    }

    const invokeHandler = () => handler(parsed.value, ctx);
    const pipeline = this.#middleware.reduceRight(
      (next, middleware) => () => middleware(parsed.value, ctx, next),
      invokeHandler,
    );

    const result = await pipeline();
    return result as Result<ResultOf<TDefinition>, BusError<TDefinition>>;
  }
}
```

- [ ] **Step 4: Export bus APIs**

Update `packages/core/src/index.ts` to:

```ts
export * from "./result.js";
export * from "./errors.js";
export * from "./schema.js";
export * from "./definition.js";
export * from "./bus.js";
```

- [ ] **Step 5: Run core tests**

Run:

```bash
pnpm --filter @broadway-ts/core test
```

Expected: PASS for core tests.

- [ ] **Step 6: Run core typecheck**

Run:

```bash
pnpm --filter @broadway-ts/core typecheck
```

Expected: PASS.

- [ ] **Step 7: Commit buses**

Run:

```bash
git add packages/core
git commit -m "feat(core): add command and query buses"
```

Expected: commit succeeds.

---

### Task 5: Zod Adapter

**Files:**
- Create: `packages/zod/package.json`
- Create: `packages/zod/tsconfig.json`
- Create: `packages/zod/src/index.ts`
- Create: `packages/zod/test/zod-schema.test.ts`

- [ ] **Step 1: Create the failing Zod adapter test**

Use this content for `packages/zod/test/zod-schema.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { zodSchema } from "../src/index.js";

describe("zodSchema", () => {
  it("parses valid payloads", async () => {
    const schema = zodSchema(z.object({ amount: z.number().positive() }));

    const result = await schema.parse({ amount: 10 });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.amount).toBe(10);
    }
  });

  it("maps Zod issues to Broadway validation issues", async () => {
    const schema = zodSchema(z.object({ amount: z.number().positive() }));

    const result = await schema.parse({ amount: -1 });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues[0]?.path).toEqual(["amount"]);
      expect(result.issues[0]?.code).toBe("too_small");
    }
  });
});
```

- [ ] **Step 2: Run the failing Zod adapter test**

Run:

```bash
pnpm --filter @broadway-ts/zod test
```

Expected: FAIL because `@broadway-ts/zod` does not exist yet.

- [ ] **Step 3: Add package metadata**

Use this content for `packages/zod/package.json`:

```json
{
  "name": "@broadway-ts/zod",
  "version": "0.0.0",
  "type": "module",
  "description": "Zod adapter for Broadway TS schemas.",
  "sideEffects": false,
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsup src/index.ts --format esm --dts --clean",
    "test": "vitest run",
    "typecheck": "tsc -p tsconfig.json --noEmit"
  },
  "peerDependencies": {
    "@broadway-ts/core": "workspace:*",
    "zod": "^3.25.0"
  },
  "devDependencies": {
    "@broadway-ts/core": "workspace:*",
    "zod": "^3.25.0"
  }
}
```

Use this content for `packages/zod/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": ".",
    "outDir": "dist"
  },
  "include": ["src", "test"]
}
```

- [ ] **Step 4: Implement the adapter**

Use this content for `packages/zod/src/index.ts`:

```ts
import { ok, type Schema, type ValidationIssue } from "@broadway-ts/core";
import type { z, ZodTypeAny } from "zod";

export const zodSchema = <TSchema extends ZodTypeAny>(
  schema: TSchema,
): Schema<z.infer<TSchema>> => ({
  parse(input: unknown) {
    const result = schema.safeParse(input);

    if (result.success) {
      return ok(result.data);
    }

    const issues: ValidationIssue[] = result.error.issues.map((issue) => ({
      path: issue.path.map((segment) =>
        typeof segment === "number" ? segment : String(segment),
      ),
      message: issue.message,
      code: issue.code,
    }));

    return { ok: false, issues };
  },
});
```

- [ ] **Step 5: Install workspace after adding Zod package**

Run:

```bash
pnpm install
```

Expected: command exits with status `0` and updates `pnpm-lock.yaml`.

- [ ] **Step 6: Run Zod tests**

Run:

```bash
pnpm --filter @broadway-ts/zod test
```

Expected: PASS for `zodSchema`.

- [ ] **Step 7: Run Zod typecheck**

Run:

```bash
pnpm --filter @broadway-ts/zod typecheck
```

Expected: PASS.

- [ ] **Step 8: Commit Zod adapter**

Run:

```bash
git add packages/zod pnpm-lock.yaml
git commit -m "feat(zod): add schema adapter"
```

Expected: commit succeeds.

---

### Task 6: Event Sourcing Package

**Files:**
- Create: `packages/event-sourcing/package.json`
- Create: `packages/event-sourcing/tsconfig.json`
- Create: `packages/event-sourcing/src/events.ts`
- Create: `packages/event-sourcing/src/providers.ts`
- Create: `packages/event-sourcing/src/event-store.ts`
- Create: `packages/event-sourcing/src/aggregate.ts`
- Create: `packages/event-sourcing/src/repository.ts`
- Create: `packages/event-sourcing/src/index.ts`
- Create: `packages/event-sourcing/test/aggregate.test.ts`

- [ ] **Step 1: Create the failing aggregate test**

Use this content for `packages/event-sourcing/test/aggregate.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { domainError, ok, type DomainError, type Result, type Schema } from "@broadway-ts/core";
import {
  defineEvent,
  EventSourcedAggregate,
  type EventEnvelope,
  type PendingEvent,
} from "../src/index.js";

type Deposited = { accountId: string; amount: number };

const depositedSchema: Schema<Deposited> = {
  parse(input) {
    const value = input as Deposited;
    return typeof value.accountId === "string" && typeof value.amount === "number"
      ? ok(value)
      : {
          ok: false,
          issues: [{ path: [], message: "Invalid deposited event" }],
        };
  },
};

const MoneyDeposited = defineEvent({
  type: "bank.money-deposited",
  version: 1,
  schema: depositedSchema,
});

class BankAccount extends EventSourcedAggregate {
  static aggregateType = "bank-account";
  balance = 0;

  deposit(amount: number): Result<void, DomainError> {
    if (amount <= 0) {
      return {
        ok: false,
        error: domainError("bank.invalid_amount", "Amount must be positive"),
      };
    }

    this.record(MoneyDeposited, { accountId: this.id, amount });
    return ok(undefined);
  }

  protected apply(event: EventEnvelope | PendingEvent): void {
    if (event.type === MoneyDeposited.type) {
      this.balance += (event.payload as Deposited).amount;
    }
  }
}

describe("EventSourcedAggregate", () => {
  it("records pending events and applies state changes", () => {
    const account = new BankAccount("account-1");

    const result = account.deposit(50);

    expect(result).toEqual(ok(undefined));
    expect(account.balance).toBe(50);
    expect(account.version).toBe(0);
    expect(account.pendingEvents).toEqual([
      {
        type: "bank.money-deposited",
        version: 1,
        aggregateType: "bank-account",
        aggregateId: "account-1",
        payload: { accountId: "account-1", amount: 50 },
        metadata: {},
      },
    ]);
  });

  it("rehydrates from historical event envelopes", () => {
    const account = new BankAccount("account-1");

    account.rehydrate([
      {
        eventId: "event-1",
        type: "bank.money-deposited",
        version: 1,
        streamId: "bank-account-account-1",
        streamVersion: 1,
        aggregateType: "bank-account",
        aggregateId: "account-1",
        payload: { accountId: "account-1", amount: 25 },
        metadata: {},
        occurredAt: new Date("2026-05-05T00:00:00.000Z"),
      },
    ]);

    expect(account.balance).toBe(25);
    expect(account.version).toBe(1);
    expect(account.pendingEvents).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the failing aggregate test**

Run:

```bash
pnpm --filter @broadway-ts/event-sourcing test -- aggregate
```

Expected: FAIL because `@broadway-ts/event-sourcing` does not exist yet.

- [ ] **Step 3: Add package metadata**

Use this content for `packages/event-sourcing/package.json`:

```json
{
  "name": "@broadway-ts/event-sourcing",
  "version": "0.0.0",
  "type": "module",
  "description": "Event Sourcing primitives for Broadway TS.",
  "sideEffects": false,
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsup src/index.ts --format esm --dts --clean",
    "test": "vitest run",
    "typecheck": "tsc -p tsconfig.json --noEmit"
  },
  "dependencies": {
    "@broadway-ts/core": "workspace:*"
  }
}
```

Use this content for `packages/event-sourcing/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": ".",
    "outDir": "dist"
  },
  "include": ["src", "test"]
}
```

- [ ] **Step 4: Implement event definitions and envelopes**

Use this content for `packages/event-sourcing/src/events.ts`:

```ts
import {
  err,
  ok,
  validationError,
  type InferSchema,
  type Result,
  type Schema,
  type ValidationError,
} from "@broadway-ts/core";

export type EventDefinition<
  TType extends string,
  TVersion extends number,
  TPayload,
> = {
  readonly type: TType;
  readonly version: TVersion;
  readonly schema: Schema<TPayload>;
};

export type EventPayloadOf<TDefinition> =
  TDefinition extends EventDefinition<string, number, infer TPayload> ? TPayload : never;

export type EventEnvelope<TPayload = unknown, TMetadata = Record<string, unknown>> = {
  readonly eventId: string;
  readonly type: string;
  readonly version: number;
  readonly streamId: string;
  readonly streamVersion: number;
  readonly aggregateType?: string;
  readonly aggregateId?: string;
  readonly payload: TPayload;
  readonly metadata: TMetadata;
  readonly causationId?: string;
  readonly correlationId?: string;
  readonly occurredAt: Date;
};

export type PendingEvent<TPayload = unknown, TMetadata = Record<string, unknown>> = {
  readonly type: string;
  readonly version: number;
  readonly aggregateType?: string;
  readonly aggregateId?: string;
  readonly payload: TPayload;
  readonly metadata: TMetadata;
};

export type EventData<TPayload = unknown, TMetadata = Record<string, unknown>> = Omit<
  EventEnvelope<TPayload, TMetadata>,
  "streamId" | "streamVersion"
>;

export const defineEvent = <
  const TType extends string,
  const TVersion extends number,
  TSchema extends Schema<unknown>,
>(config: {
  readonly type: TType;
  readonly version: TVersion;
  readonly schema: TSchema;
}): EventDefinition<TType, TVersion, InferSchema<TSchema>> => ({
  type: config.type,
  version: config.version,
  schema: config.schema as Schema<InferSchema<TSchema>>,
});

export const parseEventPayload = async <
  TDefinition extends EventDefinition<string, number, unknown>,
>(
  definition: TDefinition,
  input: unknown,
): Promise<Result<EventPayloadOf<TDefinition>, ValidationError>> => {
  const parsed = await definition.schema.parse(input);

  if (!parsed.ok) {
    return err(validationError(parsed.issues));
  }

  return ok(parsed.value as EventPayloadOf<TDefinition>);
};
```

- [ ] **Step 5: Implement runtime providers**

Use this content for `packages/event-sourcing/src/providers.ts`:

```ts
export type Clock = {
  now(): Date;
};

export type IdProvider = {
  nextId(): string;
};

export const systemClock: Clock = {
  now() {
    return new Date();
  },
};
```

- [ ] **Step 6: Implement event store contracts**

Use this content for `packages/event-sourcing/src/event-store.ts`:

```ts
import type {
  ConcurrencyError,
  PersistenceError,
  Result,
} from "@broadway-ts/core";
import type { EventData, EventEnvelope } from "./events.js";

export type ExpectedVersion = number | "any" | "no_stream" | "stream_exists";

export type EventStoreAppendError = ConcurrencyError | PersistenceError;

export interface EventStore {
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

- [ ] **Step 7: Implement aggregate base**

Use this content for `packages/event-sourcing/src/aggregate.ts`:

```ts
import type { EventDefinition, EventEnvelope, EventPayloadOf, PendingEvent } from "./events.js";

export abstract class EventSourcedAggregate {
  static aggregateType = "aggregate";

  readonly id: string;
  #version = 0;
  #pendingEvents: PendingEvent[] = [];

  protected constructor(id: string) {
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
```

- [ ] **Step 8: Implement aggregate repository**

Use this content for `packages/event-sourcing/src/repository.ts`:

```ts
import {
  ok,
  type ConcurrencyError,
  type PersistenceError,
  type Result,
} from "@broadway-ts/core";
import type { EventData, EventEnvelope } from "./events.js";
import type { EventStore, ExpectedVersion } from "./event-store.js";
import { EventSourcedAggregate } from "./aggregate.js";
import type { Clock, IdProvider } from "./providers.js";

export type AggregateConstructor<TAggregate extends EventSourcedAggregate> = {
  readonly aggregateType: string;
  new (id: string): TAggregate;
};

export type StreamNameStrategy<TAggregate extends EventSourcedAggregate> = (
  Aggregate: AggregateConstructor<TAggregate>,
  aggregateId: string,
) => string;

export type AggregateRepositoryOptions<TAggregate extends EventSourcedAggregate> = {
  readonly eventStore: EventStore;
  readonly clock: Clock;
  readonly idProvider: IdProvider;
  readonly streamName?: StreamNameStrategy<TAggregate>;
};

export class AggregateRepository<TAggregate extends EventSourcedAggregate> {
  readonly #eventStore: EventStore;
  readonly #clock: Clock;
  readonly #idProvider: IdProvider;
  readonly #streamName: StreamNameStrategy<TAggregate>;

  constructor(options: AggregateRepositoryOptions<TAggregate>) {
    this.#eventStore = options.eventStore;
    this.#clock = options.clock;
    this.#idProvider = options.idProvider;
    this.#streamName =
      options.streamName ??
      ((Aggregate, aggregateId) => `${Aggregate.aggregateType}-${aggregateId}`);
  }

  async load(
    Aggregate: AggregateConstructor<TAggregate>,
    aggregateId: string,
  ): Promise<Result<TAggregate, PersistenceError>> {
    const streamId = this.#streamName(Aggregate, aggregateId);
    const events = await this.#eventStore.readStream(streamId);

    if (!events.ok) {
      return events;
    }

    const aggregate = new Aggregate(aggregateId);
    aggregate.rehydrate(events.value);

    return ok(aggregate);
  }

  async save(
    Aggregate: AggregateConstructor<TAggregate>,
    aggregate: TAggregate,
    expectedVersion: ExpectedVersion = aggregate.version,
    context: {
      readonly causationId?: string;
      readonly correlationId?: string;
    } = {},
  ): Promise<Result<readonly EventEnvelope[], ConcurrencyError | PersistenceError>> {
    const streamId = this.#streamName(Aggregate, aggregate.id);
    const events: EventData[] = aggregate.pendingEvents.map((event) => ({
      eventId: this.#idProvider.nextId(),
      type: event.type,
      version: event.version,
      aggregateType: event.aggregateType,
      aggregateId: event.aggregateId,
      payload: event.payload,
      metadata: event.metadata,
      causationId: context.causationId,
      correlationId: context.correlationId,
      occurredAt: this.#clock.now(),
    }));

    const appended = await this.#eventStore.append(streamId, events, expectedVersion);

    if (appended.ok) {
      aggregate.markCommitted(appended.value);
    }

    return appended;
  }
}
```

- [ ] **Step 9: Export Event Sourcing APIs**

Use this content for `packages/event-sourcing/src/index.ts`:

```ts
export * from "./events.js";
export * from "./providers.js";
export * from "./event-store.js";
export * from "./aggregate.js";
export * from "./repository.js";
```

- [ ] **Step 10: Install workspace after adding Event Sourcing package**

Run:

```bash
pnpm install
```

Expected: command exits with status `0`.

- [ ] **Step 11: Run Event Sourcing tests**

Run:

```bash
pnpm --filter @broadway-ts/event-sourcing test
```

Expected: PASS for `EventSourcedAggregate`.

- [ ] **Step 12: Run Event Sourcing typecheck**

Run:

```bash
pnpm --filter @broadway-ts/event-sourcing typecheck
```

Expected: PASS.

- [ ] **Step 13: Commit Event Sourcing package**

Run:

```bash
git add packages/event-sourcing pnpm-lock.yaml
git commit -m "feat(event-sourcing): add aggregate and event contracts"
```

Expected: commit succeeds.

---

### Task 7: Testing Package

**Files:**
- Create: `packages/testing/package.json`
- Create: `packages/testing/tsconfig.json`
- Create: `packages/testing/src/in-memory-event-store.ts`
- Create: `packages/testing/src/providers.ts`
- Create: `packages/testing/src/aggregate-scenario.ts`
- Create: `packages/testing/src/index.ts`
- Create: `packages/testing/test/in-memory-event-store.test.ts`

- [ ] **Step 1: Create the failing in-memory event store test**

Use this content for `packages/testing/test/in-memory-event-store.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { ok } from "@broadway-ts/core";
import type { EventData } from "@broadway-ts/event-sourcing";
import { InMemoryEventStore } from "../src/index.js";

const event = (eventId: string): EventData => ({
  eventId,
  type: "bank.money-deposited",
  version: 1,
  aggregateType: "bank-account",
  aggregateId: "account-1",
  payload: { amount: 10 },
  metadata: {},
  occurredAt: new Date("2026-05-05T00:00:00.000Z"),
});

describe("InMemoryEventStore", () => {
  it("appends events with stream versions", async () => {
    const store = new InMemoryEventStore();

    const appended = await store.append("bank-account-account-1", [event("event-1")], "no_stream");
    const stream = await store.readStream("bank-account-account-1");

    expect(appended.ok).toBe(true);
    expect(stream).toEqual(
      ok([
        {
          ...event("event-1"),
          streamId: "bank-account-account-1",
          streamVersion: 1,
        },
      ]),
    );
  });

  it("rejects conflicting expected versions", async () => {
    const store = new InMemoryEventStore();

    await store.append("bank-account-account-1", [event("event-1")], "no_stream");
    const conflict = await store.append("bank-account-account-1", [event("event-2")], "no_stream");

    expect(conflict.ok).toBe(false);
    if (!conflict.ok) {
      expect(conflict.error.kind).toBe("concurrency");
      expect(conflict.error.actualVersion).toBe(1);
    }
  });
});
```

- [ ] **Step 2: Run the failing testing package test**

Run:

```bash
pnpm --filter @broadway-ts/testing test
```

Expected: FAIL because `@broadway-ts/testing` does not exist yet.

- [ ] **Step 3: Add testing package metadata**

Use this content for `packages/testing/package.json`:

```json
{
  "name": "@broadway-ts/testing",
  "version": "0.0.0",
  "type": "module",
  "description": "Testing helpers for Broadway TS.",
  "sideEffects": false,
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsup src/index.ts --format esm --dts --clean",
    "test": "vitest run",
    "typecheck": "tsc -p tsconfig.json --noEmit"
  },
  "dependencies": {
    "@broadway-ts/core": "workspace:*",
    "@broadway-ts/event-sourcing": "workspace:*"
  }
}
```

Use this content for `packages/testing/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": ".",
    "outDir": "dist"
  },
  "include": ["src", "test"]
}
```

- [ ] **Step 4: Implement in-memory event store**

Use this content for `packages/testing/src/in-memory-event-store.ts`:

```ts
import { concurrencyError, ok, type Result } from "@broadway-ts/core";
import type {
  EventData,
  EventEnvelope,
  EventStore,
  EventStoreAppendError,
  ExpectedVersion,
} from "@broadway-ts/event-sourcing";

export class InMemoryEventStore implements EventStore {
  readonly #streams = new Map<string, EventEnvelope[]>();

  async append(
    streamId: string,
    events: readonly EventData[],
    expectedVersion: ExpectedVersion,
  ): Promise<Result<readonly EventEnvelope[], EventStoreAppendError>> {
    const stream = this.#streams.get(streamId) ?? [];
    const currentVersion = stream.length;

    if (!this.#matchesExpectedVersion(currentVersion, expectedVersion)) {
      return {
        ok: false,
        error: concurrencyError(expectedVersion, currentVersion),
      };
    }

    const appended = events.map((event, index) => ({
      ...event,
      streamId,
      streamVersion: currentVersion + index + 1,
    }));

    this.#streams.set(streamId, [...stream, ...appended]);
    return ok(appended);
  }

  async readStream(streamId: string): Promise<Result<readonly EventEnvelope[], never>> {
    return ok([...(this.#streams.get(streamId) ?? [])]);
  }

  #matchesExpectedVersion(currentVersion: number, expectedVersion: ExpectedVersion): boolean {
    if (expectedVersion === "any") {
      return true;
    }

    if (expectedVersion === "no_stream") {
      return currentVersion === 0;
    }

    if (expectedVersion === "stream_exists") {
      return currentVersion > 0;
    }

    return currentVersion === expectedVersion;
  }
}
```

- [ ] **Step 5: Implement deterministic providers**

Use this content for `packages/testing/src/providers.ts`:

```ts
import type { Clock, IdProvider } from "@broadway-ts/event-sourcing";

export class FixedClock implements Clock {
  readonly #date: Date;

  constructor(date: Date | string) {
    this.#date = typeof date === "string" ? new Date(date) : date;
  }

  now(): Date {
    return new Date(this.#date);
  }
}

export class SequenceIdProvider implements IdProvider {
  #next = 1;
  readonly #prefix: string;

  constructor(prefix = "event") {
    this.#prefix = prefix;
  }

  nextId(): string {
    const value = `${this.#prefix}-${this.#next}`;
    this.#next += 1;
    return value;
  }
}
```

- [ ] **Step 6: Implement aggregate scenario helper**

Use this content for `packages/testing/src/aggregate-scenario.ts`:

```ts
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
```

- [ ] **Step 7: Export testing APIs**

Use this content for `packages/testing/src/index.ts`:

```ts
export * from "./in-memory-event-store.js";
export * from "./providers.js";
export * from "./aggregate-scenario.js";
```

- [ ] **Step 8: Install workspace after adding testing package**

Run:

```bash
pnpm install
```

Expected: command exits with status `0`.

- [ ] **Step 9: Run testing package tests**

Run:

```bash
pnpm --filter @broadway-ts/testing test
```

Expected: PASS for `InMemoryEventStore`.

- [ ] **Step 10: Run testing package typecheck**

Run:

```bash
pnpm --filter @broadway-ts/testing typecheck
```

Expected: PASS.

- [ ] **Step 11: Commit testing package**

Run:

```bash
git add packages/testing pnpm-lock.yaml
git commit -m "feat(testing): add in-memory event store"
```

Expected: commit succeeds.

---

### Task 8: Bank Account Example

**Files:**
- Create: `examples/bank-account/package.json`
- Create: `examples/bank-account/tsconfig.json`
- Create: `examples/bank-account/src/bank-account.ts`
- Create: `examples/bank-account/test/bank-account.test.ts`

- [ ] **Step 1: Create the failing example test**

Use this content for `examples/bank-account/test/bank-account.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { CommandBus, ok } from "@broadway-ts/core";
import {
  AggregateRepository,
} from "@broadway-ts/event-sourcing";
import {
  FixedClock,
  InMemoryEventStore,
  SequenceIdProvider,
} from "@broadway-ts/testing";
import {
  BankAccount,
  DepositMoney,
  createDepositMoneyHandler,
} from "../src/bank-account.js";

describe("bank account example", () => {
  it("deposits money through command bus and event-sourced aggregate", async () => {
    const eventStore = new InMemoryEventStore();
    const repository = new AggregateRepository<BankAccount>({
      eventStore,
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

- [ ] **Step 2: Run the failing example test**

Run:

```bash
pnpm --filter bank-account-example test
```

Expected: FAIL because `bank-account-example` does not exist yet.

- [ ] **Step 3: Add example metadata**

Use this content for `examples/bank-account/package.json`:

```json
{
  "name": "bank-account-example",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "vitest run",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "build": "tsc -p tsconfig.json --noEmit"
  },
  "dependencies": {
    "@broadway-ts/core": "workspace:*",
    "@broadway-ts/event-sourcing": "workspace:*",
    "@broadway-ts/testing": "workspace:*",
    "@broadway-ts/zod": "workspace:*",
    "zod": "^3.25.0"
  }
}
```

Use this content for `examples/bank-account/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": ".",
    "outDir": "dist"
  },
  "include": ["src", "test"]
}
```

- [ ] **Step 4: Implement bank account domain**

Use this content for `examples/bank-account/src/bank-account.ts`:

```ts
import {
  defineCommand,
  domainError,
  err,
  ok,
  type CommandHandler,
  type DomainError,
  type Result,
  typeToken,
} from "@broadway-ts/core";
import {
  defineEvent,
  EventSourcedAggregate,
  type AggregateRepository,
  type EventEnvelope,
  type EventStoreAppendError,
  type PendingEvent,
} from "@broadway-ts/event-sourcing";
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

export const DepositMoney = defineCommand({
  type: "bank.deposit-money",
  schema: depositMoneySchema,
  result: typeToken<void>(),
  error: typeToken<DomainError | EventStoreAppendError>(),
});

export const MoneyDeposited = defineEvent({
  type: "bank.money-deposited",
  version: 1,
  schema: moneyDepositedSchema,
});

export class BankAccount extends EventSourcedAggregate {
  static aggregateType = "bank-account";
  balance = 0;

  deposit(amount: number): Result<void, DomainError> {
    if (amount <= 0) {
      return err(domainError("bank.invalid_amount", "Amount must be positive", { amount }));
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

- [ ] **Step 5: Install workspace after adding example**

Run:

```bash
pnpm install
```

Expected: command exits with status `0`.

- [ ] **Step 6: Run example test**

Run:

```bash
pnpm --filter bank-account-example test
```

Expected: PASS for `bank account example`.

- [ ] **Step 7: Run example typecheck**

Run:

```bash
pnpm --filter bank-account-example typecheck
```

Expected: PASS.

- [ ] **Step 8: Commit example**

Run:

```bash
git add examples/bank-account pnpm-lock.yaml
git commit -m "test(example): add bank account flow"
```

Expected: commit succeeds.

---

### Task 9: Postgres Package Shell

**Files:**
- Create: `packages/postgres/package.json`
- Create: `packages/postgres/tsconfig.json`
- Create: `packages/postgres/src/index.ts`

- [ ] **Step 1: Add package metadata**

Use this content for `packages/postgres/package.json`:

```json
{
  "name": "@broadway-ts/postgres",
  "version": "0.0.0",
  "type": "module",
  "description": "Postgres contracts for Broadway TS Event Sourcing.",
  "sideEffects": false,
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsup src/index.ts --format esm --dts --clean",
    "test": "vitest run --passWithNoTests",
    "typecheck": "tsc -p tsconfig.json --noEmit"
  },
  "dependencies": {
    "@broadway-ts/core": "workspace:*",
    "@broadway-ts/event-sourcing": "workspace:*"
  }
}
```

Use this content for `packages/postgres/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": ".",
    "outDir": "dist"
  },
  "include": ["src"]
}
```

- [ ] **Step 2: Add Postgres option contracts**

Use this content for `packages/postgres/src/index.ts`:

```ts
export type PostgresEventStoreOptions = {
  readonly connectionString: string;
  readonly schemaName?: string;
  readonly eventsTableName?: string;
};

export const defaultPostgresEventsTableName = "broadway_events";
```

- [ ] **Step 3: Install workspace after adding Postgres package**

Run:

```bash
pnpm install
```

Expected: command exits with status `0`.

- [ ] **Step 4: Run Postgres typecheck**

Run:

```bash
pnpm --filter @broadway-ts/postgres typecheck
```

Expected: PASS.

- [ ] **Step 5: Commit Postgres package shell**

Run:

```bash
git add packages/postgres pnpm-lock.yaml
git commit -m "chore(postgres): add package shell"
```

Expected: commit succeeds.

---

### Task 10: Full Workspace Verification

**Files:**
- Modify: no source files unless verification exposes a concrete defect.

- [ ] **Step 1: Run all tests**

Run:

```bash
pnpm test
```

Expected: all package tests pass.

- [ ] **Step 2: Run all typechecks**

Run:

```bash
pnpm typecheck
```

Expected: all package typechecks pass.

- [ ] **Step 3: Run all builds**

Run:

```bash
pnpm build
```

Expected: every package with a `build` script completes successfully.

- [ ] **Step 4: Check git status**

Run:

```bash
git status --short
```

Expected: no uncommitted source changes.

---

## Self-Review

Spec coverage:

- Public npm library: covered by package metadata and `exports` fields.
- Monorepo modular architecture: covered by pnpm workspace and package tasks.
- Schema-first API: covered by core definitions and Zod adapter.
- Standard Schema-compatible core: covered by `Schema<T>` and `ParseResult<T>`.
- Official Zod adapter: covered by Task 5.
- Abstract CQRS core: covered by Tasks 2 through 4.
- Event Sourcing as separate package: covered by Task 6.
- Explicit `Result`: covered by Task 2 and all handler APIs.
- Discriminated errors: covered by Task 2.
- Full event envelopes: covered by Task 6.
- Explicit stream IDs with repository defaults: covered by Task 6 and Task 7.
- `ExpectedVersion` union: covered by Task 6 and Task 7.
- Typed middleware pipeline: covered by Task 4.
- No DI container in core: covered by explicit handler registration and repository injection in the example.
- Universal runtime target: covered by avoiding Node built-ins in package source.
- ESM-only: covered by every package `type` and `exports`.
- pnpm, tsup, Vitest, Changesets: covered by Task 1 and package scripts.
- Spec-first plus prototype: this plan implements the prototype after the committed spec.

No red-flag gaps remain in this plan. Type names are consistent across tasks: `Result`, `CqrsError`, `Schema`, `CommandBus`, `QueryBus`, `EventEnvelope`, `ExpectedVersion`, `EventSourcedAggregate`, `AggregateRepository`, and `InMemoryEventStore`.
