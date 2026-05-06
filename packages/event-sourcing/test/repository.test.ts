import { describe, expect, it } from "vitest";
import {
  concurrencyError,
  err,
  ok,
  type PersistenceError,
  type Result,
  type Schema,
} from "@broadway-ts/core";
import {
  AggregateRepository,
  defineEvent,
  EventSourcedAggregate,
  type Clock,
  type EventData,
  type EventEnvelope,
  type EventStore,
  type EventStoreAppendError,
  type ExpectedVersion,
  type IdProvider,
  type PendingEvent,
} from "../src/index.js";

type StockAdjusted = { sku: string; delta: number };

const stockAdjustedSchema: Schema<StockAdjusted> = {
  parse(input) {
    const value = input as StockAdjusted;
    return typeof value.sku === "string" && typeof value.delta === "number"
      ? ok(value)
      : {
          ok: false,
          issues: [{ path: [], message: "Invalid stock adjustment" }],
        };
  },
};

const StockAdjusted = defineEvent({
  type: "inventory.stock-adjusted",
  version: 1,
  schema: stockAdjustedSchema,
});

class InventoryItem extends EventSourcedAggregate {
  static aggregateType = "inventory-item";
  quantity = 0;

  adjust(delta: number, metadata: Record<string, unknown> = {}): void {
    this.record(StockAdjusted, { sku: this.id, delta }, metadata);
  }

  protected apply(event: EventEnvelope | PendingEvent): void {
    if (event.type === StockAdjusted.type) {
      this.quantity += (event.payload as StockAdjusted).delta;
    }
  }
}

type AppendCall = {
  readonly streamId: string;
  readonly events: readonly EventData[];
  readonly expectedVersion: ExpectedVersion;
};

class FakeEventStore implements EventStore {
  appendCalls: AppendCall[] = [];
  readStreamCalls: string[] = [];
  appendResult: Result<readonly EventEnvelope[], EventStoreAppendError> | undefined;
  readStreamResult: Result<readonly EventEnvelope[], PersistenceError> = ok([]);

  async append(
    streamId: string,
    events: readonly EventData[],
    expectedVersion: ExpectedVersion,
  ): Promise<Result<readonly EventEnvelope[], EventStoreAppendError>> {
    this.appendCalls.push({ streamId, events, expectedVersion });

    if (this.appendResult !== undefined) {
      return this.appendResult;
    }

    const currentVersion = this.currentVersion(expectedVersion);

    return ok(
      events.map((event, index) => ({
        ...event,
        streamId,
        streamVersion: currentVersion + index + 1,
      })),
    );
  }

  async readStream(
    streamId: string,
  ): Promise<Result<readonly EventEnvelope[], PersistenceError>> {
    this.readStreamCalls.push(streamId);
    return this.readStreamResult;
  }

  private currentVersion(expectedVersion: ExpectedVersion): number {
    if (typeof expectedVersion === "number") {
      return expectedVersion;
    }

    if (!this.readStreamResult.ok) {
      return 0;
    }

    return this.readStreamResult.value.at(-1)?.streamVersion ?? 0;
  }
}

class FakeClock implements Clock {
  constructor(readonly currentTime: Date) {}

  now(): Date {
    return this.currentTime;
  }
}

class FakeIdProvider implements IdProvider {
  #next = 0;

  constructor(readonly ids: readonly string[]) {}

