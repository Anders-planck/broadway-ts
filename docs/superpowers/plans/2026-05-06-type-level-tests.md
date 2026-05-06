# Type-Level Tests Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add compile-time tests that protect Broadway TS public API inference.

**Architecture:** Use Vitest's `expectTypeOf` inside package test files. Existing package `tsconfig.json` files already include tests, so `pnpm typecheck` verifies the type assertions and CI already runs them.

**Tech Stack:** TypeScript, Vitest `expectTypeOf`, existing pnpm workspace scripts.

---

### Task 1: Core Type Inference

**Files:**
- Create: `packages/core/test/type-inference.test.ts`
- Modify: `docs/reference/core.md`
- Modify: `README.md`

- [x] **Step 1: Add compile-time assertions for command/query definitions**

Assert `PayloadOf`, `ResultOf`, `ErrorOf`, `CommandOf`, and `QueryOf` preserve inferred schema, result, error, and literal message type information.

- [x] **Step 2: Add compile-time assertions for bus handlers**

Assert command handlers receive validated payloads and custom bus contexts.

### Task 2: Event Sourcing Type Inference

**Files:**
- Create: `packages/event-sourcing/test/type-inference.test.ts`
- Modify: `docs/reference/event-sourcing.md`

- [x] **Step 1: Add compile-time assertions for event definitions**

Assert `defineEvent` preserves payload type, event type literal, and version literal.

- [x] **Step 2: Add compile-time assertions for repository contracts**

Assert `AggregateRepository.load` and `AggregateRepository.save` expose expected `Result` types.

### Task 3: Adapter and Testing Type Inference

**Files:**
- Create: `packages/zod/test/type-inference.test.ts`
- Modify: `packages/testing/test/type-inference.test.ts`
- Modify: `docs/guides/testing.md`
- Modify: `docs/reference/zod.md`
- Modify: `docs/reference/testing.md`

- [x] **Step 1: Add compile-time assertions for `zodSchema`**

Assert Zod schemas adapt to `Schema<T>` and preserve `InferSchema<TSchema>`.

- [x] **Step 2: Add compile-time assertions for testing helpers**

Assert the in-memory store implements `EventStore` and `aggregateScenario.when` preserves action result types.

### Task 4: Verification

**Files:**
- Modify: `docs/public/llms.txt`

- [x] **Step 1: Document verification**

Document that type-level tests run through `pnpm typecheck` and therefore `pnpm run ci`.

- [x] **Step 2: Verify**

Run `pnpm run ci`. Expected: package build, runtime tests, typecheck, TypeDoc, and VitePress build all pass.
