import { describe, expect, it } from "vitest";
import { ok } from "@broadway-ts/core";
import type { EventData, EventEnvelope } from "@broadway-ts/event-sourcing";
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

  it("appends after an existing event with a numeric expected version", async () => {
    const store = new InMemoryEventStore();

    await store.append("bank-account-account-1", [event("event-1")], "no_stream");
    const appended = await store.append("bank-account-account-1", [event("event-2")], 1);
    const stream = await store.readStream("bank-account-account-1");

    expect(appended).toEqual(
      ok([
        {
          ...event("event-2"),
          streamId: "bank-account-account-1",
          streamVersion: 2,
        },
      ]),
    );
    expect(stream).toEqual(
      ok([
        {
          ...event("event-1"),
          streamId: "bank-account-account-1",
          streamVersion: 1,
        },
        {
          ...event("event-2"),
          streamId: "bank-account-account-1",
          streamVersion: 2,
        },
      ]),
    );
  });

  it("allows appending with any expected version", async () => {
    const store = new InMemoryEventStore();

    await store.append("bank-account-account-1", [event("event-1")], "no_stream");
    const appended = await store.append("bank-account-account-1", [event("event-2")], "any");

    expect(appended).toEqual(
      ok([
        {
          ...event("event-2"),
          streamId: "bank-account-account-1",
          streamVersion: 2,
        },
      ]),
    );
  });

  it("requires an existing stream for stream_exists expected version", async () => {
    const store = new InMemoryEventStore();

    const missing = await store.append("bank-account-account-1", [event("event-1")], "stream_exists");

    expect(missing.ok).toBe(false);
    if (!missing.ok) {
      expect(missing.error.kind).toBe("concurrency");
      expect(missing.error.actualVersion).toBe(0);
    }

    await store.append("bank-account-account-1", [event("event-1")], "no_stream");
    const existing = await store.append("bank-account-account-1", [event("event-2")], "stream_exists");

    expect(existing).toEqual(
      ok([
        {
          ...event("event-2"),
          streamId: "bank-account-account-1",
          streamVersion: 2,
        },
      ]),
    );
  });

  it("returns ok without mutating streams for empty appends", async () => {
    const store = new InMemoryEventStore();

    await store.append("bank-account-account-1", [event("event-1")], "no_stream");
    const empty = await store.append("bank-account-account-1", [], "no_stream");
    const stream = await store.readStream("bank-account-account-1");

    expect(empty).toEqual(ok([]));
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

  it("returns a copy when reading a stream", async () => {
    const store = new InMemoryEventStore();

    await store.append("bank-account-account-1", [event("event-1")], "no_stream");
    const firstRead = await store.readStream("bank-account-account-1");

    expect(firstRead.ok).toBe(true);
    if (firstRead.ok) {
      (firstRead.value as EventEnvelope[]).push({
        ...event("event-2"),
        streamId: "bank-account-account-1",
        streamVersion: 2,
      });
    }

    const secondRead = await store.readStream("bank-account-account-1");

    expect(secondRead).toEqual(
      ok([
        {
          ...event("event-1"),
          streamId: "bank-account-account-1",
          streamVersion: 1,
        },
      ]),
    );
  });
});
