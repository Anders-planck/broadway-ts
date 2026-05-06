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
