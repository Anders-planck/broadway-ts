import type { ValidationIssue } from "./errors.js";
import { ok, type Awaitable, type Ok } from "./result.js";

/** Failed schema parse result carrying normalized validation issues. */
export type ParseFailure = {
  readonly ok: false;
  readonly issues: readonly ValidationIssue[];
};

/** Schema parse result used before failures are converted to CQRS errors. */
export type ParseResult<T> = Ok<T> | ParseFailure;

/** Minimal validation adapter contract used by command, query, and event definitions. */
export interface Schema<T> {
  parse(input: unknown): Awaitable<ParseResult<T>>;
}

/** Infer the parsed value type from a Broadway TS schema. */
export type InferSchema<TSchema> = TSchema extends Schema<infer TValue> ? TValue : never;

/** Schema that accepts any input without validation. */
export const unknownSchema: Schema<unknown> = {
  parse(input: unknown) {
    return ok(input);
  },
};
