# Product IR

`compile` returns this value. `abbox compile` writes the same value to `abbox.json`.

```json
{
  "schemaVersion": "2",
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
  "links": [
    {
      "route": "/",
      "kind": "anchor",
      "hash": "pricing",
      "label": "Pricing",
      "source": {
        "file": "routes/index.tsx"
      }
    }
  ],
  "globalLinks": [
    {
      "kind": "external",
      "url": "https://example.com",
      "source": {
        "file": "components/SiteFooter.tsx"
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
  "interactions": [
    {
      "id": "int_9da7b05701c7ce23",
      "route": "/",
      "source": {
        "file": "routes/index.tsx",
        "line": 12
      },
      "trigger": {
        "kind": "activation"
      },
      "labels": {
        "static": "Save",
        "from": "text"
      },
      "evidence": {
        "event": "click",
        "tag": "button"
      },
      "effects": []
    }
  ],
  "content": [
    {
      "id": "cnt_63e456f41c663793",
      "route": "/",
      "source": {
        "file": "routes/index.tsx",
        "line": 12
      },
      "definition": {
        "file": "routes/index.tsx"
      },
      "kind": "text",
      "value": {
        "text": "Save"
      },
      "structure": {
        "element": "button"
      }
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

`schemaVersion` is the Product IR contract, not the npm package version. Current output is `"2"`. It becomes `"3"`, and so on only when an existing field is removed, renamed, changes type, or changes meaning. Adding a compatible field within a major version does not change it. Readers ignore unknown fields. A missing additive field means that part of the product is not present.

**Schema v1 → v2:** `actions[]` is removed. Use `interactions[]` instead. `kind: "invoke"` becomes `trigger.kind: "activation"`. `kind: "submit"` becomes `trigger.kind: "submit"`. A flat `label` becomes `labels.static` plus `labels.from`. Effects remain nested on each interaction. The compiler emits deterministic evidence only; human product interpretation belongs to downstream tools (for example AI), not to `abbox.json`.

**Viewer migration (external):** read `interactions` instead of `actions`; map `trigger.kind` `activation` / `submit`; display `labels.static` where a single label is shown; keep rendering `effects` under each interaction.

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

`links` and `globalLinks` are always present. They describe user-visible static destinations that are not internal screen transitions in `navigation` / `globalNavigation`.

`links` are attributed to a discovered screen (`route` is a `Screen.route`). Each entry is a discriminated union on `kind`:

- `anchor` — same-document fragment (`hash` without leading `#`)
- `external` — `http://` or `https://` URL
- `resource` — static path to a file or asset (not a discovered screen); optional `download: true` when a boolean `download` attribute is provably present
- `protocol` — `mailto:`, `tel:`, or `sms:` URL

`globalLinks` use the same `kind` variants without `route`. They come from persistent root chrome using the same chrome evidence rules as `globalNavigation`.

Plain native `<a href="...">` uses the same static resolution machinery as TanStack `<Link to="...">` where applicable. When `href` resolves to a discovered screen destination, it lowers to `navigation` or `globalNavigation` (including `href="/screen#fragment"` as navigation to the screen plus an optional `anchor` link for the fragment). Dynamic `href`, `javascript:`, and unknown targets are omitted.

Optional `label` is a conservative static text label from element children when extractable. Duplicate links collapse using `route` (when present), `kind`, target (`hash`, `url`, or `path`), `label`, `source.file`, and `download`. Sort order is not part of the Product IR contract.

`designSystem.themes` is always present. It is empty when no recognized runtime theme exists in project CSS.

Runtime themes in v1:

- `:root` → `name: "default"`
- `.dark` → `name: "dark"`

Themes are emitted in order: `default`, then `dark`. Only selectors that match exactly `:root` or `.dark` are recognized.

`@theme` / `@theme inline` is a semantic token registry, not a runtime theme. `--color-<name>` declares semantic color `<name>`. When the value is `var(--physical)` with no fallback, the compiler resolves one level against custom properties in the same runtime theme (`:root` or `.dark`). Static colors in `@theme` are repeated for each recognized runtime theme. Unresolved aliases keep the original declaration text and omit `hex`.

