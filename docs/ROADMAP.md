# Roadmap

## Step 1

Repository foundation: package setup, TypeScript, Vitest, Biome, community documents, and a single CI workflow.

## Step 2

`compile(projectPath)` turns static TanStack `createFileRoute("...")` calls into framework-independent screens. Navigation is not included.

## Step 3

`abbox compile` writes that Product IR to `abbox.json`, including `schemaVersion`.

## Step 4

Static TanStack `<Link>` navigation between discovered screens is written to `navigation` in Product IR.

## Next

- Imperative navigation via `useNavigate()` / `navigate()`
- Redirects (`redirect()`, `<Navigate>`) as a separate product decision

## Deferred

These are out of scope until the compiler grows beyond the current screens and Link navigation:

- Actions, forms, and effects
- Supabase, database access, server functions, and API calls
- Authentication analysis
- Frameworks other than TanStack Start / TanStack Router
- AI, visualization, and a web UI
- GitHub integration
- A plugin system or framework-adapter interface
