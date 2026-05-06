import { describe, expectTypeOf, it } from "vitest";
import {
  CommandBus,
  QueryBus,
  ok,
  type BusContext,
  type CommandOf,
  type CqrsError,
  type DomainError,
  type ErrorOf,
  type HandlerNotFoundError,
  type PayloadOf,
  type QueryOf,
  type Result,
  type ResultOf,
  type Schema,
  type ValidationError,
} from "../src/index.js";
import { defineCommand, defineQuery, typeToken } from "../src/index.js";

type DepositPayload = {
  readonly accountId: string;
  readonly amount: number;
};

type DepositResult = {
  readonly balance: number;
};

const depositSchema = {
  parse(input: unknown) {
    return ok(input as DepositPayload);
  },
} satisfies Schema<DepositPayload>;

const DepositMoney = defineCommand({
  type: "bank.deposit-money",
  schema: depositSchema,
  result: typeToken<DepositResult>(),
  error: typeToken<DomainError>(),
});

const GetBalance = defineQuery({
  type: "bank.get-balance",
  schema: depositSchema,
  result: typeToken<DepositResult | undefined>(),
  error: typeToken<DomainError>(),
});

describe("core type inference", () => {
  it("preserves command definition types", () => {
    expectTypeOf<PayloadOf<typeof DepositMoney>>().toEqualTypeOf<DepositPayload>();
    expectTypeOf<ResultOf<typeof DepositMoney>>().toEqualTypeOf<DepositResult>();
    expectTypeOf<ErrorOf<typeof DepositMoney>>().toEqualTypeOf<DomainError>();
    expectTypeOf<CommandOf<typeof DepositMoney>>().toEqualTypeOf<{
      readonly type: "bank.deposit-money";
      readonly payload: DepositPayload;
    }>();
  });

  it("preserves query definition types", () => {
    expectTypeOf<PayloadOf<typeof GetBalance>>().toEqualTypeOf<DepositPayload>();
    expectTypeOf<ResultOf<typeof GetBalance>>().toEqualTypeOf<
      DepositResult | undefined
    >();
    expectTypeOf<ErrorOf<typeof GetBalance>>().toEqualTypeOf<DomainError>();
    expectTypeOf<QueryOf<typeof GetBalance>>().toEqualTypeOf<{
      readonly type: "bank.get-balance";
      readonly payload: DepositPayload;
    }>();
  });

  it("types bus handlers and custom contexts", () => {
    type TenantContext = BusContext & {
      readonly tenantId: string;
    };

    const commandBus = new CommandBus<TenantContext>();
    commandBus.register(DepositMoney, async (command, ctx) => {
      expectTypeOf(command.payload).toEqualTypeOf<DepositPayload>();
      expectTypeOf(ctx).toEqualTypeOf<TenantContext>();
      return ok({ balance: command.payload.amount });
    });

    const commandResult = commandBus.execute(
      DepositMoney,
      { accountId: "account-1", amount: 50 },
      { tenantId: "tenant-1" },
    );

    expectTypeOf(commandResult).toEqualTypeOf<
      Promise<Result<DepositResult, CqrsError>>
    >();

    if (false) {
      // @ts-expect-error custom bus contexts are required by execute
      void commandBus.execute(DepositMoney, { accountId: "account-1", amount: 50 });
    }
  });

  it("types query handlers and bus error unions", () => {
    const queryBus = new QueryBus();
    queryBus.register(GetBalance, async (query) => {
      expectTypeOf(query.payload).toEqualTypeOf<DepositPayload>();
      return ok({ balance: query.payload.amount });
    });

    const queryResult = queryBus.execute(GetBalance, {
      accountId: "account-1",
      amount: 50,
    });

    expectTypeOf(queryResult).toEqualTypeOf<
      Promise<
        Result<
          DepositResult | undefined,
          DomainError | ValidationError | HandlerNotFoundError | CqrsError
        >
      >
    >();
  });
});
