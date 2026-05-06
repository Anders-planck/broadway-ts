/** One validation issue for a specific payload path. */
export type ValidationIssue = {
  readonly path: readonly (string | number)[];
  readonly message: string;
  readonly code?: string;
};

/** Error returned when a command, query, or event payload fails validation. */
export type ValidationError = {
  readonly kind: "validation";
  readonly code: "validation.invalid_payload";
  readonly message: string;
  readonly issues: readonly ValidationIssue[];
};

/** Error returned when a bus has no handler for a message type. */
export type HandlerNotFoundError = {
  readonly kind: "handler_not_found";
  readonly code: "handler.not_found";
  readonly message: string;
  readonly handlerType: "command" | "query";
  readonly messageType: string;
};

/** Application-level business rule failure. */
export type DomainError = {
  readonly kind: "domain";
  readonly code: string;
  readonly message: string;
  readonly details?: unknown;
};

/** Optimistic concurrency failure from an event store append. */
export type ConcurrencyError = {
  readonly kind: "concurrency";
  readonly code: "event_store.concurrency_conflict";
  readonly message: string;
  readonly expectedVersion?: number | string;
  readonly actualVersion?: number;
};

/** Storage or adapter failure from an event store or repository. */
export type PersistenceError = {
  readonly kind: "persistence";
  readonly code: string;
  readonly message: string;
  readonly cause?: unknown;
};

/** Union of built-in Broadway TS error shapes. */
export type CqrsError =
  | ValidationError
  | HandlerNotFoundError
  | DomainError
  | ConcurrencyError
  | PersistenceError;

/** Create a validation error from validation issues. */
export const validationError = (issues: readonly ValidationIssue[]): ValidationError => ({
  kind: "validation",
  code: "validation.invalid_payload",
  message: "Payload validation failed",
  issues,
});

/** Create a missing handler error for a command or query type. */
export const handlerNotFoundError = (
  handlerType: "command" | "query",
  messageType: string,
): HandlerNotFoundError => ({
  kind: "handler_not_found",
  code: "handler.not_found",
  message: `No ${handlerType} handler registered for ${messageType}`,
  handlerType,
  messageType,
});

/** Create an application domain error. */
export const domainError = (
  code: string,
  message: string,
  details?: unknown,
): DomainError => ({
  kind: "domain",
  code,
  message,
  ...(details === undefined ? {} : { details }),
});

/** Create an optimistic concurrency error. */
export const concurrencyError = (
  expectedVersion: number | string,
  actualVersion?: number,
): ConcurrencyError => ({
  kind: "concurrency",
  code: "event_store.concurrency_conflict",
  message: "Event stream concurrency conflict",
  expectedVersion,
  ...(actualVersion === undefined ? {} : { actualVersion }),
});

/** Create a storage or adapter persistence error. */
export const persistenceError = (
  code: string,
  message: string,
  cause?: unknown,
): PersistenceError => ({
  kind: "persistence",
  code,
  message,
  ...(cause === undefined ? {} : { cause }),
});
