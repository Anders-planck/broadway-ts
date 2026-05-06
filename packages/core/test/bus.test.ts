import { describe, expect, it } from "vitest";
import {
  CommandBus,
  QueryBus,
  defineCommand,
  defineQuery,
  ok,
  typeToken,
  type DomainError,
  type Schema,
} from "../src/index.js";

const stringSchema: Schema<string> = {
  parse(input) {
    return typeof input === "string"
      ? ok(input)
      : {
          ok: false,
          issues: [{ path: [], message: "Expected string", code: "invalid_type" }],
        };
  },
};

const DepositMoney = defineCommand({
  type: "bank.deposit-money",
  schema: stringSchema,
  result: typeToken<void>(),
  error: typeToken<DomainError>(),
});

const GetBalance = defineQuery({
  type: "bank.get-balance",
  schema: stringSchema,
  result: typeToken<number>(),
});

describe("buses", () => {
  it("executes command handlers through middleware in order", async () => {
    const calls: string[] = [];
    const bus = new CommandBus();

    bus.use(async (_command, _ctx, next) => {
      calls.push("before");
      const result = await next();
      calls.push("after");
      return result;
    });

    bus.register(DepositMoney, async (command) => {
      calls.push(command.payload);
      return ok(undefined);
    });

    const result = await bus.execute(DepositMoney, "handler");

    expect(result).toEqual(ok(undefined));
    expect(calls).toEqual(["before", "handler", "after"]);
  });

  it("returns validation errors before handler execution", async () => {
    const bus = new CommandBus();
    let handled = false;

    bus.register(DepositMoney, async () => {
      handled = true;
      return ok(undefined);
    });

    const result = await bus.execute(DepositMoney, 123);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe("validation");
    }
    expect(handled).toBe(false);
  });

  it("returns handler_not_found for missing command handlers", async () => {
    const bus = new CommandBus();
    const result = await bus.execute(DepositMoney, "account-1");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe("handler_not_found");
      if (result.error.kind !== "handler_not_found") {
        expect.fail("Expected handler_not_found error");
      }
      expect(result.error.handlerType).toBe("command");
    }
  });

  it("executes query handlers", async () => {
    const bus = new QueryBus();

    bus.register(GetBalance, async () => ok(100));

    const result = await bus.execute(GetBalance, "account-1");

    expect(result).toEqual(ok(100));
  });
});
