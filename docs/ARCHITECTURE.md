# Architecture

Abbox compiles application source into a framework-independent Product IR. `compile(projectPath)` currently returns screens discovered from static TanStack file routes. There is no CLI command yet.

## Package

Abbox is one npm package, not a monorepo. The package name is `abbox`, the version is `0.0.0`, and the license is Apache-2.0. It is not published yet. `private` is intentionally unset, and this step does not add a publish script.

The package is ESM. `package.json` `exports` maps the package root to `dist/index.js` and `dist/index.d.ts`. Tests and docs are not part of the published `files` list.

Node.js `>=22.12` is required. npm is the package manager.

TypeScript compiles this repository. A specific TypeScript major is not an architectural requirement. The installed version is the current stable release that passes typecheck and build with ESM, `NodeNext`, and strict options. Abbox does not import TypeScript's programmatic API. Source analysis uses `ts-morph`, which vendors its own compiler.

## Layout

```text
src/
  index.ts
  compiler/
    compile.ts
    discover-source-files.ts
  ir/
    product-ir.ts
  frameworks/
    tanstack/
      file-routes.ts
tests/fixtures/tanstack-file-routes/
```

`src/index.ts` exports `compile` and the Product IR types. `src/cli.ts` and the `bin` entry `"abbox": "./dist/cli.js"` are added with the first real `compile` command.

`src/compiler/compile.ts` checks the project path, discovers `.ts` and `.tsx` files, and maps route hits into screens. Discovery skips `node_modules`, `dist`, `build`, `coverage`, and `.git`, and sorts paths so a run is repeatable. That sort is not a Product IR guarantee.

`src/frameworks/tanstack/file-routes.ts` is the only module that knows `createFileRoute` and the `@tanstack/react-router` import. Additional frameworks would be sibling directories, not new packages.

Product IR belongs under `src/ir/`. It must stay framework-independent and must not expose TanStack, React, ts-morph, or other framework or parser types. A static TanStack `createFileRoute()` call becomes a Screen. `<Link>`, `navigate()`, and `redirect()` will become navigation data later. The same IR should be able to represent a later Next.js page, Vue route, or Angular route.

## What is not decided in code

The future command is `abbox compile <path>`, writing `abbox.json`. The CLI should be a thin writer around `compile`. `schemaVersion` arrives with that file.

Do not add `Compiler`, `FrameworkAdapter`, `Analyzer`, `RuleRegistry`, `CompilerPlugin`, or `CompilerContext` ahead of a real need. If one of those seams is needed, it should emerge from the first compiler rules.
