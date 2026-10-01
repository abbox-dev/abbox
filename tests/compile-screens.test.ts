import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { compile } from "../src/index.js";

function fixture(name: string): string {
  return fileURLToPath(
    new URL(`./fixtures/tanstack-file-routes/${name}`, import.meta.url),
  );
}

describe("compile screens", () => {
  it("extracts the root route", () => {
    expect(compile(fixture("root"))).toEqual({
      screens: [{ route: "/", source: { file: "routes/index.tsx" } }],
    });
  });

  it("extracts /dashboard", () => {
    expect(compile(fixture("dashboard"))).toEqual({
      screens: [
        { route: "/dashboard", source: { file: "routes/dashboard.tsx" } },
      ],
    });
  });

  it("preserves a dynamic segment", () => {
    expect(compile(fixture("dynamic-segment"))).toEqual({
      screens: [
        {
          route: "/projects/$projectId",
          source: { file: "routes/projects/$projectId.tsx" },
        },
      ],
    });
  });

  it("returns one screen per route file", () => {
    // Locks the current deterministic result. Screen order is not a Product IR contract.
    expect(compile(fixture("multiple"))).toEqual({
      screens: [
        { route: "/dashboard", source: { file: "routes/dashboard.tsx" } },
        { route: "/", source: { file: "routes/index.tsx" } },
      ],
    });
  });

  it("ignores unrelated TypeScript", () => {
    expect(compile(fixture("unrelated"))).toEqual({ screens: [] });
  });

  it("ignores a local function named createFileRoute", () => {
    expect(compile(fixture("local-name"))).toEqual({ screens: [] });
  });

  it("follows a same-file import alias", () => {
    expect(compile(fixture("aliased"))).toEqual({
      screens: [
        { route: "/dashboard", source: { file: "routes/dashboard.tsx" } },
      ],
    });
  });

  it("ignores non-literal route arguments", () => {
    expect(compile(fixture("non-literal"))).toEqual({
      screens: [{ route: "/login", source: { file: "routes/login.tsx" } }],
    });
  });

  it("does not analyze skipped directories", () => {
    expect(compile(fixture("skipped-dirs"))).toEqual({
      screens: [{ route: "/visible", source: { file: "src/app.tsx" } }],
    });
  });

  it("rejects a missing directory", () => {
    const missing = `${fixture("root")}/does-not-exist`;
    expect(() => compile(missing)).toThrow(
      `Project directory not found: ${missing}`,
    );
  });

  it("rejects a file path", () => {
    const file = fileURLToPath(
      new URL(
        "./fixtures/tanstack-file-routes/root/routes/index.tsx",
        import.meta.url,
      ),
    );
    expect(() => compile(file)).toThrow(
      `Project path is not a directory: ${file}`,
    );
  });
});
