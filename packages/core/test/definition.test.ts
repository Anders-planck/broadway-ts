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