Each color token has `name`, `value`, optional `hex`, and `source.file`. `value` is the resolved physical color when alias resolution succeeds; otherwise the declared text. `hex` is uppercase canonical sRGB `#RRGGBB` or `#RRGGBBAA` when the value is a single static color. Conflicting declarations with the same theme and name but different values are all kept. Exact duplicates with the same theme, name, value, and `source.file` collapse to one entry. Near-identical colors are never merged.

`interactions` is always present. It lists user-triggered behavioral evidence the compiler can attribute to a discovered screen. An **interaction** is framework-independent evidence (trigger, labels, handler facts, effects) without asserting product intent. Downstream tools interpret that evidence.

Attribution uses the same screen ownership rules as screen-attributed `navigation`: same-file route modules with exactly one screen; one-hop directly rendered imported component bodies with the same conservative import rules. `source.file` is always the owning route module. `source.line` is the start line of the control in source (provenance and disambiguation; not part of interaction identity).

`id` is a deterministic string `int_` plus 16 hex digits. Identity is a SHA-256 digest of pipe-separated material documented in `src/frameworks/react/interaction-id.ts`: schema tag `v2`, `route`, attribution file, definition file (module where the JSX control appears), `trigger.kind`, `evidence.event`, `evidence.tag`, static `handlerRef`, `jsxOrdinal` (discovery order within definition module and usage instance), and `usageLocal` (route JSX local name for component-attributed controls, else empty). Labels, effects, and source line are excluded from `id`. A future `fingerprint` field may cover behavioral change without renaming the interaction.

Duplicate discovery of the same underlying control collapses to one interaction. Distinct controls keep distinct ids even when labels match. Component instances rendered multiple times (for example two `<Card />` siblings) produce separate interactions when `usageLocal` differs.

`trigger.kind` is `activation` (formerly `invoke`) or `submit`. `evidence.event` is `click` or `submit`. `evidence.tag` is the static JSX tag name when known (for example `button`, `Button`, `form`).

`labels.static` and `labels.from` record how the label was obtained: `aria-label`, `title`, `text`, or `submit-button`. Alternative or conditional labels are not emitted yet.

Supported JSX (compiler rules, not IR fields): native `<button>` / `<form>` and shadcn-style `<Button>` from `ui/button` imports, with recognized `onClick` / `onSubmit` handlers (identifier, arrow, or function expression only).

TanStack `<Link>` navigation is not duplicated as interactions.

`effects` is always present on each interaction. Effects stay in source order and are not deduplicated. `"effects": []` means no supported effect was extracted, not that nothing happens at runtime.

The analyzed body is the inline arrow function or function expression. When the handler is an identifier, the compiler follows one same-file binding that resolves unambiguously to a function declaration, an arrow initializer, or a function-expression initializer, then analyzes that body. It does not follow calls inside that function, imports, parameters, props, destructured hook methods, or other files.

Only a concise arrow call, or a call statement at the top of that body, is inspected. A call inside `if`, `?:`, `&&`, `||`, a loop, `switch`, `try`, or a nested function is omitted. There is no condition field.

`kind: "state"` is a write through the setter of a React `useState` tuple. `useState` must be a named import from `react`, the callee must be the second binding, and `target` is the first binding. `value` is included only when the single argument is a string, number, boolean, or `null` literal. An updater or other expression omits `value`. The target name is not given a product meaning.

`kind: "search"` is a TanStack search update that stays on the current destination. The callee must be a local binding of `useNavigate()` imported from `@tanstack/react-router`, or of `Route.useNavigate()` where `Route` is the local `createFileRoute("...")` binding in that file. An arbitrary `Something.useNavigate()` does not qualify. The call has one object argument that contains `search`, and `to` is absent or the literal `"."`. Search keys and values are not emitted. A `to` that names another destination, or a dynamic `to`, is not a search effect.

