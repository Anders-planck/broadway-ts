/** Provides timestamps for event envelopes. */
export type Clock = {
  now(): Date;
};

/** Provides event IDs for newly persisted events. */
export type IdProvider = {
  nextId(): string;
};

/** Clock backed by the host system time. */
export const systemClock: Clock = {
  now() {
    return new Date();
  },
};
