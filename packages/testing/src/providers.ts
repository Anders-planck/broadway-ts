import type { Clock, IdProvider } from "@broadway-ts/event-sourcing";

/** Clock that always returns the same timestamp copy. */
export class FixedClock implements Clock {
  readonly #date: Date;

  /** Create a fixed clock from a Date or date string. */
  constructor(date: Date | string) {
    this.#date = new Date(date);
  }

  /** Return a copy of the configured timestamp. */
  now(): Date {
    return new Date(this.#date);
  }
}

/** Deterministic ID provider that emits prefix-N identifiers. */
export class SequenceIdProvider implements IdProvider {
  #next = 1;
  readonly #prefix: string;

  /** Create a sequence provider with the given ID prefix. */
  constructor(prefix = "event") {
    this.#prefix = prefix;
  }

  /** Return the next deterministic ID. */
  nextId(): string {
    const value = `${this.#prefix}-${this.#next}`;
    this.#next += 1;
    return value;
  }
}