  nextId(): string {
    const id = this.ids[this.#next];
    this.#next += 1;

    if (id === undefined) {
      throw new Error("No fake id configured");
    }

    return id;
  }
}

const createRepository = (eventStore = new FakeEventStore()) => {
  const occurredAt = new Date("2026-05-06T00:00:00.000Z");
  const repository = new AggregateRepository<InventoryItem>({
    eventStore,
    clock: new FakeClock(occurredAt),
    idProvider: new FakeIdProvider(["event-1", "event-2"]),
  });

  return { eventStore, occurredAt, repository };
};

describe("AggregateRepository", () => {
  it("saves pending events to the default stream with aggregate version as expected version", async () => {
    const { eventStore, occurredAt, repository } = createRepository();
    const item = new InventoryItem("sku-1");
    item.rehydrate([
      {
        eventId: "event-0",
        type: "inventory.stock-adjusted",
        version: 1,
        streamId: "inventory-item-sku-1",
        streamVersion: 7,
        aggregateType: "inventory-item",
        aggregateId: "sku-1",
        payload: { sku: "sku-1", delta: 3 },
        metadata: {},
        occurredAt: new Date("2026-05-05T00:00:00.000Z"),
      },
    ]);
    item.adjust(4, { source: "test" });

    await repository.save(InventoryItem, item);

    expect(eventStore.appendCalls).toEqual([
      {
        streamId: "inventory-item-sku-1",
        expectedVersion: 7,
        events: [
          {
            eventId: "event-1",
            type: "inventory.stock-adjusted",
            version: 1,
            aggregateType: "inventory-item",
            aggregateId: "sku-1",
            payload: { sku: "sku-1", delta: 4 },
            metadata: { source: "test" },
            occurredAt,
          },
        ],
      },
    ]);
    expect(item.version).toBe(8);
  });

  it("includes causation and correlation ids when provided", async () => {
    const { eventStore, repository } = createRepository();
    const item = new InventoryItem("sku-1");
    item.adjust(4);

    await repository.save(InventoryItem, item, "any", {
      causationId: "command-1",
      correlationId: "trace-1",
    });

    expect(eventStore.appendCalls[0]?.events[0]).toMatchObject({
      causationId: "command-1",
      correlationId: "trace-1",
    });
  });

  it("omits causation and correlation ids when absent", async () => {
    const { eventStore, repository } = createRepository();
    const item = new InventoryItem("sku-1");
    item.adjust(4);

    await repository.save(InventoryItem, item);

    expect(eventStore.appendCalls[0]?.events[0]).not.toHaveProperty("causationId");
    expect(eventStore.appendCalls[0]?.events[0]).not.toHaveProperty("correlationId");
  });

  it("marks successful append events as committed", async () => {
    const eventStore = new FakeEventStore();
    eventStore.appendResult = ok([
      {
        eventId: "event-1",
        type: "inventory.stock-adjusted",
        version: 1,
        streamId: "inventory-item-sku-1",
        streamVersion: 11,
        aggregateType: "inventory-item",
        aggregateId: "sku-1",
        payload: { sku: "sku-1", delta: 4 },
        metadata: {},
        occurredAt: new Date("2026-05-06T00:00:00.000Z"),
      },
    ]);
    const { repository } = createRepository(eventStore);
    const item = new InventoryItem("sku-1");
    item.adjust(4);

    const result = await repository.save(InventoryItem, item);

    expect(result).toEqual(eventStore.appendResult);
    expect(item.version).toBe(11);
    expect(item.pendingEvents).toEqual([]);
  });

  it("leaves pending events intact when append fails", async () => {
    const eventStore = new FakeEventStore();
    eventStore.appendResult = err(concurrencyError(0, 1));
    const { repository } = createRepository(eventStore);
    const item = new InventoryItem("sku-1");
    item.adjust(4);
    const pendingEvents = [...item.pendingEvents];

    const result = await repository.save(InventoryItem, item);

    expect(result).toEqual(eventStore.appendResult);
    expect(item.version).toBe(0);
    expect(item.pendingEvents).toEqual(pendingEvents);
  });

  it("returns an empty result and skips append when there are no pending events", async () => {
    const { eventStore, repository } = createRepository();
    const item = new InventoryItem("sku-1");
    item.rehydrate([
      {
        eventId: "event-1",
        type: "inventory.stock-adjusted",
        version: 1,
        streamId: "inventory-item-sku-1",
        streamVersion: 5,
        aggregateType: "inventory-item",
        aggregateId: "sku-1",
        payload: { sku: "sku-1", delta: 4 },
        metadata: {},
        occurredAt: new Date("2026-05-05T00:00:00.000Z"),
      },
    ]);

    const result = await repository.save(InventoryItem, item);

    expect(result).toEqual(ok([]));
    expect(eventStore.appendCalls).toEqual([]);
    expect(item.version).toBe(5);
    expect(item.pendingEvents).toEqual([]);
  });

  it("loads and rehydrates an aggregate from its default stream", async () => {
    const eventStore = new FakeEventStore();
    eventStore.readStreamResult = ok([
      {
        eventId: "event-1",
        type: "inventory.stock-adjusted",
        version: 1,
        streamId: "inventory-item-sku-1",
        streamVersion: 1,
        aggregateType: "inventory-item",
        aggregateId: "sku-1",
        payload: { sku: "sku-1", delta: 4 },
        metadata: {},
        occurredAt: new Date("2026-05-06T00:00:00.000Z"),
      },
    ]);
    const { repository } = createRepository(eventStore);

    const result = await repository.load(InventoryItem, "sku-1");

    expect(eventStore.readStreamCalls).toEqual(["inventory-item-sku-1"]);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.quantity).toBe(4);
      expect(result.value.version).toBe(1);
      expect(result.value.pendingEvents).toEqual([]);
    }
  });
});
