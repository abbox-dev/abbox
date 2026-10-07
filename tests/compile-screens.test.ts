import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { compile } from "../src/index.js";
import { stripInteractionIdsFromProduct } from "./helpers/interaction-expect.js";

function fixture(name: string): string {
  return fileURLToPath(
    new URL(`./fixtures/tanstack-file-routes/${name}`, import.meta.url),
  );
}

const emptyNavigation = { navigation: [] as const };
const emptyDesignSystem = { designSystem: { themes: [] as const } };
const emptyEntities = { entities: [] as const };
const emptyGlobalNavigation = { globalNavigation: [] as const };
const emptyLinks = { links: [] as const, globalLinks: [] as const };
const emptyInteractions = { interactions: [] as const };

describe("compile screens", () => {
  it("extracts the root route", () => {
    expect(stripInteractionIdsFromProduct(compile(fixture("root")))).toEqual({
      schemaVersion: "2",
      screens: [{ route: "/", source: { file: "routes/index.tsx" } }],
      ...emptyNavigation,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      ...emptyDesignSystem,
      ...emptyEntities,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      ...emptyInteractions,
    });
  });

  it("extracts /dashboard", () => {
    expect(
      stripInteractionIdsFromProduct(compile(fixture("dashboard"))),
    ).toEqual({
      schemaVersion: "2",
      screens: [
        { route: "/dashboard", source: { file: "routes/dashboard.tsx" } },
      ],
      ...emptyNavigation,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      ...emptyDesignSystem,
      ...emptyEntities,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      ...emptyInteractions,
    });
  });

  it("preserves a dynamic segment", () => {
    expect(
      stripInteractionIdsFromProduct(compile(fixture("dynamic-segment"))),
    ).toEqual({
      schemaVersion: "2",
      screens: [
        {
          route: "/projects/$projectId",
          source: { file: "routes/projects/$projectId.tsx" },
        },
      ],
      ...emptyNavigation,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      ...emptyDesignSystem,
      ...emptyEntities,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      ...emptyInteractions,
    });
  });

  it("returns one screen per route file", () => {
    // Locks the current deterministic result. Screen order is not a Product IR contract.
    expect(
      stripInteractionIdsFromProduct(compile(fixture("multiple"))),
    ).toEqual({
      schemaVersion: "2",
      screens: [
        { route: "/dashboard", source: { file: "routes/dashboard.tsx" } },
        { route: "/", source: { file: "routes/index.tsx" } },
      ],
      ...emptyNavigation,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      ...emptyDesignSystem,
      ...emptyEntities,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      ...emptyInteractions,
    });
  });

  it("ignores unrelated TypeScript", () => {
    expect(
      stripInteractionIdsFromProduct(compile(fixture("unrelated"))),
    ).toEqual({
      schemaVersion: "2",
      screens: [],
      ...emptyNavigation,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      ...emptyDesignSystem,
      ...emptyEntities,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      ...emptyInteractions,
    });
  });

  it("ignores a local function named createFileRoute", () => {
    expect(
      stripInteractionIdsFromProduct(compile(fixture("local-name"))),
    ).toEqual({
      schemaVersion: "2",
      screens: [],
      ...emptyNavigation,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      ...emptyDesignSystem,
      ...emptyEntities,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      ...emptyInteractions,
    });
  });

  it("follows a same-file import alias", () => {
    expect(stripInteractionIdsFromProduct(compile(fixture("aliased")))).toEqual(
      {
        schemaVersion: "2",
        screens: [
          { route: "/dashboard", source: { file: "routes/dashboard.tsx" } },
        ],
        ...emptyNavigation,
        ...emptyGlobalNavigation,
        ...emptyLinks,
        ...emptyDesignSystem,
        ...emptyEntities,
        ...emptyGlobalNavigation,
        ...emptyLinks,
        ...emptyInteractions,
      },
    );
  });

  it("ignores non-literal route arguments", () => {
    expect(
      stripInteractionIdsFromProduct(compile(fixture("non-literal"))),
    ).toEqual({
      schemaVersion: "2",
      screens: [{ route: "/login", source: { file: "routes/login.tsx" } }],
      ...emptyNavigation,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      ...emptyDesignSystem,
      ...emptyEntities,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      ...emptyInteractions,
    });
  });

  it("does not analyze skipped directories", () => {
    expect(
      stripInteractionIdsFromProduct(compile(fixture("skipped-dirs"))),
    ).toEqual({
      schemaVersion: "2",
      screens: [{ route: "/visible", source: { file: "src/app.tsx" } }],
      ...emptyNavigation,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      ...emptyDesignSystem,
      ...emptyEntities,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      ...emptyInteractions,
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
