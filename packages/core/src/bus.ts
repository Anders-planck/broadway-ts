import {
  handlerNotFoundError,
  type CqrsError,
  type HandlerNotFoundError,
  type ValidationError,
} from "./errors.js";
import {
  parseCommand,
  parseQuery,
  type CommandDefinition,
  type CommandOf,
  type ErrorOf,
  type QueryDefinition,
  type QueryOf,
  type ResultOf,
} from "./definition.js";
import { err, type Awaitable, type Result } from "./result.js";

/** Context passed through bus middleware and handlers. */
export type BusContext = {
  readonly correlationId?: string;
  readonly causationId?: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
  readonly signal?: AbortSignal;
};

/** Handler for a command definition. */
export type CommandHandler<
  TDefinition extends CommandDefinition<string, unknown, unknown, CqrsError>,
  TContext extends BusContext = BusContext,
> = (
  command: CommandOf<TDefinition>,
  ctx: TContext,
) => Awaitable<Result<ResultOf<TDefinition>, ErrorOf<TDefinition>>>;

/** Handler for a query definition. */
export type QueryHandler<
  TDefinition extends QueryDefinition<string, unknown, unknown, CqrsError>,
  TContext extends BusContext = BusContext,
> = (
  query: QueryOf<TDefinition>,
  ctx: TContext,
) => Awaitable<Result<ResultOf<TDefinition>, ErrorOf<TDefinition>>>;

/** Any typed command message accepted by command middleware. */
export type AnyCommand = CommandOf<CommandDefinition<string, unknown, unknown, CqrsError>>;

/** Any typed query message accepted by query middleware. */
export type AnyQuery = QueryOf<QueryDefinition<string, unknown, unknown, CqrsError>>;

/** Middleware that wraps command handler execution. */
export type CommandMiddleware<TContext extends BusContext = BusContext> = (
  command: AnyCommand,
  ctx: TContext,
  next: () => Promise<Result<unknown, CqrsError>>,
) => Awaitable<Result<unknown, CqrsError>>;

/** Middleware that wraps query handler execution. */
export type QueryMiddleware<TContext extends BusContext = BusContext> = (
  query: AnyQuery,
  ctx: TContext,
  next: () => Promise<Result<unknown, CqrsError>>,
) => Awaitable<Result<unknown, CqrsError>>;

type AnyCommandHandler<TContext extends BusContext> = (
  command: AnyCommand,
  ctx: TContext,
) => Promise<Result<unknown, CqrsError>>;

type AnyQueryHandler<TContext extends BusContext> = (
  query: AnyQuery,
  ctx: TContext,
) => Promise<Result<unknown, CqrsError>>;

type AnyNext = () => Promise<Result<unknown, CqrsError>>;

type ExecuteContextArgs<TContext extends BusContext> = BusContext extends TContext
  ? [ctx?: TContext]
  : [ctx: TContext];

type BusError<TDefinition> =
  | ErrorOf<TDefinition>
  | ValidationError
  | HandlerNotFoundError
  | CqrsError;

/** Validates and dispatches commands to registered handlers. */
export class CommandBus<TContext extends BusContext = BusContext> {
  readonly #handlers = new Map<string, AnyCommandHandler<TContext>>();
  readonly #middleware: CommandMiddleware<TContext>[] = [];

  /** Register exactly one handler for a command definition. */
  register<TDefinition extends CommandDefinition<string, unknown, unknown, CqrsError>>(
    definition: TDefinition,
    handler: CommandHandler<TDefinition, TContext>,
  ): this {
    if (this.#handlers.has(definition.type)) {
      throw new Error(`Command handler already registered for ${definition.type}`);
    }

    this.#handlers.set(definition.type, async (command, ctx) =>
      handler(command as CommandOf<TDefinition>, ctx),
    );
    return this;
  }

  /** Add middleware to the command execution pipeline. */
  use(middleware: CommandMiddleware<TContext>): this {
    this.#middleware.push(middleware);
    return this;
  }

  /** Validate input, run middleware, and invoke the registered command handler. */
  async execute<TDefinition extends CommandDefinition<string, unknown, unknown, CqrsError>>(
    definition: TDefinition,
    input: unknown,
    ...args: ExecuteContextArgs<TContext>
  ): Promise<Result<ResultOf<TDefinition>, BusError<TDefinition>>> {
    const ctx = (args[0] ?? {}) as TContext;
    const parsed = await parseCommand(definition, input);

    if (!parsed.ok) {
      return err(parsed.error);
    }

    const handler = this.#handlers.get(definition.type);

    if (!handler) {
      return err(handlerNotFoundError("command", definition.type));
    }

    const invokeHandler: AnyNext = () => handler(parsed.value, ctx);
    const pipeline = this.#middleware.reduceRight<AnyNext>(
      (next, middleware) => async () => middleware(parsed.value, ctx, next),
      invokeHandler,
    );

    const result = await pipeline();
    return result as Result<ResultOf<TDefinition>, BusError<TDefinition>>;
  }
}

/** Validates and dispatches queries to registered handlers. */
export class QueryBus<TContext extends BusContext = BusContext> {
  readonly #handlers = new Map<string, AnyQueryHandler<TContext>>();
  readonly #middleware: QueryMiddleware<TContext>[] = [];

  /** Register exactly one handler for a query definition. */
  register<TDefinition extends QueryDefinition<string, unknown, unknown, CqrsError>>(
    definition: TDefinition,
    handler: QueryHandler<TDefinition, TContext>,
  ): this {
    if (this.#handlers.has(definition.type)) {
      throw new Error(`Query handler already registered for ${definition.type}`);
    }

    this.#handlers.set(definition.type, async (query, ctx) =>
      handler(query as QueryOf<TDefinition>, ctx),
    );
    return this;
  }

  /** Add middleware to the query execution pipeline. */
  use(middleware: QueryMiddleware<TContext>): this {
    this.#middleware.push(middleware);
    return this;
  }

  /** Validate input, run middleware, and invoke the registered query handler. */
  async execute<TDefinition extends QueryDefinition<string, unknown, unknown, CqrsError>>(
    definition: TDefinition,
    input: unknown,
    ...args: ExecuteContextArgs<TContext>
  ): Promise<Result<ResultOf<TDefinition>, BusError<TDefinition>>> {
    const ctx = (args[0] ?? {}) as TContext;
    const parsed = await parseQuery(definition, input);

    if (!parsed.ok) {
      return err(parsed.error);
    }

    const handler = this.#handlers.get(definition.type);

    if (!handler) {
      return err(handlerNotFoundError("query", definition.type));
    }

    const invokeHandler: AnyNext = () => handler(parsed.value, ctx);
    const pipeline = this.#middleware.reduceRight<AnyNext>(
      (next, middleware) => async () => middleware(parsed.value, ctx, next),
      invokeHandler,
    );

    const result = await pipeline();
    return result as Result<ResultOf<TDefinition>, BusError<TDefinition>>;
  }
}
