import { describe, expect, it } from "vitest";
import { ok } from "@broadway-ts/core";
import type { EventData } from "@broadway-ts/event-sourcing";
import { InMemoryEventStore } from "../src/index.js";

const event = (eventId: string): EventData => ({
  eventId,
  type: "bank.money-deposited",
  version: 1,
  aggregateType: "bank-account",
  aggregateId: "account-1",
  payload: { amount: 10 },
  metadata: {},
  occurredAt: new Date("2026-05-05T00:00:00.000Z"),
});

describe("InMemoryEventStore", () => {
  it("appends events with stream versions", async () => {
    const store = new InMemoryEventStore();

    const appended = await store.append("bank-account-account-1", [event("event-1")], "no_stream");
    const stream = await store.readStream("bank-account-account-1");

    expect(appended.ok).toBe(true);
    expect(stream).toEqual(
      ok([
        {
          ...event("event-1"),
          streamId: "bank-account-account-1",
          streamVersion: 1,
        },
      ]),
    );
  });

  it("rejects conflicting expected versions", async () => {
    const store = new InMemoryEventStore();

    await store.append("bank-account-account-1", [event("event-1")], "no_stream");
    const conflict = await store.append("bank-account-account-1", [event("event-2")], "no_stream");

    expect(conflict.ok).toBe(false);
    if (!conflict.ok) {
      expect(conflict.error.kind).toBe("concurrency");
      expect(conflict.error.actualVersion).toBe(1);
    }
  });
});
