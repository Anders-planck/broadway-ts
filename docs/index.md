---
layout: home
hero:
  name: Broadway TS
  text: TypeScript CQRS and Event Sourcing
  tagline: A small, framework-agnostic toolkit inspired by Broadway for PHP.
  actions:
    - theme: brand
      text: Get Started
      link: /getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/Anders-planck/broadway-ts
features:
  - title: CQRS core
    details: Define commands and queries once, validate input, and dispatch through typed buses.
  - title: Event sourcing
    details: Model aggregate state from event streams with optimistic concurrency contracts.
  - title: Typed validation
    details: Keep validation adapter-based. Start with Zod, add other Standard Schema-style adapters later.
  - title: Test helpers
    details: Use deterministic clocks, IDs, an in-memory event store, and aggregate scenarios.
---

## Status

Broadway TS is a prototype. The package shape is ready for review, but the first
npm release is not published yet.

## Packages

| Package | Purpose |
| --- | --- |
| `@broadway-ts/core` | Result, errors, schema contract, command/query definitions, buses, middleware |
| `@broadway-ts/event-sourcing` | Event definitions, event envelopes, aggregate base, event store contracts, repository |
| `@broadway-ts/zod` | Zod adapter for the Broadway TS schema contract |
| `@broadway-ts/testing` | In-memory event store, fixed clock, sequence IDs, aggregate scenario helper |
| `@broadway-ts/postgres` | Package shell for the future Postgres event store adapter |

## Design Goals

- Framework-neutral: no HTTP framework, DI container, database, or Node-only API
  in the core package.
- Type-first: definitions carry payload, result, and error types into handlers.
- Explicit failure: application code returns `Result<T, E>` instead of throwing
  for expected domain, validation, concurrency, and persistence failures.
- Adapter-based validation: schemas only need to implement the small Broadway TS
  `Schema<T>` contract.

## First Read

Start with [Getting Started](/getting-started), then read the two main guides:

- [Bank Account Tutorial](/tutorials/bank-account)
- [Command and Query Bus](/guides/command-query-bus)
- [Event Sourcing](/guides/event-sourcing)

Generated API docs are available at [/api/](/api/).

Release status is tracked in the [Release Checklist](/release).
