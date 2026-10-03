# Architecture

Abbox compiles application source into a framework-independent Product IR. `compile(projectPath)` returns screens, navigation, declared design-system colors, and actions, including `schemaVersion`. `abbox compile` writes that same value to `abbox.json`.

## Package

Abbox is one npm package, not a monorepo. The package name is `abbox`, the version is `0.3.0`, and the license is Apache-2.0. `abbox@0.1.0` is published on npm. `private` is intentionally unset, and this step does not add a publish script.

The package is ESM. `package.json` `exports` maps the package root to `dist/index.js` and `dist/index.d.ts`. Tests and docs are not part of the published `files` list.

Node.js `>=22.12` is required. npm is the package manager.

TypeScript compiles this repository. Source analysis for TypeScript uses `ts-morph`. CSS uses PostCSS. Static color canonicalization uses culori behind `src/design/color-canonical.ts`.

## Layout

```text
src/
  cli.ts
  index.ts
  compiler/
    compile.ts
    discover-source-files.ts
    discover-stylesheet-files.ts
  design/
    color-canonical.ts
  ir/
    product-ir.ts
  frameworks/
    tanstack/
      file-routes.ts
      links.ts
      named-import.ts
    css/
      theme-colors.ts
    react/
      actions.ts
      jsx-handler.ts
      jsx-label.ts
      ui-button-import.ts
tests/fixtures/tanstack-file-routes/
tests/fixtures/tanstack-links/
tests/fixtures/tanstack-actions/
tests/fixtures/design-system-colors/
```

`src/compiler/compile.ts` discovers `.ts`, `.tsx`, and `.css` files (same skip directories for each), extracts TanStack screens and navigation, extracts static JSX actions, and extracts declared CSS theme colors.

`src/frameworks/react/actions.ts` walks JSX with ts-morph, emits invoke candidates from native `button` and recognized `ui/button` `Button` elements with recognized `onClick`, and submit candidates from `form` elements with recognized `onSubmit`. `buildActions` in `compile.ts` attaches the single screen `route` per file and sorts the result.

`src/frameworks/css/theme-colors.ts` parses CSS with PostCSS, reads `@theme` semantic `--color-*` declarations and `:root` / `.dark` physical custom properties, resolves one-level `var(--x)` aliases per theme, and emits `designSystem.themes` with optional canonical `hex`.

Product IR stays framework-independent under `src/ir/`. TanStack and CSS parser types do not appear in the public IR types.

## What is not decided in code

Do not add `Compiler`, `FrameworkAdapter`, `Analyzer`, `RuleRegistry`, `CompilerPlugin`, or `CompilerContext` ahead of a real need. If one of those seams is needed, it should emerge from the first compiler rules.
