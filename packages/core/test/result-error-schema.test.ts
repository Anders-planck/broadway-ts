import { describe, expect, it } from "vitest";
import {
  domainError,
  err,
  handlerNotFoundError,
  isErr,
  isOk,
  ok,
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
});
