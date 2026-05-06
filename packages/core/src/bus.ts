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

export type BusContext = {
  readonly correlationId?: string;
  readonly causationId?: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
  readonly signal?: AbortSignal;
};

export type CommandHandler<
  TDefinition extends CommandDefinition<string, unknown, unknown, CqrsError>,
  TContext extends BusContext = BusContext,
> = (
  command: CommandOf<TDefinition>,
  ctx: TContext,
) => Awaitable<Result<ResultOf<TDefinition>, ErrorOf<TDefinition>>>;

export type QueryHandler<
  TDefinition extends QueryDefinition<string, unknown, unknown, CqrsError>,
  TContext extends BusContext = BusContext,
> = (
  query: QueryOf<TDefinition>,
  ctx: TContext,
) => Awaitable<Result<ResultOf<TDefinition>, ErrorOf<TDefinition>>>;

export type CommandMiddleware<
  TDefinition extends CommandDefinition<string, unknown, unknown, CqrsError>,
  TContext extends BusContext = BusContext,
> = (
  command: CommandOf<TDefinition>,
  ctx: TContext,
  next: () => Promise<Result<ResultOf<TDefinition>, ErrorOf<TDefinition> | CqrsError>>,
) => Awaitable<Result<ResultOf<TDefinition>, ErrorOf<TDefinition> | CqrsError>>;

export type QueryMiddleware<
  TDefinition extends QueryDefinition<string, unknown, unknown, CqrsError>,
  TContext extends BusContext = BusContext,
> = (
  query: QueryOf<TDefinition>,
  ctx: TContext,
  next: () => Promise<Result<ResultOf<TDefinition>, ErrorOf<TDefinition> | CqrsError>>,
) => Awaitable<Result<ResultOf<TDefinition>, ErrorOf<TDefinition> | CqrsError>>;

type AnyCommandHandler<TContext extends BusContext> = (
  command: CommandOf<CommandDefinition<string, unknown, unknown, CqrsError>>,
  ctx: TContext,
) => Promise<Result<unknown, CqrsError>>;

type AnyQueryHandler<TContext extends BusContext> = (
  query: QueryOf<QueryDefinition<string, unknown, unknown, CqrsError>>,
  ctx: TContext,
) => Promise<Result<unknown, CqrsError>>;

type AnyCommandMiddleware<TContext extends BusContext> = (
  command: CommandOf<CommandDefinition<string, unknown, unknown, CqrsError>>,
  ctx: TContext,
  next: () => Promise<Result<unknown, CqrsError>>,
) => Promise<Result<unknown, CqrsError>>;

type AnyQueryMiddleware<TContext extends BusContext> = (
  query: QueryOf<QueryDefinition<string, unknown, unknown, CqrsError>>,
  ctx: TContext,
  next: () => Promise<Result<unknown, CqrsError>>,
) => Promise<Result<unknown, CqrsError>>;

type AnyNext = () => Promise<Result<unknown, CqrsError>>;

type BusError<TDefinition> =
  | ErrorOf<TDefinition>
  | ValidationError
  | HandlerNotFoundError
  | CqrsError;

export class CommandBus<TContext extends BusContext = BusContext> {
  readonly #handlers = new Map<string, AnyCommandHandler<TContext>>();
  readonly #middleware: AnyCommandMiddleware<TContext>[] = [];

  register<TDefinition extends CommandDefinition<string, unknown, unknown, CqrsError>>(
    definition: TDefinition,
    handler: CommandHandler<TDefinition, TContext>,
  ): this {
    this.#handlers.set(definition.type, async (command, ctx) =>
      handler(command as CommandOf<TDefinition>, ctx),
    );
    return this;
  }

  use<TDefinition extends CommandDefinition<string, unknown, unknown, CqrsError>>(
    middleware: CommandMiddleware<TDefinition, TContext>,
  ): this {
    this.#middleware.push(async (command, ctx, next) => {
      const typedNext = next as () => Promise<
        Result<ResultOf<TDefinition>, ErrorOf<TDefinition> | CqrsError>
      >;

      return middleware(command as CommandOf<TDefinition>, ctx, typedNext);
    });
    return this;
  }

  async execute<TDefinition extends CommandDefinition<string, unknown, unknown, CqrsError>>(
    definition: TDefinition,
    input: unknown,
    ctx = {} as TContext,
  ): Promise<Result<ResultOf<TDefinition>, BusError<TDefinition>>> {
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
      (next, middleware) => () => middleware(parsed.value, ctx, next),
      invokeHandler,
    );

    const result = await pipeline();
    return result as Result<ResultOf<TDefinition>, BusError<TDefinition>>;
  }
}

export class QueryBus<TContext extends BusContext = BusContext> {
  readonly #handlers = new Map<string, AnyQueryHandler<TContext>>();
  readonly #middleware: AnyQueryMiddleware<TContext>[] = [];

  register<TDefinition extends QueryDefinition<string, unknown, unknown, CqrsError>>(
    definition: TDefinition,
    handler: QueryHandler<TDefinition, TContext>,
  ): this {
    this.#handlers.set(definition.type, async (query, ctx) =>
      handler(query as QueryOf<TDefinition>, ctx),
    );
    return this;
  }

  use<TDefinition extends QueryDefinition<string, unknown, unknown, CqrsError>>(
    middleware: QueryMiddleware<TDefinition, TContext>,
  ): this {
    this.#middleware.push(async (query, ctx, next) => {
      const typedNext = next as () => Promise<
        Result<ResultOf<TDefinition>, ErrorOf<TDefinition> | CqrsError>
      >;

      return middleware(query as QueryOf<TDefinition>, ctx, typedNext);
    });
    return this;
  }

  async execute<TDefinition extends QueryDefinition<string, unknown, unknown, CqrsError>>(
    definition: TDefinition,
    input: unknown,
    ctx = {} as TContext,
  ): Promise<Result<ResultOf<TDefinition>, BusError<TDefinition>>> {
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
      (next, middleware) => () => middleware(parsed.value, ctx, next),
      invokeHandler,
    );

    const result = await pipeline();
    return result as Result<ResultOf<TDefinition>, BusError<TDefinition>>;
  }
}
