# Release Checklist

This page tracks the first npm release flow for Broadway TS.

## Current Release State

- Release workflow exists and is manual: `.github/workflows/release.yml`
- Changesets is configured in `.changeset/config.json`
- Initial patch changeset was consumed by the first release PR
- GitHub Pages docs deploy is active
- GitHub Actions workflow permissions are set to `write`
- Repository secret `NPM_TOKEN` exists
- `pnpm run ci` builds packages, runs tests, typechecks, generates TypeDoc, and
  builds VitePress docs
- First release PR: `https://github.com/Anders-planck/broadway-ts/pull/11`
- First publish workflow run:
  `https://github.com/Anders-planck/broadway-ts/actions/runs/25456560797`

## npm Registry Check

Checked on 2026-05-06 with `npm view <package> version --prefer-online`:

| Package | npm result |
| --- | --- |
| `@broadway-ts/core` | `0.0.1`, public |
| `@broadway-ts/event-sourcing` | `0.0.1`, public |
| `@broadway-ts/zod` | `0.0.1`, public |
| `@broadway-ts/testing` | `0.0.1`, public |
| `@broadway-ts/postgres` | `0.0.1`, public |

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

## First Release Result

1. Manual `Release` workflow opened the Changesets release PR.
2. Release PR was reviewed, adjusted to keep internal peer dependency upper
   bounds, and merged.
3. Manual `Release` workflow was run again on `main`.
4. Changesets published all package versions to npm as public `0.0.1` packages.

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
4. Run the manual `Release` workflow again on `main` to publish the versioned
   packages.
