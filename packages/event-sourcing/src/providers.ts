export type Clock = {
  now(): Date;
};

export type IdProvider = {
  nextId(): string;
};

export const systemClock: Clock = {
  now() {
    return new Date();
  },
};
