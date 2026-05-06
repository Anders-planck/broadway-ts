import { describe, expect, it } from "vitest";
import {
  CommandBus,
  QueryBus,
  defineCommand,
  defineQuery,
  domainError,
  err,
  ok,
  typeToken,
  type BusContext,
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

type TenantContext = BusContext & {
  readonly tenantId: string;
};

const assertCustomContextTypes = () => {
  const defaultBus = new CommandBus();
  void defaultBus.execute(DepositMoney, "account-1");

  const tenantBus = new CommandBus<TenantContext>();
  void tenantBus.execute(DepositMoney, "account-1", { tenantId: "tenant-1" });

  // @ts-expect-error Custom bus contexts must be provided explicitly.
  void tenantBus.execute(DepositMoney, "account-1");
};

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

  it("executes nested command middleware in registration order", async () => {
    const calls: string[] = [];
    const bus = new CommandBus();

    bus.use(async (_command, _ctx, next) => {
      calls.push("first-before");
      const result = await next();
      calls.push("first-after");
      return result;
    });

    bus.use(async (_command, _ctx, next) => {
      calls.push("second-before");
      const result = await next();
      calls.push("second-after");
      return result;
    });

    bus.register(DepositMoney, async () => {
      calls.push("handler");
      return ok(undefined);
    });

    const result = await bus.execute(DepositMoney, "account-1");

    expect(result).toEqual(ok(undefined));
    expect(calls).toEqual([
      "first-before",
      "second-before",
      "handler",
      "second-after",
      "first-after",
    ]);
  });

  it("allows command middleware to short-circuit handler execution", async () => {
    const calls: string[] = [];
    const bus = new CommandBus();

    bus.use(async () => {
      calls.push("short-circuit");
      return err(domainError("bank.blocked", "Blocked"));
    });

    bus.use(async (_command, _ctx, next) => {
      calls.push("unreached");
      return next();
    });

    bus.register(DepositMoney, async () => {
      calls.push("handler");
      return ok(undefined);
    });

    const result = await bus.execute(DepositMoney, "account-1");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe("domain");
      expect(result.error.code).toBe("bank.blocked");
    }
    expect(calls).toEqual(["short-circuit"]);
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

  it("returns validation errors before missing command handlers", async () => {
    const bus = new CommandBus();
    const result = await bus.execute(DepositMoney, 123);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe("validation");
    }
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

  it("throws when registering duplicate command handlers", () => {
    const bus = new CommandBus();

    bus.register(DepositMoney, async () => ok(undefined));

    expect(() => bus.register(DepositMoney, async () => ok(undefined))).toThrow(
      "Command handler already registered for bank.deposit-money",
    );
  });

  it("executes query handlers", async () => {
    const bus = new QueryBus();

    bus.register(GetBalance, async () => ok(100));

    const result = await bus.execute(GetBalance, "account-1");

    expect(result).toEqual(ok(100));
  });

  it("executes nested query middleware in registration order", async () => {
    const calls: string[] = [];
    const bus = new QueryBus();

    bus.use(async (_query, _ctx, next) => {
      calls.push("first-before");
      const result = await next();
      calls.push("first-after");
      return result;
    });

    bus.use(async (_query, _ctx, next) => {
      calls.push("second-before");
      const result = await next();
      calls.push("second-after");
      return result;
    });

    bus.register(GetBalance, async () => {
      calls.push("handler");
      return ok(100);
    });

    const result = await bus.execute(GetBalance, "account-1");

    expect(result).toEqual(ok(100));
    expect(calls).toEqual([
      "first-before",
      "second-before",
      "handler",
      "second-after",
      "first-after",
    ]);
  });

  it("allows query middleware to short-circuit handler execution", async () => {
    const calls: string[] = [];
    const bus = new QueryBus();

    bus.use(async () => {
      calls.push("short-circuit");
      return err(domainError("bank.query-blocked", "Query blocked"));
    });

    bus.use(async (_query, _ctx, next) => {
      calls.push("unreached");
      return next();
    });

    bus.register(GetBalance, async () => {
      calls.push("handler");
      return ok(100);
    });

    const result = await bus.execute(GetBalance, "account-1");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe("domain");
      expect(result.error.code).toBe("bank.query-blocked");
    }
    expect(calls).toEqual(["short-circuit"]);
  });

  it("returns validation errors before query handler execution", async () => {
    const bus = new QueryBus();
    let handled = false;

    bus.register(GetBalance, async () => {
      handled = true;
      return ok(100);
    });

    const result = await bus.execute(GetBalance, 123);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe("validation");
    }
    expect(handled).toBe(false);
  });

  it("returns validation errors before missing query handlers", async () => {
    const bus = new QueryBus();
    const result = await bus.execute(GetBalance, 123);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe("validation");
    }
  });

  it("returns handler_not_found for missing query handlers", async () => {
    const bus = new QueryBus();
    const result = await bus.execute(GetBalance, "account-1");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe("handler_not_found");
      if (result.error.kind !== "handler_not_found") {
        expect.fail("Expected handler_not_found error");
      }
      expect(result.error.handlerType).toBe("query");
    }
  });

  it("throws when registering duplicate query handlers", () => {
    const bus = new QueryBus();

    bus.register(GetBalance, async () => ok(100));

    expect(() => bus.register(GetBalance, async () => ok(100))).toThrow(
      "Query handler already registered for bank.get-balance",
    );
  });

  it("passes custom context to command handlers", async () => {
    const bus = new CommandBus<TenantContext>();
    let tenantId: string | undefined;

    bus.register(DepositMoney, async (_command, ctx) => {
      tenantId = ctx.tenantId;
      return ok(undefined);
    });

    const result = await bus.execute(DepositMoney, "account-1", {
      tenantId: "tenant-1",
    });

    expect(result).toEqual(ok(undefined));
    expect(tenantId).toBe("tenant-1");
  });

  it("type-checks custom context optionality", () => {
    expect(typeof assertCustomContextTypes).toBe("function");
  });
});
