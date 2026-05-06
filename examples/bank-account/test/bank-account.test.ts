import { describe, expect, it } from "vitest";
import { CommandBus, ok } from "@broadway-ts/core";
import { AggregateRepository } from "@broadway-ts/event-sourcing";
import {
  FixedClock,
  InMemoryEventStore,
  SequenceIdProvider,
} from "@broadway-ts/testing";
import {
  BankAccount,
  createDepositMoneyHandler,
  DepositMoney,
} from "../src/bank-account.js";

describe("bank account example", () => {
  it("deposits money through command bus and event-sourced aggregate", async () => {
    const eventStore = new InMemoryEventStore();
    const repository = new AggregateRepository<BankAccount>({
      eventStore,
      clock: new FixedClock("2026-05-05T00:00:00.000Z"),
      idProvider: new SequenceIdProvider(),
    });
    const commandBus = new CommandBus();

    commandBus.register(DepositMoney, createDepositMoneyHandler(repository));

    const commandResult = await commandBus.execute(DepositMoney, {
      accountId: "account-1",
      amount: 50,
    });
    const loaded = await repository.load(BankAccount, "account-1");

    expect(commandResult).toEqual(ok(undefined));
    expect(loaded.ok).toBe(true);
    if (loaded.ok) {
      expect(loaded.value.balance).toBe(50);
      expect(loaded.value.version).toBe(1);
    }
  });
});
