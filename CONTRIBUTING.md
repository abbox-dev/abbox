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

## Future compiler changes

Once the compiler exists, a behavior change should follow this loop:

1. Add a fixture.
2. Define the expected Product IR.
3. Add or update one compiler rule.
4. Add a test.

v0 does not need a plugin system, framework adapter interface, or rule registry. Proposals for those abstractions should wait until a real compiler rule shows they are necessary.

## Scope

v0 is screens/routes and navigation for TanStack Start / TanStack Router, written to `abbox.json`. Do not add actions, forms, database access, server functions, API calls, authentication analysis, other frameworks, AI, a web UI, or GitHub integration in that version.
