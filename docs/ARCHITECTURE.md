# Architecture

Abbox compiles application source into a framework-independent Product IR. `compile(projectPath)` returns screens, navigation, declared design-system colors, actions (with nested effects), and entities, including `schemaVersion`. `abbox compile` writes that same value to `abbox.json`.

## Package

Abbox is one npm package, not a monorepo. The package name is `abbox`, the version is `0.5.0`, and the license is Apache-2.0.

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
    css/
      theme-colors.ts
    react/
      actions.ts
      handler-effects.ts
      jsx-handler.ts
      jsx-label.ts
      state-effect.ts
      ui-button-import.ts
    tanstack/
      file-routes.ts
      links.ts
      named-import.ts
      search-effect.ts
    typescript/
      entity-models.ts
tests/fixtures/tanstack-file-routes/
tests/fixtures/tanstack-links/
tests/fixtures/tanstack-actions/
tests/fixtures/tanstack-effects/
tests/fixtures/tanstack-destinations/
tests/fixtures/entity-models/
tests/fixtures/design-system-colors/
```

`src/compiler/compile.ts` discovers `.ts`, `.tsx`, and `.css` files (same skip directories for each), extracts TanStack screens and navigation, static JSX actions and nested handler effects, declared CSS theme colors, and entities from TypeScript model evidence.

`src/frameworks/typescript/entity-models.ts` emits entities when a file exports an object type or interface and an exported `N[]` / `Array<N>` collection for the same name.

`src/frameworks/react/actions.ts` walks JSX with ts-morph, emits invoke and submit candidates, and attaches extracted effects. `buildActions` in `compile.ts` attaches the screen destination per file and sorts the result.

`src/frameworks/css/theme-colors.ts` parses CSS with PostCSS, reads `@theme` semantic `--color-*` declarations and `:root` / `.dark` physical custom properties, resolves one-level `var(--x)` aliases per theme, and emits `designSystem.themes` with optional canonical `hex`.

Product IR stays framework-independent under `src/ir/`. TanStack and CSS parser types do not appear in the public IR types.

## What is not decided in code

Do not add `Compiler`, `FrameworkAdapter`, `Analyzer`, `RuleRegistry`, `CompilerPlugin`, or `CompilerContext` ahead of a real need. If one of those seams is needed, it should emerge from the first compiler rules.
