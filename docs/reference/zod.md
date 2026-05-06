# Zod Reference

Package: `@broadway-ts/zod`

## zodSchema

```ts
import { zodSchema } from "@broadway-ts/zod";
import { z } from "zod";

const schema = zodSchema(
  z.object({
    email: z.string().email(),
  }),
);
```

`zodSchema` adapts a Zod schema to the Broadway TS `Schema<T>` contract.

Behavior:

- uses `safeParseAsync`
- supports async refinements
- maps Zod issue paths to `readonly (string | number)[]`
- preserves Zod issue codes in `ValidationIssue.code`

Peer dependencies:

- `@broadway-ts/core`
- `zod`

## Type-Level Coverage

Zod adapter inference is covered in `packages/zod/test/type-inference.test.ts`.

Covered surfaces:

- `zodSchema`
- `Schema<T>`
- `InferSchema<TSchema>`

Run:

```bash
pnpm --filter @broadway-ts/zod typecheck
```
