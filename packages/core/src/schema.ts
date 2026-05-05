import { ok, type Awaitable, type Result } from "./result.js";
import type { ValidationIssue } from "./errors.js";

export type ParseResult<T> = Result<T, readonly ValidationIssue[]>;

export interface Schema<T> {
  parse(input: unknown): Awaitable<ParseResult<T>>;
}

export type InferSchema<TSchema> = TSchema extends Schema<infer TValue> ? TValue : never;

export const unknownSchema: Schema<unknown> = {
  parse(input: unknown) {
    return ok(input);
  },
};
