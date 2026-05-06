import { describe, expect, it } from "vitest";
import { FixedClock, SequenceIdProvider } from "../src/index.js";

describe("FixedClock", () => {
  it("is unaffected by mutating the original date", () => {
    const original = new Date("2026-05-05T00:00:00.000Z");
    const clock = new FixedClock(original);

    original.setUTCFullYear(2030);

    expect(clock.now()).toEqual(new Date("2026-05-05T00:00:00.000Z"));
  });
});

describe("SequenceIdProvider", () => {
  it("increments ids", () => {
    const provider = new SequenceIdProvider("message");

    expect(provider.nextId()).toBe("message-1");
    expect(provider.nextId()).toBe("message-2");
    expect(provider.nextId()).toBe("message-3");
  });
});
