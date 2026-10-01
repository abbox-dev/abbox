# Roadmap

## Step 1

Repository foundation: package setup, TypeScript, Vitest, Biome, community documents, and a single CI workflow. No compiler behavior.

## Next

Define the Product IR for screens and navigation against a real TanStack fixture, then implement:

- Route and screen detection
- Navigation detection for `<Link>`, `navigate()`, and `redirect()`
- Writing `abbox.json`
- The real `abbox compile <path>` command

The first framework-specific code belongs in `src/frameworks/tanstack/`.

## Deferred

These are out of scope until the screens and navigation compiler exists:

- Actions, forms, and effects
- Supabase, database access, server functions, and API calls
- Authentication analysis
- Frameworks other than TanStack Start / TanStack Router
- AI, visualization, and a web UI
- GitHub integration
- A plugin system or framework-adapter interface
