# Architecture

Abbox compiles application source into a framework-independent Product IR. `compile(projectPath)` returns screens discovered from static TanStack file routes, including `schemaVersion`. `abbox compile` writes that same value to `abbox.json`.

## Package

Abbox is one npm package, not a monorepo. The package name is `abbox`, the version is `0.1.0`, and the license is Apache-2.0. It is not published yet. `private` is intentionally unset, and this step does not add a publish script.

The package is ESM. `package.json` `exports` maps the package root to `dist/index.js` and `dist/index.d.ts`. Tests and docs are not part of the published `files` list.

Node.js `>=22.12` is required. npm is the package manager.

TypeScript compiles this repository. A specific TypeScript major is not an architectural requirement. The installed version is the current stable release that passes typecheck and build with ESM, `NodeNext`, and strict options. Abbox does not import TypeScript's programmatic API. Source analysis uses `ts-morph`, which vendors its own compiler.

## Layout

```text
src/
  cli.ts
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

`src/index.ts` exports `compile`, `productIrSchemaVersion`, and the Product IR types. `src/cli.ts` is the `abbox` command. `package.json` maps `bin.abbox` to `dist/cli.js`. The CLI calls `compile` and writes the result. It does not add fields of its own.

`src/compiler/compile.ts` checks the project path, discovers `.ts` and `.tsx` files, and maps route hits into screens. Discovery skips `node_modules`, `dist`, `build`, `coverage`, and `.git`, and sorts paths so a run is repeatable. That sort is not a Product IR guarantee.

`src/frameworks/tanstack/file-routes.ts` is the only module that knows `createFileRoute` and the `@tanstack/react-router` import. Additional frameworks would be sibling directories, not new packages.

Product IR belongs under `src/ir/`. It must stay framework-independent and must not expose TanStack, React, ts-morph, or other framework or parser types. `schemaVersion` is part of that contract. A static TanStack `createFileRoute()` call becomes a Screen. `<Link>`, `navigate()`, and `redirect()` will become navigation data later. The same IR should be able to represent a later Next.js page, Vue route, or Angular route.

## What is not decided in code

Do not add `Compiler`, `FrameworkAdapter`, `Analyzer`, `RuleRegistry`, `CompilerPlugin`, or `CompilerContext` ahead of a real need. If one of those seams is needed, it should emerge from the first compiler rules.
