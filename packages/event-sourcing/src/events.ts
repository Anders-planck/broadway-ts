import {
  err,
  ok,
  validationError,
  type InferSchema,
  type Result,
  type Schema,
  type ValidationError,
} from "@broadway-ts/core";

/** Definition for a versioned domain event payload. */
export type EventDefinition<
  TType extends string,
  TVersion extends number,
  TPayload,
> = {
  readonly type: TType;
  readonly version: TVersion;
  readonly schema: Schema<TPayload>;
};

/** Extract the payload type from an event definition. */
export type EventPayloadOf<TDefinition> =
  TDefinition extends EventDefinition<string, number, infer TPayload> ? TPayload : never;

/** Persisted event with stream position and trace metadata. */
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

/** Event recorded by an aggregate before it is appended to an event store. */
export type PendingEvent<TPayload = unknown, TMetadata = Record<string, unknown>> = {
  readonly type: string;
  readonly version: number;
  readonly aggregateType?: string;
  readonly aggregateId?: string;
  readonly payload: TPayload;
  readonly metadata: TMetadata;
};

/** Event data ready for persistence before stream fields are assigned. */
export type EventData<TPayload = unknown, TMetadata = Record<string, unknown>> = Omit<
  EventEnvelope<TPayload, TMetadata>,
  "streamId" | "streamVersion"
>;

/** Define a versioned event contract with payload validation. */
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

/** Parse unknown input against an event definition payload schema. */
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
