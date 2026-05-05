export type ValidationIssue = {
  readonly path: readonly (string | number)[];
  readonly message: string;
  readonly code?: string;
};

export type ValidationError = {
  readonly kind: "validation";
  readonly code: "validation.invalid_payload";
  readonly message: string;
  readonly issues: readonly ValidationIssue[];
};

export type HandlerNotFoundError = {
  readonly kind: "handler_not_found";
  readonly code: "handler.not_found";
  readonly message: string;
  readonly handlerType: "command" | "query";
  readonly messageType: string;
};

export type DomainError = {
  readonly kind: "domain";
  readonly code: string;
  readonly message: string;
  readonly details?: unknown;
};

export type ConcurrencyError = {
  readonly kind: "concurrency";
  readonly code: "event_store.concurrency_conflict";
  readonly message: string;
  readonly expectedVersion?: number | string;
  readonly actualVersion?: number;
};

export type PersistenceError = {
  readonly kind: "persistence";
  readonly code: string;
  readonly message: string;
  readonly cause?: unknown;
};

export type CqrsError =
  | ValidationError
  | HandlerNotFoundError
  | DomainError
  | ConcurrencyError
  | PersistenceError;

export const validationError = (issues: readonly ValidationIssue[]): ValidationError => ({
  kind: "validation",
  code: "validation.invalid_payload",
  message: "Payload validation failed",
  issues,
});

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
