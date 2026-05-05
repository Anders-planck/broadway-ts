import type { ValidationIssue } from "./errors.js";
import { ok, type Awaitable, type Ok } from "./result.js";

export type ParseFailure = {
  readonly ok: false;
  readonly issues: readonly ValidationIssue[];
};

export type ParseResult<T> = Ok<T> | ParseFailure;

export interface Schema<T> {
  parse(input: unknown): Awaitable<ParseResult<T>>;
}

export type InferSchema<TSchema> = TSchema extends Schema<infer TValue> ? TValue : never;

export const unknownSchema: Schema<unknown> = {
  parse(input: unknown) {
    return ok(input);
  },
};
