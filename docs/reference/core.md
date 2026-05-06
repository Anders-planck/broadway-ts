# Core Reference

Package: `@broadway-ts/core`

## Result

```ts
type Result<T, E = CqrsError> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

const ok = <T>(value: T) => ({ ok: true, value });
const err = <E>(error: E) => ({ ok: false, error });
```

Helpers:

- `ok(value)`
- `err(error)`
- `isOk(result)`
- `isErr(result)`

## Schema

```ts
type Schema<T> = {
  parse(input: unknown): Awaitable<
    | Result<T, never>
    | { readonly ok: false; readonly issues: readonly ValidationIssue[] }
  >;
};
```

Any validation library can integrate by implementing this contract.

## Definitions

```ts
defineCommand({
  type: "inventory.reserve",
  schema,
  result: typeToken<void>(),
  error: typeToken<DomainError>(),
});

defineQuery({
  type: "inventory.get-stock",
  schema,
  result: typeToken<{ sku: string; available: number }>(),
});
```

Exports:

- `defineCommand`
- `defineQuery`
- `parseCommand`
- `parseQuery`
- `typeToken`
- `CommandOf<TDefinition>`
- `QueryOf<TDefinition>`
- `PayloadOf<TDefinition>`
- `ResultOf<TDefinition>`
- `ErrorOf<TDefinition>`

## Buses

```ts
const commandBus = new CommandBus();
commandBus.register(Command, handler);
commandBus.use(middleware);
await commandBus.execute(Command, input, context);
```

Exports:

- `CommandBus`
- `QueryBus`
- `CommandHandler`
- `QueryHandler`
- `CommandMiddleware`
- `QueryMiddleware`
- `BusContext`

## Errors

Factory exports:

- `validationError(issues)`
- `handlerNotFoundError(handlerType, messageType)`
- `domainError(code, message, details)`
- `concurrencyError(expectedVersion, actualVersion)`
- `persistenceError(code, message, cause)`

Error type exports:

- `CqrsError`
- `ValidationError`
- `HandlerNotFoundError`
- `DomainError`
- `ConcurrencyError`
- `PersistenceError`
