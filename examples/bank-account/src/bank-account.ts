import {
  defineCommand,
  domainError,
  err,
  ok,
  type CommandHandler,
  type DomainError,
  type Result,
  typeToken,
} from "@broadway-ts/core";
import {
  defineEvent,
  EventSourcedAggregate,
  type AggregateRepository,
  type EventEnvelope,
  type EventStoreAppendError,
  type PendingEvent,
} from "@broadway-ts/event-sourcing";
import { zodSchema } from "@broadway-ts/zod";
import { z } from "zod";

const depositMoneySchema = zodSchema(
  z.object({
    accountId: z.string().min(1),
    amount: z.number().positive(),
  }),
);

const moneyDepositedSchema = zodSchema(
  z.object({
    accountId: z.string().min(1),
    amount: z.number().positive(),
  }),
);

export const DepositMoney = defineCommand({
  type: "bank.deposit-money",
  schema: depositMoneySchema,
  result: typeToken<void>(),
  error: typeToken<DomainError | EventStoreAppendError>(),
});

export const MoneyDeposited = defineEvent({
  type: "bank.money-deposited",
  version: 1,
  schema: moneyDepositedSchema,
});

export class BankAccount extends EventSourcedAggregate {
  static override aggregateType = "bank-account";

  balance = 0;

  deposit(amount: number): Result<void, DomainError> {
    if (amount <= 0) {
      return err(domainError("bank.invalid_amount", "Amount must be positive", { amount }));
    }

    this.record(MoneyDeposited, {
      accountId: this.id,
      amount,
    });

    return ok(undefined);
  }

  protected apply(event: EventEnvelope | PendingEvent): void {
    if (event.type === MoneyDeposited.type) {
      const payload = event.payload as { amount: number };
      this.balance += payload.amount;
    }
  }
}

export const createDepositMoneyHandler = (
  repository: AggregateRepository<BankAccount>,
): CommandHandler<typeof DepositMoney> => async (command) => {
  const loaded = await repository.load(BankAccount, command.payload.accountId);

  if (!loaded.ok) {
    return loaded;
  }

  const deposited = loaded.value.deposit(command.payload.amount);

  if (!deposited.ok) {
    return deposited;
  }

  const saved = await repository.save(BankAccount, loaded.value);

  if (!saved.ok) {
    return saved;
  }

  return ok(undefined);
};
