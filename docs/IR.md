# Product IR

`compile` returns this value. `abbox compile` writes the same value to `abbox.json`.

```json
{
  "schemaVersion": "1",
  "screens": [
    {
      "route": "/",
      "source": {
        "file": "routes/index.tsx"
      }
    }
  ],
  "navigation": [
    {
      "from": "/",
      "to": "/projects"
    }
  ],
  "globalNavigation": [
    {
      "to": "/saved",
      "source": {
        "file": "components/AppShell.tsx"
      }
    }
  ],
  "designSystem": {
    "themes": [
      {
        "name": "default",
        "colors": [
          {
            "name": "primary",
            "value": "oklch(0.46 0.13 296)",
            "hex": "#604597",
            "source": {
              "file": "src/index.css"
            }
          }
        ]
      },
      {
        "name": "dark",
        "colors": []
      }
    ]
  },
  "actions": [
    {
      "route": "/",
      "kind": "invoke",
      "label": "Save",
      "source": {
        "file": "routes/index.tsx"
      },
      "effects": []
    }
  ],
  "entities": [
    {
      "name": "Customer",
      "fields": [
        { "name": "id" },
        { "name": "name" }
      ],
      "source": {
        "file": "src/data/models.ts"
      }
    }
  ]
}
```

`schemaVersion` is the Product IR contract, not the npm package version. It is the string `"1"`. It becomes `"2"`, `"3"`, and so on only when an existing field is removed, renamed, changes type, or changes meaning. Adding a compatible field does not change it. Readers ignore unknown fields. A missing additive field means that part of the product is not present.

`route` is the user-facing destination. `source.file` is the project-relative path of the module that owns that destination, using `/` separators.

A screen is recorded only when that call uses a direct named import of `createFileRoute` from `@tanstack/react-router` in the same file and the argument is a string literal. A same-file alias such as `import { createFileRoute as fileRoute }` counts. A local function named `createFileRoute` does not. A non-literal argument does not.

That literal is a TanStack file-route id. An index id is the destination plus a trailing `/`. The root id `"/"` is already the destination `/`. The screen route is the destination, so `createFileRoute("/programs/")` becomes `/programs`. When an index id owns a destination, the parent module whose id is that same destination is not a separate screen, and `source.file` is the index module. A parent id with no index id remains the screen for that destination. When more than one index id resolves to the same destination, that destination is omitted.

The order of `screens` is not part of the Product IR contract.

`navigation` lists screen-to-screen relationships attributable to a particular discovered screen. Every `navigation.from` and every `navigation.to` is a discovered `Screen.route`. Each entry means a statically supported navigation affordance on that screen, not merely that the destination is reachable elsewhere in the product.

Same-file evidence: a TanStack `<Link>` in the same module as exactly one extracted screen, with a static absolute `to` that resolves to another discovered screen destination.

Component evidence: the screen module directly renders an imported exported function component (single-hop import, no barrel re-export), and that component’s function body contains a supported static `<Link>` to another discovered screen.

Supported static `to` evidence (compiler rules, not IR fields): a string literal on `to`; a one-hop literal JSX attribute on a directly rendered imported or same-file component that binds to `to={prop}` or `props.prop`; a `const` string binding in the enclosing function or module scope; or a `const` array of object literals mapped in JSX where `to` is `row.key` or a destructured field with literal values in each element. Unresolved expressions are omitted.

A TanStack index route id used as `to` resolves through the same destination rule as screens. Duplicate `{ from, to }` pairs collapse to one entry. The order of `navigation` is not part of the Product IR contract.

`globalNavigation` is always present. It lists destinations exposed through persistent application chrome around the routed main content area of the application. Each entry has `to` (a discovered screen destination) and `source.file` (the module that owns the chrome links). It does not include a `from` screen: the compiler does not expand chrome into one navigation edge per screen.

Global chrome evidence: static `<Link>` elements in the export body of (1) the single imported innermost wrapper around `<Outlet />` in the root route `component`, when that pattern applies, and/or (2) directly imported components rendered in the root `component` outside the innermost JSX container that holds `<Outlet />` (sibling layout chrome), when there is exactly one `<Outlet />` in that root component. Chrome modules also imported by screen route files are excluded. Literal JSX props from the root file are applied one hop into chrome components the same way as screen attribution.

Absence of `globalNavigation` entries in older `schemaVersion: "1"` documents, or an empty array in current output, does not prove the product has no global navigation—only that this compiler pass did not justify any chrome links under its rules.

Consumers may treat `globalNavigation` destinations as reachable from any discovered file-route screen when building graphs or journeys, subject to the documented scope of the chrome evidence. The compiler does not materialize those implied edges into `navigation`.

Duplicate `to` values in `globalNavigation` collapse to one entry, sorted by `to` then `source.file`. The order of `globalNavigation` is not part of the Product IR contract.

`designSystem.themes` is always present. It is empty when no recognized runtime theme exists in project CSS.

Runtime themes in v1:

- `:root` → `name: "default"`
- `.dark` → `name: "dark"`

Themes are emitted in order: `default`, then `dark`. Only selectors that match exactly `:root` or `.dark` are recognized.

`@theme` / `@theme inline` is a semantic token registry, not a runtime theme. `--color-<name>` declares semantic color `<name>`. When the value is `var(--physical)` with no fallback, the compiler resolves one level against custom properties in the same runtime theme (`:root` or `.dark`). Static colors in `@theme` are repeated for each recognized runtime theme. Unresolved aliases keep the original declaration text and omit `hex`.

