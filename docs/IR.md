# Product IR

`compile` returns this value. `abbox compile` writes the same value to `abbox.json`.

```json
{
  "schemaVersion": "1",
  "screens": [
    {
      "route": "/dashboard",
      "source": {
        "file": "routes/dashboard.tsx"
      }
    }
  ]
}
```

`schemaVersion` is the Product IR contract, not the npm package version. It is the string `"1"`. It becomes `"2"`, `"3"`, and so on only when an existing field is removed, renamed, changes type, or changes meaning. Adding a compatible field, such as future navigation, does not change it. Finding more screens, or changing the compiler without changing the meaning of existing fields, does not change it. Readers ignore unknown fields. A missing additive field means that part of the product is not present.

`route` is the string literal passed to `createFileRoute`. `source.file` is the project-relative path using `/` separators.

A screen is recorded only when that call uses a direct named import of `createFileRoute` from `@tanstack/react-router` in the same file. A same-file alias such as `import { createFileRoute as fileRoute }` counts. A local function named `createFileRoute` does not. A non-literal argument does not.

The order of `screens` is not part of the Product IR contract.

Not in this IR yet: navigation, and line or column positions.