`kind: "navigation"` is imperative navigation to another discovered screen caused by an interaction handler. The callee must be the same TanStack `useNavigate` / `Route.useNavigate` binding as for `search`. The call has one object argument with a static string `to` that resolves to a discovered `Screen.route`. Local functions named `navigate` do not qualify. Declarative `<Link>` / `<a href>` screen transitions remain in `navigation` / `globalNavigation`, not as navigation effects.

Label extraction uses static `aria-label`, then `title`, then static visible control text (same precedence as schema v1 `actions[].label`). For `submit`, form `aria-label` wins; otherwise a static submit `<button>` label inside the form. Provably `disabled` controls are omitted.

`trigger.kind: "submit"` is not an effect. `preventDefault()` is not an effect.

Storage, network, mutations, server functions, imported helpers, writes that happen later in `useEffect`, passive inputs without activation handlers, and clicks that are not already interactions are not effects.

`content` is always present. It lists statically determinable user-visible textual evidence attributable to a discovered screen. `content` answers what text the user can see on that screen. It is intentionally separate from `interactions`, `links`, and `navigation`: a visible button or link label may appear both as `content` and as `interaction.labels` or link `label`.

Each entry has a stable `id` (`cnt_` plus 16 hex digits from SHA-256), `route`, `source` (`file` and `line` in the attributing route module), `definition.file` (the module where the JSX or attribute lives), `kind` (`text`, `alt`, or `placeholder`), `value`, and `structure`.

`value` is either `{ "text": "..." }` for one known static string or `{ "alternatives": ["...", "..."] }` for mutually exclusive static branches (for example a ternary with static arms). The compiler does not pick which alternative is active at runtime.

`structure.element` is the JSX host tag (`h1`–`h6`, `p`, `span`, `div`, `button`, `a`, and other supported hosts). `structure.headingLevel` is set for `h1`–`h6`.

Supported static text evidence (compiler rules): JSX text; static string JSX expressions; static template literals without interpolation; same-file `const` string bindings in module or enclosing function scope; nested static child text within supported hosts; static `alt` on `img`; static `placeholder` on `input` / `textarea`. Dynamic runtime values (props, API data, calls, member access) are omitted.

Attribution matches screen `interactions`: same-file route modules with exactly one screen, plus one-hop directly imported exported components rendered from that route. `source.file` is the route module; `definition.file` is the route module or the component module. There is no `globalContent` yet—shared chrome copy is a known gap and is not duplicated on every screen.

Content IDs hash `route`, project-relative `attributionFile`, `definitionFile`, `usageLocal` (component import local name, empty for route-file JSX), `kind`, `element`, and `structPath` (comma-separated JSX child indices from the attribution scope root). Text, alternatives, and `source.line` are excluded so text edits preserve IDs. Inserting unrelated lines above the host preserves IDs. Inserting JSX siblings before the host, wrapping elements, or reordering JSX may change IDs.

Identical visible strings at different structural locations remain distinct entries. Deduplication applies only when structural identity proves the same candidate was discovered twice. Entries are sorted by `route`, then `source.line`, then `id`.

`entities` is always present. It lists product record concepts the compiler can justify from static evidence in v1.

An **entity** is a named product concept representing a kind of record the application works with. That meaning is not defined by TypeScript syntax, database tables, or naming conventions. V1 uses one **evidence** rule to decide when to emit an entity in IR; future milestones may prove the same concept from databases, APIs, loaders, or schemas.

V1 evidence (compiler rule, same file only):

- An exported top-level `interface N { ... }` or `type N = { ... }` with an object type literal body, and
- An exported top-level `const` explicitly typed `N[]` or `Array<N>`.

Fields come only from that type or interface: supported property signatures with identifier names, plus `optional: true` when the property is declared optional. Unsupported members are ignored. If no supported fields remain, the entity is omitted. Field TypeScript types, relationships, and nested schemas are not emitted.

If the same entity `name` is independently evidenced in more than one source file, that name is treated as ambiguous and no entity with that name is emitted. Entities are not merged and duplicate names are not emitted.

Entities are sorted by `name`, then `source.file`. Fields are sorted by `name`.

Entity usage on screens, interactions, or effects, route-parameter inference, Supabase or SQL, loaders, React Query, APIs, and cross-file type resolution are not in this IR yet.
