import { describe, expectTypeOf, it } from "vitest";
import { z } from "zod";
import type { InferSchema, Schema } from "@broadway-ts/core";
import { zodSchema } from "../src/index.js";

describe("zodSchema type inference", () => {
  it("adapts Zod schemas to Broadway schemas", () => {
    const schema = zodSchema(
      z.object({
        accountId: z.string(),
        amount: z.number().positive(),
      }),
    );

    type Payload = {
      accountId: string;
      amount: number;
    };

    expectTypeOf(schema).toEqualTypeOf<Schema<Payload>>();
    expectTypeOf<InferSchema<typeof schema>>().toEqualTypeOf<Payload>();
  });
});
