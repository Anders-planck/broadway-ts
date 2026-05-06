# Release Checklist

This page tracks the first npm release flow for Broadway TS.

## Current Release State

- Release workflow exists and is manual: `.github/workflows/release.yml`
- Changesets is configured in `.changeset/config.json`
- Initial patch changeset exists: `.changeset/repo-readiness.md`
- GitHub Pages docs deploy is active
- `pnpm run ci` builds packages, runs tests, typechecks, generates TypeDoc, and
  builds VitePress docs

## npm Registry Check

Checked on 2026-05-06:

| Package | npm result |
| --- | --- |
| `@broadway-ts/core` | `E404`, not publicly published |
| `@broadway-ts/event-sourcing` | `E404`, not publicly published |
| `@broadway-ts/zod` | `E404`, not publicly published |
| `@broadway-ts/testing` | `E404`, not publicly published |
| `@broadway-ts/postgres` | `E404`, not publicly published |

`npm whoami` returns `anders-game`, so the local npm CLI is authenticated.
`npm org ls broadway-ts` returns `anders-game - owner`, so the `@broadway-ts`
npm org/scope exists and the authenticated npm account can publish under it.

## Pack Dry Run

`npm pack --dry-run --json` was verified for every publishable package.

| Package | Entries | Contents |
| --- | ---: | --- |
| `@broadway-ts/core` | 3 | `dist/index.d.ts`, `dist/index.js`, `package.json` |
| `@broadway-ts/event-sourcing` | 3 | `dist/index.d.ts`, `dist/index.js`, `package.json` |
| `@broadway-ts/zod` | 3 | `dist/index.d.ts`, `dist/index.js`, `package.json` |
| `@broadway-ts/testing` | 3 | `dist/index.d.ts`, `dist/index.js`, `package.json` |
| `@broadway-ts/postgres` | 3 | `dist/index.d.ts`, `dist/index.js`, `package.json` |

## Required Before Publish

1. Create an npm automation token for `anders-game`.
2. Add `NPM_TOKEN` to GitHub repository secrets.
3. Enable the GitHub repository setting that allows Actions to create pull
   requests if using Changesets release PRs.
4. Decide whether `@broadway-ts/postgres` should ship as a placeholder in the
   first release.

## Release Commands

Local verification:

```bash
pnpm run ci
cd packages/core
npm pack --dry-run --json
```

Manual release flow:

```bash
pnpm changeset
pnpm version-packages
pnpm release
```

GitHub flow:

1. Add `NPM_TOKEN` to repository secrets.
2. Run the manual `Release` workflow.
3. Let Changesets open a release PR.
4. Merge the release PR.
5. Run or let the workflow publish the versioned packages.
