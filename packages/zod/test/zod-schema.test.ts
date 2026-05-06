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

  it("maps async refinement failures to Broadway validation issues", async () => {
    const schema = zodSchema(
      z.string().refine(async () => false, { message: "async rejected" }),
    );

    const result = await schema.parse("valid shape");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues[0]?.path).toEqual([]);
      expect(result.issues[0]?.message).toBe("async rejected");
      expect(result.issues[0]?.code).toBe("custom");
    }
  });

  it("preserves numeric array path segments", async () => {
    const schema = zodSchema(
      z.object({
        items: z.array(z.object({ amount: z.number().positive() })),
      }),
    );

    const result = await schema.parse({ items: [{ amount: -1 }] });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues[0]?.path).toEqual(["items", 0, "amount"]);
      expect(result.issues[0]?.code).toBe("too_small");
    }
  });

  it("maps multiple Zod issues", async () => {
    const schema = zodSchema(
      z.object({
        amount: z.number().positive(),
        label: z.string().min(3),
      }),
    );

    const result = await schema.parse({ amount: -1, label: "" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues).toHaveLength(2);
      expect(result.issues.map((issue) => issue.path)).toEqual([
        ["amount"],
        ["label"],
      ]);
      expect(result.issues.map((issue) => issue.code)).toEqual([
        "too_small",
        "too_small",
      ]);
    }
  });
});
