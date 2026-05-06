import { validationError, type CqrsError, type ValidationError } from "./errors.js";
import { err, ok, type Result } from "./result.js";
import type { InferSchema, Schema } from "./schema.js";

/** Compile-time marker used to attach result or error types to definitions. */
export type TypeToken<T> = {
  readonly __type?: T;
};

/** Create a compile-time type token without runtime data. */
export const typeToken = <T>(): TypeToken<T> => ({});

type TokenValue<TToken, TFallback> = TToken extends TypeToken<infer TValue>
  ? TValue
  : TFallback;

/** Shared shape for command and query definitions. */
export type MessageDefinition<
  TKind extends "command" | "query",
  TType extends string,
  TPayload,
  TResult = unknown,
  TError extends CqrsError = CqrsError,
> = {
  readonly kind: TKind;
  readonly type: TType;
  readonly schema: Schema<TPayload>;
  readonly result?: TypeToken<TResult>;
  readonly error?: TypeToken<TError>;
};

/** Definition for a command message. */
export type CommandDefinition<
  TType extends string,
  TPayload,
  TResult = unknown,
  TError extends CqrsError = CqrsError,
> = MessageDefinition<"command", TType, TPayload, TResult, TError>;

/** Definition for a query message. */
export type QueryDefinition<
  TType extends string,
  TPayload,
  TResult = unknown,
  TError extends CqrsError = CqrsError,
> = MessageDefinition<"query", TType, TPayload, TResult, TError>;

/** Extract the parsed payload type from a command or query definition. */
export type PayloadOf<TDefinition> =
  TDefinition extends MessageDefinition<
    "command" | "query",
    string,
    infer TPayload,
    unknown,
    CqrsError
  >
    ? TPayload
    : never;

/** Extract the handler result value type from a command or query definition. */
export type ResultOf<TDefinition> =
  TDefinition extends MessageDefinition<
    "command" | "query",
    string,
    unknown,
    infer TResult,
    CqrsError
  >
    ? TResult
    : never;

/** Extract the handler error type from a command or query definition. */
export type ErrorOf<TDefinition> =
  TDefinition extends MessageDefinition<
    "command" | "query",
    string,
    unknown,
    unknown,
    infer TError
  >
    ? TError
    : never;

/** Runtime message shape passed to command and query handlers. */
export type MessageOf<
  TDefinition extends MessageDefinition<"command" | "query", string, unknown, unknown, CqrsError>,
> = {
  readonly type: TDefinition["type"];
  readonly payload: PayloadOf<TDefinition>;
};

/** Runtime command shape inferred from a command definition. */
export type CommandOf<TDefinition extends CommandDefinition<string, unknown, unknown, CqrsError>> =
  MessageOf<TDefinition>;

/** Runtime query shape inferred from a query definition. */
export type QueryOf<TDefinition extends QueryDefinition<string, unknown, unknown, CqrsError>> =
  MessageOf<TDefinition>;

/** Define a command contract with payload validation and optional result/error type tokens. */
export const defineCommand = <
  const TType extends string,
  TSchema extends Schema<unknown>,
  TResultToken extends TypeToken<unknown> | undefined = undefined,
  TErrorToken extends TypeToken<CqrsError> | undefined = undefined,
>(config: {
  readonly type: TType;
  readonly schema: TSchema;
  readonly result?: TResultToken;
  readonly error?: TErrorToken;
}): CommandDefinition<
  TType,
  InferSchema<TSchema>,
  TokenValue<TResultToken, unknown>,
  TokenValue<TErrorToken, CqrsError> & CqrsError
> => ({
  kind: "command",
  type: config.type,
  schema: config.schema as Schema<InferSchema<TSchema>>,
  ...(config.result === undefined
    ? {}
    : { result: config.result as TypeToken<TokenValue<TResultToken, unknown>> }),
  ...(config.error === undefined
    ? {}
    : {
        error: config.error as TypeToken<
          TokenValue<TErrorToken, CqrsError> & CqrsError
        >,
      }),
});

/** Define a query contract with payload validation and optional result/error type tokens. */
export const defineQuery = <
  const TType extends string,
  TSchema extends Schema<unknown>,
  TResultToken extends TypeToken<unknown> | undefined = undefined,
  TErrorToken extends TypeToken<CqrsError> | undefined = undefined,
>(config: {
  readonly type: TType;
  readonly schema: TSchema;
  readonly result?: TResultToken;
  readonly error?: TErrorToken;
}): QueryDefinition<
  TType,
  InferSchema<TSchema>,
  TokenValue<TResultToken, unknown>,
  TokenValue<TErrorToken, CqrsError> & CqrsError
> => ({
  kind: "query",
  type: config.type,
  schema: config.schema as Schema<InferSchema<TSchema>>,
  ...(config.result === undefined
    ? {}
    : { result: config.result as TypeToken<TokenValue<TResultToken, unknown>> }),
  ...(config.error === undefined
    ? {}
    : {
        error: config.error as TypeToken<
          TokenValue<TErrorToken, CqrsError> & CqrsError
        >,
      }),
});

const parseMessage = async <
  TDefinition extends MessageDefinition<"command" | "query", string, unknown, unknown, CqrsError>,
>(
  definition: TDefinition,
  input: unknown,
): Promise<Result<MessageOf<TDefinition>, ValidationError>> => {
  const parsed = await definition.schema.parse(input);

  if (!parsed.ok) {
    return err(validationError(parsed.issues));
  }

  return ok({
    type: definition.type,
    payload: parsed.value,
  } as MessageOf<TDefinition>);
};

/** Parse unknown input into a typed command message. */
export const parseCommand = <
  TDefinition extends CommandDefinition<string, unknown, unknown, CqrsError>,
>(
  definition: TDefinition,
  input: unknown,
): Promise<Result<CommandOf<TDefinition>, ValidationError>> => parseMessage(definition, input);

/** Parse unknown input into a typed query message. */
export const parseQuery = <
  TDefinition extends QueryDefinition<string, unknown, unknown, CqrsError>,
>(
  definition: TDefinition,
  input: unknown,
): Promise<Result<QueryOf<TDefinition>, ValidationError>> => parseMessage(definition, input);
