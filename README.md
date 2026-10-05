# Abbox

Abbox is an open-source compiler that analyzes application source code and produces a framework-independent Product IR describing how the product works.

## Try it

Node.js `>=22.12` is required. From an application directory:

```bash
cd my-project
npx abbox compile
```

This writes `abbox.json` in that directory. Open https://viewer.abbox.com and upload the generated file.

`abbox.json` is a framework-independent description of the product. It is not specific to the Viewer, the CLI, or TanStack. It contains `schemaVersion`, screens, `navigation` from static TanStack `<Link>` elements, `designSystem.themes` from declared CSS `:root` / `.dark` and `@theme` color tokens, `actions` (with nested `effects`) from static JSX buttons and forms on discovered screens, and `entities` from declared TypeScript models when the v1 evidence rule matches. Commit `abbox.json` in the application repository.

See [docs/IR.md](docs/IR.md).

## This release

`abbox@0.1.0` writes screens found in static TanStack `createFileRoute("...")` calls. `Screen.route` is the user-facing destination. A dynamic segment such as `/projects/$projectId` is kept. An index route id such as `/programs/` is the destination `/programs`, not a second screen. When a parent route module and its index route are the same destination, the index module owns that screen. This repository also implements Link navigation in Product IR; that output appears after you compile with a build that includes navigation extraction.

An action's `effects` list the supported direct consequences extracted from its handler: a React state write, or a TanStack search update that stays on the current destination. `"effects": []` means no supported effect was extracted, not that the action does nothing. Not extracted yet: API calls, `navigate()` / `redirect()` as screen navigation, actual color usage in components, APIs, auth, and other frameworks.

Framework-specific interpretation stays in compiler code. The Product IR does not expose framework or parser types.

## Development

Node.js `>=22.12` is required.

```bash
npm ci
npm run typecheck
npm test
npm run lint
npm run build
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) and [docs/ROADMAP.md](docs/ROADMAP.md).

## License

Apache License 2.0. See [LICENSE](LICENSE).

Copyright © 2026 Kamran Elchuzade.
