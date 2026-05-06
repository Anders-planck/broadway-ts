# Getting Started

This guide builds the smallest useful command flow: define a command, register a
handler, execute it through a bus, and handle a typed `Result`.

## Install

Packages are not published yet. After the first npm release:

```bash
pnpm add @broadway-ts/core @broadway-ts/zod zod
```

For local development:

```bash
git clone https://github.com/Anders-planck/broadway-ts.git
cd broadway-ts
pnpm install
pnpm test
```

## Define a Command

```ts
import { defineCommand, typeToken } from "@broadway-ts/core";
import { zodSchema } from "@broadway-ts/zod";
import { z } from "zod";

export const RegisterUser = defineCommand({
  type: "user.register",
  schema: zodSchema(
    z.object({
      userId: z.string().min(1),
      email: z.string().email(),
    }),
  ),
  result: typeToken<{ userId: string }>(),
});
```

`defineCommand` keeps the command type literal, infers payload from the schema,
and carries the handler result type through the bus.

## Register a Handler

```ts
import { CommandBus, ok } from "@broadway-ts/core";
import { RegisterUser } from "./commands.js";

const commandBus = new CommandBus();

commandBus.register(RegisterUser, async (command) => {
  return ok({ userId: command.payload.userId });
});
```

Handlers receive validated payloads. If validation fails, the handler is not
called and the bus returns a validation error.

## Execute

```ts
const result = await commandBus.execute(RegisterUser, {
  userId: "user-1",
  email: "ada@example.com",
});

if (!result.ok) {
  console.error(result.error.code);
  process.exitCode = 1;
} else {
  console.log(result.value.userId);
}
```

The result type is inferred as:

```ts
Result<
  { userId: string },
  CqrsError
>
```

## Add Event Sourcing

For aggregates, repositories, and event streams, continue with
[Event Sourcing](/guides/event-sourcing).
