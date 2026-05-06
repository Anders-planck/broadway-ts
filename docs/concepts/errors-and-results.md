# Errors and Results

Broadway TS uses explicit `Result<T, E>` values for expected application
failures.

```ts
type Result<T, E> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };
```

## Built-In Error Kinds

| Kind | Code | Use |
| --- | --- | --- |
| `validation` | `validation.invalid_payload` | schema parsing failed |
| `handler_not_found` | `handler.not_found` | no command/query handler was registered |
| `domain` | app-defined | business rule failure |
| `concurrency` | `event_store.concurrency_conflict` | optimistic concurrency failure |
| `persistence` | app-defined | storage or adapter failure |

## Return, Do Not Throw

Expected failures should be returned:

```ts
import { domainError } from "@broadway-ts/core";

return {
  ok: false,
  error: domainError("bank.insufficient_funds", "Insufficient funds"),
};
```

Throw only for programmer errors or unrecoverable defects, such as duplicate
handler registration during application boot.

## Narrowing

```ts
const result = await commandBus.execute(Command, input);

if (!result.ok) {
  switch (result.error.kind) {
    case "validation":
      return { status: 400, body: result.error.issues };
    case "domain":
      return { status: 422, body: result.error.message };
    default:
      return { status: 500, body: result.error.code };
  }
}

return { status: 204 };
```

The discriminated `kind` field keeps error handling predictable across
frameworks.
