# Roadmap

## Step 1

Repository foundation: package setup, TypeScript, Vitest, Biome, community documents, and a single CI workflow.

## Step 2

`compile(projectPath)` turns static TanStack `createFileRoute("...")` calls into framework-independent screens. Navigation is not included.

## Step 3

`abbox compile` writes that Product IR to `abbox.json`, including `schemaVersion`.

## Next

- Navigation detection for `<Link>`, `navigate()`, and `redirect()`

## Deferred

These are out of scope until the screens and navigation compiler exists:

- Actions, forms, and effects
- Supabase, database access, server functions, and API calls
- Authentication analysis
- Frameworks other than TanStack Start / TanStack Router
- AI, visualization, and a web UI
- GitHub integration
- A plugin system or framework-adapter interface
