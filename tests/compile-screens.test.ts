import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { compile } from "../src/index.js";

function fixture(name: string): string {
  return fileURLToPath(
    new URL(`./fixtures/tanstack-file-routes/${name}`, import.meta.url),
  );
}

const emptyNavigation = { navigation: [] as const };
const emptyDesignSystem = { designSystem: { themes: [] as const } };
const emptyEntities = { entities: [] as const };
const emptyActions = { actions: [] as const };

describe("compile screens", () => {
  it("extracts the root route", () => {
    expect(compile(fixture("root"))).toEqual({
      schemaVersion: "1",
      screens: [{ route: "/", source: { file: "routes/index.tsx" } }],
      ...emptyNavigation,
      ...emptyDesignSystem,
      ...emptyEntities,
      ...emptyActions,
    });
  });

  it("extracts /dashboard", () => {
    expect(compile(fixture("dashboard"))).toEqual({
      schemaVersion: "1",
      screens: [
        { route: "/dashboard", source: { file: "routes/dashboard.tsx" } },
      ],
      ...emptyNavigation,
      ...emptyDesignSystem,
      ...emptyEntities,
      ...emptyActions,
    });
  });

  it("preserves a dynamic segment", () => {
    expect(compile(fixture("dynamic-segment"))).toEqual({
      schemaVersion: "1",
      screens: [
        {
          route: "/projects/$projectId",
          source: { file: "routes/projects/$projectId.tsx" },
        },
      ],
      ...emptyNavigation,
      ...emptyDesignSystem,
      ...emptyEntities,
      ...emptyActions,
    });
  });

  it("returns one screen per route file", () => {
    // Locks the current deterministic result. Screen order is not a Product IR contract.
    expect(compile(fixture("multiple"))).toEqual({
      schemaVersion: "1",
      screens: [
        { route: "/dashboard", source: { file: "routes/dashboard.tsx" } },
        { route: "/", source: { file: "routes/index.tsx" } },
      ],
      ...emptyNavigation,
      ...emptyDesignSystem,
      ...emptyEntities,
      ...emptyActions,
    });
  });

  it("ignores unrelated TypeScript", () => {
    expect(compile(fixture("unrelated"))).toEqual({
      schemaVersion: "1",
      screens: [],
      ...emptyNavigation,
      ...emptyDesignSystem,
      ...emptyEntities,
      ...emptyActions,
    });
  });

  it("ignores a local function named createFileRoute", () => {
    expect(compile(fixture("local-name"))).toEqual({
      schemaVersion: "1",
      screens: [],
      ...emptyNavigation,
      ...emptyDesignSystem,
      ...emptyEntities,
      ...emptyActions,
    });
  });

  it("follows a same-file import alias", () => {
    expect(compile(fixture("aliased"))).toEqual({
      schemaVersion: "1",
      screens: [
        { route: "/dashboard", source: { file: "routes/dashboard.tsx" } },
      ],
      ...emptyNavigation,
      ...emptyDesignSystem,
      ...emptyEntities,
      ...emptyActions,
    });
  });

  it("ignores non-literal route arguments", () => {
    expect(compile(fixture("non-literal"))).toEqual({
      schemaVersion: "1",
      screens: [{ route: "/login", source: { file: "routes/login.tsx" } }],
      ...emptyNavigation,
      ...emptyDesignSystem,
      ...emptyEntities,
      ...emptyActions,
    });
  });

  it("does not analyze skipped directories", () => {
    expect(compile(fixture("skipped-dirs"))).toEqual({
      schemaVersion: "1",
      screens: [{ route: "/visible", source: { file: "src/app.tsx" } }],
      ...emptyNavigation,
      ...emptyDesignSystem,
      ...emptyEntities,
      ...emptyActions,
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
