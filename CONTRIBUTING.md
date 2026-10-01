# Contributing

Abbox is intended to accept open-source contributions. See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## Setup

Node.js `>=22.12` is required.

```bash
npm ci
npm run typecheck
npm test
npm run lint
npm run format
```

Biome formats and lints the repository.

## Git workflow

`main` is the default branch and should remain in a working state. Develop meaningful changes on a short-lived branch, including work by maintainers, and merge that branch into `main` through a pull request.

```text
main
  ↓
short-lived branch
  ↓
commits
  ↓
pull request
  ↓
CI
  ↓
squash merge
  ↓
main
```

### Branches

Use a short name that describes the change, with one of these prefixes:

- `feat/` — new functionality
- `fix/` — bug fixes
- `docs/` — documentation-only changes
- `refactor/` — code restructuring without intended behavior changes
- `chore/` — tooling, configuration, dependencies, or maintenance

```text
feat/product-ir-routes
fix/dynamic-route-handling
docs/ir-documentation
```

Branch names do not include contributor names, dates, issue numbers, or internal step names such as `step-2`.

### Commits

Use a lightweight Conventional Commits message:

```text
type: short description
```

Common types are `feat`, `fix`, `test`, `docs`, `refactor`, and `chore`.

```text
feat: add Product IR screen type
test: add TanStack route fixtures
docs: document Product IR screens
```

A commit is one understandable unit of work. Scopes such as `feat(ir):` are not used.

### Pull requests

A pull request should describe what changed, explain why, and mention important scope exclusions when they matter. Repository CI passes before merge. Keep each pull request to one coherent change. Product IR screen types, TanStack route extraction, the fixtures and tests for that capability, and its documentation can belong in one pull request.

### Merge

Squash and merge is the preferred strategy. The branch can keep intermediate commits, and `main` stays concise. Signed commits, a required number of reviewers, issue links, release branches, Git Flow, and a long-lived `develop` branch are not part of this workflow.

## Future compiler changes

Once the compiler exists, a behavior change should follow this loop:

1. Add a fixture.
2. Define the expected Product IR.
3. Add or update one compiler rule.
4. Add a test.

v0 does not need a plugin system, framework adapter interface, or rule registry. Proposals for those abstractions should wait until a real compiler rule shows they are necessary.

## Scope

v0 is screens/routes and navigation for TanStack Start / TanStack Router, written to `abbox.json`. Do not add actions, forms, database access, server functions, API calls, authentication analysis, other frameworks, AI, a web UI, or GitHub integration in that version.
