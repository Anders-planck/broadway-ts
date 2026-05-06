import type { Clock, IdProvider } from "@broadway-ts/event-sourcing";

export class FixedClock implements Clock {
  readonly #date: Date;

  constructor(date: Date | string) {
    this.#date = new Date(date);
  }

  now(): Date {
    return new Date(this.#date);
  }
}

export class SequenceIdProvider implements IdProvider {
  #next = 1;
  readonly #prefix: string;

  constructor(prefix = "event") {
    this.#prefix = prefix;
  }

  nextId(): string {
    const value = `${this.#prefix}-${this.#next}`;
    this.#next += 1;
    return value;
  }
}
