# Roadmap

## Before First npm Release

- Confirm npm scope `@broadway-ts`
- Add `NPM_TOKEN` to GitHub repository secrets
- Run the manual Release workflow
- Add type-level tests for public API inference
- Decide whether `@broadway-ts/postgres` ships as a placeholder or waits for a
  working adapter

## Package Work

- Implement Postgres event store
- Add projection checkpoint contracts
- Add event upcasting
- Add outbox/inbox support
- Add aggregate snapshots
- Add framework adapter examples

## Documentation Work

- Add generated API docs with TypeDoc after TSDoc comments are added to exports
- Add an end-to-end bank-account tutorial page
- Add production storage guide once Postgres adapter exists
- Publish docs to GitHub Pages or another static host

## Repository Work

- Create GitHub issues from this roadmap
- Add branch protection requiring CI
- Add release notes template
- Add contribution guide
