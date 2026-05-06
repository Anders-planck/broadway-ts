import { describe, expect, it } from "vitest";
import {
  domainError,
  ok,
  type DomainError,
  type Result,
  type Schema,
} from "@broadway-ts/core";
import {
  defineEvent,
  EventSourcedAggregate,
  type EventEnvelope,
  type PendingEvent,
} from "../src/index.js";

type Deposited = { accountId: string; amount: number };

const depositedSchema: Schema<Deposited> = {
  parse(input) {
    const value = input as Deposited;
    return typeof value.accountId === "string" && typeof value.amount === "number"
      ? ok(value)
      : {
          ok: false,
          issues: [{ path: [], message: "Invalid deposited event" }],
        };
  },
};

const MoneyDeposited = defineEvent({
  type: "bank.money-deposited",
  version: 1,
  schema: depositedSchema,
});

class BankAccount extends EventSourcedAggregate {
  static aggregateType = "bank-account";
  balance = 0;

  deposit(amount: number): Result<void, DomainError> {
    if (amount <= 0) {
      return {
        ok: false,
        error: domainError("bank.invalid_amount", "Amount must be positive"),
      };
    }

    this.record(MoneyDeposited, { accountId: this.id, amount });
    return ok(undefined);
  }

  protected apply(event: EventEnvelope | PendingEvent): void {
    if (event.type === MoneyDeposited.type) {
      this.balance += (event.payload as Deposited).amount;
    }
  }
}

describe("EventSourcedAggregate", () => {
  it("records pending events and applies state changes", () => {
    const account = new BankAccount("account-1");

    const result = account.deposit(50);

    expect(result).toEqual(ok(undefined));
    expect(account.balance).toBe(50);
    expect(account.version).toBe(0);
    expect(account.pendingEvents).toEqual([
      {
        type: "bank.money-deposited",
        version: 1,
        aggregateType: "bank-account",
        aggregateId: "account-1",
        payload: { accountId: "account-1", amount: 50 },
        metadata: {},
      },
    ]);
  });

  it("rehydrates from historical event envelopes", () => {
    const account = new BankAccount("account-1");

    account.rehydrate([
      {
        eventId: "event-1",
        type: "bank.money-deposited",
        version: 1,
        streamId: "bank-account-account-1",
        streamVersion: 1,
        aggregateType: "bank-account",
        aggregateId: "account-1",
        payload: { accountId: "account-1", amount: 25 },
        metadata: {},
        occurredAt: new Date("2026-05-05T00:00:00.000Z"),
      },
    ]);

    expect(account.balance).toBe(25);
    expect(account.version).toBe(1);
    expect(account.pendingEvents).toEqual([]);
  });
});
