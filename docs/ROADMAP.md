# Roadmap

## Step 1

Repository foundation: package setup, TypeScript, Vitest, Biome, community documents, and a single CI workflow.

## Step 2

`compile(projectPath)` turns static TanStack `createFileRoute("...")` calls into framework-independent screens. Navigation is not included.

## Next

- Navigation detection for `<Link>`, `navigate()`, and `redirect()`
- Writing `abbox.json`, including `schemaVersion`
- The real `abbox compile <path>` command

## Deferred

These are out of scope until the screens and navigation compiler exists:

- Actions, forms, and effects
- Supabase, database access, server functions, and API calls
- Authentication analysis
- Frameworks other than TanStack Start / TanStack Router
- AI, visualization, and a web UI
- GitHub integration
- A plugin system or framework-adapter interface
