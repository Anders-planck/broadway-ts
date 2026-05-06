import { describe, expectTypeOf, it } from "vitest";
import {
  ok,
  type ConcurrencyError,
  type PersistenceError,
  type Result,
  type Schema,
} from "@broadway-ts/core";
import {
  AggregateRepository,
  defineEvent,
  EventSourcedAggregate,
  systemClock,
  type EventEnvelope,
  type EventPayloadOf,
  type EventStore,
  type PendingEvent,
} from "../src/index.js";

type DepositedPayload = {
  readonly accountId: string;
  readonly amount: number;
};

const depositedSchema = {
  parse(input: unknown) {
    return ok(input as DepositedPayload);
  },
} satisfies Schema<DepositedPayload>;

const MoneyDeposited = defineEvent({
  type: "bank.money-deposited",
  version: 1,
  schema: depositedSchema,
});

class TypeAccount extends EventSourcedAggregate {
  static override aggregateType = "bank-account";

  protected apply(_event: EventEnvelope | PendingEvent): void {}
}

const eventStore = {
  async append() {
    return ok([]);
  },
  async readStream() {
    return ok([]);
  },
} satisfies EventStore;

describe("event-sourcing type inference", () => {
  it("preserves event definition types", () => {
    expectTypeOf<EventPayloadOf<typeof MoneyDeposited>>().toEqualTypeOf<
      DepositedPayload
    >();
    expectTypeOf<typeof MoneyDeposited.type>().toEqualTypeOf<
      "bank.money-deposited"
    >();
    expectTypeOf<typeof MoneyDeposited.version>().toEqualTypeOf<1>();
  });

  it("types aggregate repository results", () => {
    const repository = new AggregateRepository<TypeAccount>({
      eventStore,
      clock: systemClock,
      idProvider: { nextId: () => "event-1" },
    });

    expectTypeOf(repository.load(TypeAccount, "account-1")).toEqualTypeOf<
      Promise<Result<TypeAccount, PersistenceError>>
    >();

    expectTypeOf(repository.save(TypeAccount, new TypeAccount("account-1"))).toEqualTypeOf<
      Promise<Result<readonly EventEnvelope[], ConcurrencyError | PersistenceError>>
    >();
  });
});
