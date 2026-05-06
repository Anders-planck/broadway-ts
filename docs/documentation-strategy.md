# Documentation Strategy

This page records the docs approach used for Broadway TS.

## Inputs Analyzed

- [Diataxis](https://diataxis.fr/) separates docs into tutorials, how-to guides,
  explanation, and reference. Broadway TS uses that as the content model.
- [VitePress](https://vitepress.dev/) gives a Markdown-first static docs site
  with local search, navigation, clean URLs, and GitHub edit links.
- [TypeDoc](https://typedoc.org/) generates static HTML API docs from exported
  TypeScript symbols.
- [Mintlify](https://mintlify.com/docs/quickstart) is a useful reference for
  concise, task-focused developer docs and AI-readable docs, but Broadway TS can
  keep the stack simpler with VitePress.

## Decision

Use VitePress now, with hand-written docs organized by Diataxis-style intent:

- Start: overview and getting started
- Guides: practical tasks
- Concepts: design explanation and trade-offs
- Reference: exported package surface
- Project: roadmap and release state

## Generated API

TypeDoc output is generated into `docs/public/api` during `pnpm docs:build`.
VitePress copies that static output to `/api/`. The generated files are not
committed; source comments and TypeDoc config are.

## Page Rules

- Every guide starts from a concrete user task.
- Every reference page maps directly to one package.
- Code examples must compile against the intended public API.
- Expected failure behavior must use `Result`, not exceptions.
- Storage docs must avoid promising production behavior before the adapter
  exists.

## AI-Readable Entry

`docs/public/llms.txt` gives language models and coding agents a compact index
of the docs site and package boundaries.
