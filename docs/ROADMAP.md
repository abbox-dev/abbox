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

## Next

- Actual design usage (Tailwind classes, inline styles, component CSS)
- Imperative navigation via `useNavigate()` / `navigate()` as screen navigation
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
