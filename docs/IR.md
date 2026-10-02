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
    },
    {
      "route": "/projects",
      "source": {
        "file": "routes/projects.tsx"
      }
    }
  ],
  "navigation": [
    {
      "from": "/",
      "to": "/projects"
    }
  ]
}
```

`schemaVersion` is the Product IR contract, not the npm package version. It is the string `"1"`. It becomes `"2"`, `"3"`, and so on only when an existing field is removed, renamed, changes type, or changes meaning. Adding a compatible field, such as `navigation`, does not change it. Finding more screens, or changing the compiler without changing the meaning of existing fields, does not change it. Readers ignore unknown fields. A missing additive field means that part of the product is not present.

`route` is the string literal passed to `createFileRoute`. `source.file` is the project-relative path using `/` separators.

A screen is recorded only when that call uses a direct named import of `createFileRoute` from `@tanstack/react-router` in the same file. A same-file alias such as `import { createFileRoute as fileRoute }` counts. A local function named `createFileRoute` does not. A non-literal argument does not.

The order of `screens` is not part of the Product IR contract.

`navigation` lists known screen-to-screen relationships. Every `navigation.from` and every `navigation.to` is a discovered `Screen.route`. An entry is recorded only when a TanStack `<Link>` in the same file as exactly one extracted screen uses a static absolute `to` literal that exactly matches another discovered screen route. Links in shared components, layout files without a single screen, or files with more than one extracted screen are omitted. Duplicate links between the same two routes collapse to one entry. The order of `navigation` is not part of the Product IR contract.

`navigate()`, `redirect()`, and line or column positions are not in this IR yet.
