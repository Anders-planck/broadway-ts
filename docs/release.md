# Release Checklist

This page tracks the first npm release flow for Broadway TS.

## Current Release State

- Release workflow exists and is manual: `.github/workflows/release.yml`
- Changesets is configured in `.changeset/config.json`
- Initial patch changeset exists: `.changeset/repo-readiness.md`
- GitHub Pages docs deploy is active
- GitHub Actions workflow permissions are set to `write`
- Repository secret `NPM_TOKEN` exists
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

1. Run the manual `Release` workflow.
2. Review the Changesets release PR.
3. Merge the release PR if versions and changelog are correct.
4. Confirm the workflow publishes all package versions to npm.

`@broadway-ts/postgres` ships in the first release as a documented placeholder.
The real Postgres event store adapter remains tracked separately in issue #4.

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

1. Run the manual `Release` workflow.
2. Let Changesets open a release PR.
3. Merge the release PR.
4. Run or let the workflow publish the versioned packages.
