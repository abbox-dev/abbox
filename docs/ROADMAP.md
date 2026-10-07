# Roadmap

## Step 1

Repository foundation: package setup, TypeScript, Vitest, Biome, community documents, and a single CI workflow.

## Step 2

`compile(projectPath)` turns static TanStack `createFileRoute("...")` calls into framework-independent screens. Navigation is not included.

## Step 3

`abbox compile` writes that Product IR to `abbox.json`, including `schemaVersion`.

## Step 4

Static TanStack `<Link>` navigation between discovered screens is written to `navigation` in Product IR.

## Step 5

Declared design-system colors from CSS `:root` / `.dark` and `@theme` semantic mappings are written to `designSystem.themes`, with optional canonical `hex`.

## Step 6

Static JSX actions on discovered screens: native `button` / `form` and shadcn-style `Button` from `ui/button` imports, with conservative labels and same-file screen ownership.

## Step 7

Action effects from supported handler bodies: React `useState` writes and TanStack search updates on the current destination, nested on each action.

## Step 8

Entities from exported object types paired with exported typed collections in the same module, with field names and ambiguity omission.

## Step 9

Navigation V2: screen-attributed navigation from same-file links and direct imported components; `globalNavigation` for persistent root chrome (not expanded into per-screen `navigation` edges).

## Step 10

Actions Attribution V2: screen-attributed actions from same-file JSX and direct imported component export bodies (same conservative boundary as Navigation V2 component links). Root chrome actions are not attributed to every screen.

## Step 11

Product links: `links` and `globalLinks` for static native `<a href>` affordances (anchor, external, resource, protocol) with same-file, one-hop component, and root-chrome attribution. Internal screen `href` values lower to `navigation` / `globalNavigation` in parity with TanStack `<Link>`.

## Next

- **Action Coverage V3** (in progress): navigation effects on actions, improved labels (`title`, form submit text), disabled control omission, conservative handler/effect extraction—without passive `controls[]`, global actions, or shadcn trigger heuristics
- Actual design usage (Tailwind classes, inline styles, component CSS)
- Imperative navigation via `useNavigate()` / `navigate()` / `window.location` / `window.open` as separate future work
- Redirects (`redirect()`, `<Navigate>`) as a separate product decision
- Additional entity evidence (databases, APIs, loaders)

## Deferred

- Design drift analytics and visual similarity in Viewer/Cloud
- Non-color design tokens (spacing, typography, radii)
- Entity usage on screens, actions, or effects
- Supabase, database access, server functions, and API calls
- Authentication analysis
- Frameworks other than TanStack Start / TanStack Router
- AI, visualization, and a web UI
- GitHub integration
- A plugin system or framework-adapter interface
