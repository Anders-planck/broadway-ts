import { describe, expect, it } from "vitest";
import { ok, type Schema } from "@broadway-ts/core";
import {
  EventSourcedAggregate,
  type EventEnvelope,
  type PendingEvent,
} from "@broadway-ts/event-sourcing";
import { aggregateScenario } from "../src/index.js";

type MoneyDepositedPayload = {
  readonly amount: number;
};

const moneyDeposited = {
  type: "bank.money-deposited",
  version: 1,
  schema: {
    parse(input: unknown) {
      return ok(input as MoneyDepositedPayload);
    },
  } satisfies Schema<MoneyDepositedPayload>,
};

class TestAccount extends EventSourcedAggregate {
  static override aggregateType = "bank-account";

  #balance = 0;

  get balance(): number {
    return this.#balance;
  }

  deposit(amount: number): void {
    this.record(moneyDeposited, { amount });
  }

  protected apply(event: EventEnvelope | PendingEvent): void {
    if (event.type === moneyDeposited.type) {
      this.#balance += (event.payload as MoneyDepositedPayload).amount;
    }
  }
}

describe("aggregateScenario", () => {
  it("preserves action result type and snapshots pending events", () => {
    const scenario = aggregateScenario(TestAccount, "account-1").given([]);

    const outcome = scenario.when((aggregate) => {
      aggregate.deposit(10);
      return "deposited" as const;
    });
    const typedResult: "deposited" = outcome.result;

    outcome.aggregate.deposit(5);

    expect(typedResult).toBe("deposited");
    expect(outcome.pendingEvents).toHaveLength(1);
    expect(outcome.aggregate.pendingEvents).toHaveLength(2);
  });
});
