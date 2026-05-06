import type { CqrsError } from "./errors.js";

/** A value that may be returned directly or through a promise. */
export type Awaitable<T> = T | Promise<T>;

/** Successful result variant. */
export type Ok<T> = {
  readonly ok: true;
  readonly value: T;
};

/** Failed result variant. */
export type Err<E> = {
  readonly ok: false;
  readonly error: E;
};

/** Explicit success-or-failure return value used by Broadway TS APIs. */
export type Result<T, E = CqrsError> = Ok<T> | Err<E>;

/** Create a successful result. */
export const ok = <T>(value: T): Ok<T> => ({ ok: true, value });

/** Create a failed result. */
export const err = <E>(error: E): Err<E> => ({ ok: false, error });

/** Narrow a result to the successful variant. */
export const isOk = <T, E>(result: Result<T, E>): result is Ok<T> => result.ok;

/** Narrow a result to the failed variant. */
export const isErr = <T, E>(result: Result<T, E>): result is Err<E> => !result.ok;
