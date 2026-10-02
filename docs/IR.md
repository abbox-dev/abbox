# Product IR

`compile` returns this value. It is not written to `abbox.json` yet.

```json
{
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

`route` is the string literal passed to `createFileRoute`. `source.file` is the project-relative path using `/` separators.

A screen is recorded only when that call uses a direct named import of `createFileRoute` from `@tanstack/react-router` in the same file. A same-file alias such as `import { createFileRoute as fileRoute }` counts. A local function named `createFileRoute` does not. A non-literal argument does not.

The order of `screens` is not part of the Product IR contract.

Not in this IR yet: navigation, line or column positions, `schemaVersion`, and `abbox.json`.