Each color token has `name`, `value`, optional `hex`, and `source.file`. `value` is the resolved physical color when alias resolution succeeds; otherwise the declared text. `hex` is uppercase canonical sRGB `#RRGGBB` or `#RRGGBBAA` when the value is a single static color. Conflicting declarations with the same theme and name but different values are all kept. Exact duplicates with the same theme, name, value, and `source.file` collapse to one entry. Near-identical colors are never merged.

`actions` is always present. It lists user interaction affordances the compiler can attribute to a discovered screen.

An action is recorded when the compiler can attribute it to exactly one extracted screen. Same-file attribution applies when the action candidate appears in a route module that defines exactly one screen; its `route` is that screen's destination and `source.file` is that route module.

Component attribution applies when a route module defines exactly one screen, directly renders an imported component (same conservative import and JSX rules as screen-attributed `navigation`), and the action candidate appears in that component's exported function body. Those actions use the same `route` and `source.file` as the route module (screen ownership), not the component module path.

Actions in shared components that are not directly rendered by a qualifying route module, files without a screen, route modules with more than one extracted screen, barrel re-exports, unresolved imports, nested imported child components, and other unsupported cases are omitted. Actions in root layout chrome are not copied onto every screen. There is no `globalActions` list.

`kind` is `invoke` or `submit`. `invoke` means the user can activate a control with a statically recognized handler. `submit` means the user can submit a form with a statically recognized `onSubmit` handler. These names describe product interaction, not DOM event types.

Supported JSX in v1 (compiler rules, not IR fields):

- Native `<button>` with recognized `onClick`
- Native `<form>` with recognized `onSubmit`
- `<Button>` with recognized `onClick` when `Button` is a named import from a `ui/button` module path (for example `@/components/ui/button` or a relative path ending in `components/ui/button` or `ui/button`)

Recognized handlers are identifier references, arrow functions, or function expressions only. Conditional, logical, call, and member-expression handlers are not recognized.

Optional `label` comes from a static `aria-label` or from static JSX text children (whitespace normalized). If any JSX expression appears among those children at any depth, the child-derived label is omitted rather than partially reconstructed from surrounding static text. Expression-only children therefore omit the label; a static `aria-label` still wins over dynamic children.

A form with `onSubmit` emits one `submit` action. Descendant `type="button"` controls with recognized `onClick` still emit `invoke`. A native `<button>` without `type` inside a form is treated as a submit control; it does not emit `invoke` without its own recognized `onClick`. A submit control with its own recognized `onClick` may emit `invoke` in addition to the form `submit`.

TanStack `<Link>` navigation is not duplicated as actions. API calls, `navigate()` / `redirect()` as screen navigation, actual color usage in components, and line or column positions are not in this IR yet.

`effects` is always present on an action this compiler emits. `schemaVersion` stays `"1"`. Effects are nested on the action that caused them. They stay in source order and are not sorted or deduplicated.

An action means the user can trigger that interaction. An effect means a supported direct consequence was extracted from the analyzed handler. `"effects": []` means no supported effect was extracted. It does not mean the action does nothing: the handler may call unsupported or cross-file code.

The analyzed body is the inline arrow function or function expression. When the handler is an identifier, the compiler follows one same-file binding that resolves unambiguously to a function declaration, an arrow initializer, or a function-expression initializer, then analyzes that body. It does not follow calls inside that function, imports, parameters, props, destructured hook methods, or other files.

Only a concise arrow call, or a call statement at the top of that body, is inspected. A call inside `if`, `?:`, `&&`, `||`, a loop, `switch`, `try`, or a nested function is omitted. There is no condition field.

`kind: "state"` is a write through the setter of a React `useState` tuple. `useState` must be a named import from `react`, the callee must be the second binding, and `target` is the first binding. `value` is included only when the single argument is a string, number, boolean, or `null` literal. An updater or other expression omits `value`. The target name is not given a product meaning.

`kind: "search"` is a TanStack search update that stays on the current destination. The callee must be a local binding of `useNavigate()` imported from `@tanstack/react-router`, or of `Route.useNavigate()` where `Route` is the local `createFileRoute("...")` binding in that file. An arbitrary `Something.useNavigate()` does not qualify. The call has one object argument that contains `search`, and `to` is absent or the literal `"."`. Search keys and values are not emitted. A `to` that names another destination, or a dynamic `to`, is not a search effect.

`kind: "submit"` remains an action kind. It is not an effect. `preventDefault()` is not an effect. Only handler calls that independently match `state` or `search` are effects. `navigation` is unchanged: static `<Link>` screen edges, not search effects and not imperative navigation.

Storage, network, mutations, server functions, imported helpers, writes that happen later in `useEffect`, input or select changes, and clicks that are not already actions are not effects.

`entities` is always present. It lists product record concepts the compiler can justify from static evidence in v1.

An **entity** is a named product concept representing a kind of record the application works with. That meaning is not defined by TypeScript syntax, database tables, or naming conventions. V1 uses one **evidence** rule to decide when to emit an entity in IR; future milestones may prove the same concept from databases, APIs, loaders, or schemas.

V1 evidence (compiler rule, same file only):

- An exported top-level `interface N { ... }` or `type N = { ... }` with an object type literal body, and
- An exported top-level `const` explicitly typed `N[]` or `Array<N>`.

Fields come only from that type or interface: supported property signatures with identifier names, plus `optional: true` when the property is declared optional. Unsupported members are ignored. If no supported fields remain, the entity is omitted. Field TypeScript types, relationships, and nested schemas are not emitted.

If the same entity `name` is independently evidenced in more than one source file, that name is treated as ambiguous and no entity with that name is emitted. Entities are not merged and duplicate names are not emitted.

Entities are sorted by `name`, then `source.file`. Fields are sorted by `name`.

Entity usage on screens, actions, or effects, route-parameter inference, Supabase or SQL, loaders, React Query, APIs, and cross-file type resolution are not in this IR yet.
