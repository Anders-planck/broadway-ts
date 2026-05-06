import {
  err,
  ok,
  validationError,
  type InferSchema,
  type Result,
  type Schema,
  type ValidationError,
} from "@broadway-ts/core";

export type EventDefinition<
  TType extends string,
  TVersion extends number,
  TPayload,
> = {
  readonly type: TType;
  readonly version: TVersion;
  readonly schema: Schema<TPayload>;
};

export type EventPayloadOf<TDefinition> =
  TDefinition extends EventDefinition<string, number, infer TPayload> ? TPayload : never;

export type EventEnvelope<TPayload = unknown, TMetadata = Record<string, unknown>> = {
  readonly eventId: string;
  readonly type: string;
  readonly version: number;
  readonly streamId: string;
  readonly streamVersion: number;
  readonly aggregateType?: string;
  readonly aggregateId?: string;
  readonly payload: TPayload;
  readonly metadata: TMetadata;
  readonly causationId?: string;
  readonly correlationId?: string;
  readonly occurredAt: Date;
};

export type PendingEvent<TPayload = unknown, TMetadata = Record<string, unknown>> = {
  readonly type: string;
  readonly version: number;
  readonly aggregateType?: string;
  readonly aggregateId?: string;
  readonly payload: TPayload;
  readonly metadata: TMetadata;
};

export type EventData<TPayload = unknown, TMetadata = Record<string, unknown>> = Omit<
  EventEnvelope<TPayload, TMetadata>,
  "streamId" | "streamVersion"
>;

export const defineEvent = <
  const TType extends string,
  const TVersion extends number,
  TSchema extends Schema<unknown>,
>(config: {
  readonly type: TType;
  readonly version: TVersion;
  readonly schema: TSchema;
}): EventDefinition<TType, TVersion, InferSchema<TSchema>> => ({
  type: config.type,
  version: config.version,
  schema: config.schema as Schema<InferSchema<TSchema>>,
});

export const parseEventPayload = async <
  TDefinition extends EventDefinition<string, number, unknown>,
>(
  definition: TDefinition,
  input: unknown,
): Promise<Result<EventPayloadOf<TDefinition>, ValidationError>> => {
  const parsed = await definition.schema.parse(input);

  if (!parsed.ok) {
    return err(validationError(parsed.issues));
  }

  return ok(parsed.value as EventPayloadOf<TDefinition>);
};
