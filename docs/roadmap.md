# Roadmap

## Before First npm Release

- Run the manual Release workflow
- Review and merge the Changesets release PR
- Confirm npm packages are published

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

## Completed

- Type-level tests for public API inference
- GitHub Pages documentation deploy
- Generated API docs with TypeDoc
- End-to-end bank-account tutorial page
- Public package pack dry-run for all publishable packages
- npm org/scope `@broadway-ts` created with `anders-game` owner access
- `NPM_TOKEN` added to GitHub repository secrets
- GitHub Actions workflow permissions set to `write`
- `@broadway-ts/postgres` selected for first release as a documented placeholder
