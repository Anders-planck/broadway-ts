# Command and Query Bus

Broadway TS keeps command and query definitions separate from handlers. A
definition describes the message contract. A bus validates raw input, builds a
typed message, runs middleware, and invokes the registered handler.

## Commands

Commands express intent to change state.

```ts
import {
  CommandBus,
  defineCommand,
  domainError,
  ok,
  type DomainError,
  typeToken,
} from "@broadway-ts/core";
import { zodSchema } from "@broadway-ts/zod";
import { z } from "zod";

const CreateInvoice = defineCommand({
  type: "billing.create-invoice",
  schema: zodSchema(
    z.object({
      invoiceId: z.string().min(1),
      customerId: z.string().min(1),
      totalCents: z.number().int().positive(),
    }),
  ),
  result: typeToken<void>(),
  error: typeToken<DomainError>(),
});

const commandBus = new CommandBus();

commandBus.register(CreateInvoice, async (command) => {
  if (command.payload.totalCents > 1_000_000) {
    return {
      ok: false,
      error: domainError("invoice.total_too_large", "Invoice total is too large"),
    };
  }

  return ok(undefined);
});
```

## Queries

Queries read state and return data.

```ts
import { QueryBus, defineQuery, ok, typeToken } from "@broadway-ts/core";
import { zodSchema } from "@broadway-ts/zod";
import { z } from "zod";

type InvoiceView = {
  readonly invoiceId: string;
  readonly totalCents: number;
};

const GetInvoice = defineQuery({
  type: "billing.get-invoice",
  schema: zodSchema(z.object({ invoiceId: z.string().min(1) })),
  result: typeToken<InvoiceView | undefined>(),
});

const queryBus = new QueryBus();

queryBus.register(GetInvoice, async (query) => {
  return ok({
    invoiceId: query.payload.invoiceId,
    totalCents: 5000,
  });
});
```

## Middleware

Middleware wraps handlers. Use it for tracing, auth checks, logging, metrics, or
request cancellation.

```ts
import { CommandBus, type BusContext } from "@broadway-ts/core";

type AppContext = BusContext & {
  readonly tenantId: string;
};

const commandBus = new CommandBus<AppContext>();

commandBus.use(async (command, ctx, next) => {
  const started = performance.now();
  const result = await next();

  console.log({
    type: command.type,
    tenantId: ctx.tenantId,
    ok: result.ok,
    durationMs: performance.now() - started,
  });

  return result;
});
```

When a custom context is used, `execute` requires that context:

```ts
await commandBus.execute(CreateInvoice, input, {
  tenantId: "tenant-1",
  correlationId: "request-123",
});
```

## Failure Model

The bus returns `Result`, not thrown exceptions, for expected failures:

- validation errors from schema parsing
- missing handler errors
- handler domain errors
- persistence or concurrency errors returned by handlers

Duplicate handler registration throws immediately because it is a programmer
configuration error.
