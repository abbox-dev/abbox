# Architecture

Abbox compiles application source into a framework-independent Product IR. Step 1 is the repository foundation only. There is no compiler, IR schema, or CLI command yet.

## Package

Abbox is one npm package, not a monorepo. The package name is `abbox`, the version is `0.0.0`, and the license is Apache-2.0. It is not published yet. `private` is intentionally unset, and this step does not add a publish script.

The package is ESM. `package.json` `exports` maps the package root to `dist/index.js` and `dist/index.d.ts`. Tests and docs are not part of the published `files` list.

Node.js `>=22.12` is required. npm is the package manager.

TypeScript compiles this repository. A specific TypeScript major is not an architectural requirement. The installed version is the current stable release that passes typecheck and build with ESM, `NodeNext`, and strict options. Abbox does not import TypeScript's programmatic API. Later source analysis is expected to use ts-morph, which is not installed yet.

## Layout

These paths are reserved. Empty directories are not created until the first implementation needs them.

```text
src/
  cli.ts
  index.ts
  compiler/
  ir/
  frameworks/
    tanstack/
tests/fixtures/<name>/
```

`src/index.ts` exists now and exports no public API. `src/cli.ts` and the `bin` entry `"abbox": "./dist/cli.js"` are added with the first real `compile` implementation.

Framework-specific source interpretation belongs under `src/frameworks/`. TanStack Start and TanStack Router knowledge will live in `src/frameworks/tanstack/`. Additional frameworks would be sibling directories, not new packages.

Product IR belongs under `src/ir/`. It must stay framework-independent and must not expose TanStack, React, ts-morph, or other framework or parser types. TanStack `createFileRoute()` becomes a Screen. `<Link>`, `navigate()`, and `redirect()` become navigation data. The same IR should be able to represent a later Next.js page, Vue route, or Angular route.

`src/compiler/` is for the framework-agnostic pipeline that will eventually connect framework interpretation to IR and to `abbox.json`.

## What is not decided in code

The future command is `abbox compile <path>`, writing `abbox.json`. The programmatic API should return IR, and the CLI should be a thin writer. Neither signature is frozen until the IR exists.

Do not add `Compiler`, `FrameworkAdapter`, `Analyzer`, `RuleRegistry`, `CompilerPlugin`, or `CompilerContext` ahead of a real implementation. If one of those seams is needed, it should emerge from the first compiler rules.
