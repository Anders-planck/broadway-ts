/**
 * Zod adapter for the Broadway TS schema contract.
 *
 * @packageDocumentation
 */
import { ok, type Schema, type ValidationIssue } from "@broadway-ts/core";
import type { z, ZodTypeAny } from "zod";

/** Adapt a Zod schema to the Broadway TS Schema<T> contract. */
export const zodSchema = <TSchema extends ZodTypeAny>(
  schema: TSchema,
): Schema<z.infer<TSchema>> => ({
  async parse(input: unknown) {
    const result = await schema.safeParseAsync(input);

    if (result.success) {
      return ok(result.data);
    }

    const issues: ValidationIssue[] = result.error.issues.map((issue) => ({
      path: issue.path.map((segment) =>
        typeof segment === "number" ? segment : String(segment),
      ),
      message: issue.message,
      code: issue.code,
    }));

    return { ok: false, issues };
  },
});
