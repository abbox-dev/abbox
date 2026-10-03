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
      }
    }
  ]
}
```

`schemaVersion` is the Product IR contract, not the npm package version. It is the string `"1"`. It becomes `"2"`, `"3"`, and so on only when an existing field is removed, renamed, changes type, or changes meaning. Adding a compatible field does not change it. Readers ignore unknown fields. A missing additive field means that part of the product is not present.

`route` is the string literal passed to `createFileRoute`. `source.file` is the project-relative path using `/` separators.

A screen is recorded only when that call uses a direct named import of `createFileRoute` from `@tanstack/react-router` in the same file. A same-file alias such as `import { createFileRoute as fileRoute }` counts. A local function named `createFileRoute` does not. A non-literal argument does not.

The order of `screens` is not part of the Product IR contract.

`navigation` lists known screen-to-screen relationships. Every `navigation.from` and every `navigation.to` is a discovered `Screen.route`. An entry is recorded only when a TanStack `<Link>` in the same file as exactly one extracted screen uses a static absolute `to` literal that exactly matches another discovered screen route. Links in shared components, layout files without a single screen, or files with more than one extracted screen are omitted. Duplicate links between the same two routes collapse to one entry. The order of `navigation` is not part of the Product IR contract.

`designSystem.themes` is always present. It is empty when no recognized runtime theme exists in project CSS.

Runtime themes in v1:

- `:root` → `name: "default"`
- `.dark` → `name: "dark"`

Themes are emitted in order: `default`, then `dark`. Only selectors that match exactly `:root` or `.dark` are recognized.

`@theme` / `@theme inline` is a semantic token registry, not a runtime theme. `--color-<name>` declares semantic color `<name>`. When the value is `var(--physical)` with no fallback, the compiler resolves one level against custom properties in the same runtime theme (`:root` or `.dark`). Static colors in `@theme` are repeated for each recognized runtime theme. Unresolved aliases keep the original declaration text and omit `hex`.

Each color token has `name`, `value`, optional `hex`, and `source.file`. `value` is the resolved physical color when alias resolution succeeds; otherwise the declared text. `hex` is uppercase canonical sRGB `#RRGGBB` or `#RRGGBBAA` when the value is a single static color. Conflicting declarations with the same theme and name but different values are all kept. Exact duplicates with the same theme, name, value, and `source.file` collapse to one entry. Near-identical colors are never merged.

`actions` is always present. It lists user interaction affordances the compiler can attribute to a discovered screen.

An action is recorded only in a source file that defines exactly one extracted screen. Actions in shared components, files without a screen, or files with more than one extracted screen are omitted.

`kind` is `invoke` or `submit`. `invoke` means the user can activate a control with a statically recognized handler. `submit` means the user can submit a form with a statically recognized `onSubmit` handler. These names describe product interaction, not DOM event types.

Supported JSX in v1 (compiler rules, not IR fields):

- Native `<button>` with recognized `onClick`
- Native `<form>` with recognized `onSubmit`
- `<Button>` with recognized `onClick` when `Button` is a named import from a `ui/button` module path (for example `@/components/ui/button` or a relative path ending in `components/ui/button` or `ui/button`)

Recognized handlers are identifier references, arrow functions, or function expressions only. Conditional, logical, call, and member-expression handlers are not recognized.

Optional `label` comes from a static `aria-label` or from static JSX text children (whitespace normalized). If any JSX expression appears among those children at any depth, the child-derived label is omitted rather than partially reconstructed from surrounding static text. Expression-only children therefore omit the label; a static `aria-label` still wins over dynamic children.

A form with `onSubmit` emits one `submit` action. Descendant `type="button"` controls with recognized `onClick` still emit `invoke`. A native `<button>` without `type` inside a form is treated as a submit control; it does not emit `invoke` without its own recognized `onClick`. A submit control with its own recognized `onClick` may emit `invoke` in addition to the form `submit`.

TanStack `<Link>` navigation is not duplicated as actions. Handler bodies, effects, API calls, `navigate()`, `redirect()`, actual color usage in components, and line or column positions are not in this IR yet.
