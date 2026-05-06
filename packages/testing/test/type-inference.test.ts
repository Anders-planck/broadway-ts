import { describe, expectTypeOf, it } from "vitest";
import { ok, type Result, type Schema } from "@broadway-ts/core";
import {
  EventSourcedAggregate,
  type EventEnvelope,
  type EventStore,
  type PendingEvent,
} from "@broadway-ts/event-sourcing";
import {
  FixedClock,
  InMemoryEventStore,
  SequenceIdProvider,
  aggregateScenario,
} from "../src/index.js";

type DepositedPayload = {
  readonly amount: number;
};

const MoneyDeposited = {
  type: "bank.money-deposited",
  version: 1,
  schema: {
    parse(input: unknown) {
      return ok(input as DepositedPayload);
    },
  } satisfies Schema<DepositedPayload>,
};

class TypeAccount extends EventSourcedAggregate {
  static override aggregateType = "bank-account";

  deposit(amount: number): Result<"recorded"> {
    this.record(MoneyDeposited, { amount });
    return ok("recorded");
  }

  protected apply(_event: EventEnvelope | PendingEvent): void {}
}

describe("testing helper type inference", () => {
  it("types deterministic providers and event store", () => {
    expectTypeOf<InMemoryEventStore>().toMatchTypeOf<EventStore>();
    expectTypeOf(new FixedClock("2026-05-05T00:00:00.000Z").now()).toEqualTypeOf<
      Date
    >();
    expectTypeOf(new SequenceIdProvider().nextId()).toEqualTypeOf<string>();
  });

  it("preserves aggregate scenario action result types", () => {
    const result = aggregateScenario(TypeAccount, "account-1")
      .given([])
      .when((account) => account.deposit(50));

    expectTypeOf(result.result).toEqualTypeOf<Result<"recorded">>();
    expectTypeOf(result.pendingEvents).toEqualTypeOf<readonly PendingEvent[]>();
    expectTypeOf(result.aggregate).toEqualTypeOf<TypeAccount>();
  });
});
