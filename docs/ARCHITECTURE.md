# Architecture

Abbox compiles application source into a framework-independent Product IR. `compile(projectPath)` returns screens, navigation, global navigation, declared design-system colors, interactions (with nested effects), static screen-attributed content, and entities, including `schemaVersion` `"2"`. `abbox compile` writes that same value to `abbox.json`.

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
      interactions.ts
      interaction-id.ts
      component-interactions.ts
      component-navigation.ts
      direct-component-imports.ts
      handler-effects.ts
      jsx-handler.ts
      component-product-links.ts
      jsx-label.ts
      state-effect.ts
      ui-button-import.ts
    tanstack/
      anchor-elements.ts
      file-routes.ts
      links.ts
      root-chrome.ts
      static-href-target.ts
      named-import.ts
      search-effect.ts
    typescript/
      entity-models.ts
      module-resolve.ts
      barrel-module.ts
tests/fixtures/tanstack-file-routes/
tests/fixtures/tanstack-navigation-v2/
tests/fixtures/tanstack-actions/
tests/fixtures/tanstack-effects/
tests/fixtures/tanstack-destinations/
tests/fixtures/tanstack-product-links/
tests/fixtures/entity-models/
tests/fixtures/design-system-colors/
```

`src/compiler/compile.ts` discovers `.ts`, `.tsx`, and `.css` files (same skip directories for each), extracts TanStack screens, screen-attributed navigation, global navigation from root layout chrome, screen-attributed and global product links from static native anchors, static JSX interactions and nested handler effects, declared CSS theme colors, and entities from TypeScript model evidence.

TanStack-specific navigation rules live under `src/frameworks/tanstack/` (`links.ts`, `static-link-destination.ts`, `anchor-elements.ts`, `static-href-target.ts`, `root-chrome.ts`) and `src/frameworks/react/component-navigation.ts`, `component-product-links.ts`, and `jsx-literal-props.ts` for direct component attribution and one-hop literal props. Plain `<a href>` screen targets merge into the same navigation lowering as `<Link to>`. Product IR field names (`navigation`, `globalNavigation`, `links`, `globalLinks`) stay framework-independent in `src/ir/product-ir.ts`.

`src/frameworks/typescript/entity-models.ts` emits entities when a file exports an object type or interface and an exported `N[]` / `Array<N>` collection for the same name.

`src/frameworks/react/interactions.ts` walks JSX with ts-morph, emits activation and submit candidates, and attaches extracted effects. `component-interactions.ts` attributes supported interactions from directly rendered imported component export bodies (same boundary as Navigation V2). `build-interactions.ts` assigns deterministic ids, dedupes only true duplicates, attaches screen destinations, and sorts by route, trigger, and id.

`src/frameworks/css/theme-colors.ts` parses CSS with PostCSS, reads `@theme` semantic `--color-*` declarations and `:root` / `.dark` physical custom properties, resolves one-level `var(--x)` aliases per theme, and emits `designSystem.themes` with optional canonical `hex`.

Product IR stays framework-independent under `src/ir/`. TanStack and CSS parser types do not appear in the public IR types.

## What is not decided in code

Do not add `Compiler`, `FrameworkAdapter`, `Analyzer`, `RuleRegistry`, `CompilerPlugin`, or `CompilerContext` ahead of a real need. If one of those seams is needed, it should emerge from the first compiler rules.
