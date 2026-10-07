import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { compile } from "../src/index.js";

function fixture(name: string): string {
  return fileURLToPath(
    new URL(`./fixtures/tanstack-links/${name}`, import.meta.url),
  );
}

function screens(...entries: { route: string; file: string }[]) {
  return entries.map(({ route, file }) => ({
    route,
    source: { file },
  }));
}

const emptyDesignSystem = { designSystem: { themes: [] as const } };
const emptyActions = { actions: [] as const };
const emptyEntities = { entities: [] as const };
const emptyGlobalNavigation = { globalNavigation: [] as const };
const emptyLinks = { links: [] as const, globalLinks: [] as const };

describe("compile navigation", () => {
  it("links from / to a discovered /projects screen", () => {
    expect(compile(fixture("direct"))).toEqual({
      schemaVersion: "1",
      screens: screens(
        { route: "/", file: "routes/index.tsx" },
        { route: "/projects", file: "routes/projects.tsx" },
      ),
      navigation: [{ from: "/", to: "/projects" }],
      ...emptyDesignSystem,
      ...emptyActions,
      ...emptyEntities,
      ...emptyGlobalNavigation,
      ...emptyLinks,
    });
  });

  it("attributes a link in another function in the route file", () => {
    expect(compile(fixture("same-file-helper"))).toEqual({
      schemaVersion: "1",
      screens: screens(
        { route: "/", file: "routes/index.tsx" },
        { route: "/projects", file: "routes/projects.tsx" },
      ),
      navigation: [{ from: "/", to: "/projects" }],
      ...emptyDesignSystem,
      ...emptyActions,
      ...emptyEntities,
      ...emptyGlobalNavigation,
      ...emptyLinks,
    });
  });

  it("follows a same-file Link import alias", () => {
    expect(compile(fixture("aliased"))).toEqual({
      schemaVersion: "1",
      screens: screens(
        { route: "/", file: "routes/index.tsx" },
        { route: "/settings", file: "routes/settings.tsx" },
      ),
      navigation: [{ from: "/", to: "/settings" }],
      ...emptyDesignSystem,
      ...emptyActions,
      ...emptyEntities,
      ...emptyGlobalNavigation,
      ...emptyLinks,
    });
  });

  it("deduplicates edges and sorts by from then to", () => {
    expect(compile(fixture("multiple"))).toEqual({
      schemaVersion: "1",
      screens: screens(
        { route: "/dashboard", file: "routes/dashboard.tsx" },
        { route: "/", file: "routes/index.tsx" },
        { route: "/settings", file: "routes/settings.tsx" },
      ),
      navigation: [
        { from: "/", to: "/" },
        { from: "/", to: "/dashboard" },
        { from: "/", to: "/settings" },
      ],
      ...emptyDesignSystem,
      ...emptyActions,
      ...emptyEntities,
      ...emptyGlobalNavigation,
      ...emptyLinks,
    });
  });

  it("preserves a dynamic route literal when the screen exists", () => {
    expect(compile(fixture("dynamic-segment"))).toEqual({
      schemaVersion: "1",
      screens: screens(
        { route: "/", file: "routes/index.tsx" },
        {
          route: "/projects/$projectId",
          file: "routes/projects/$projectId.tsx",
        },
      ),
      navigation: [{ from: "/", to: "/projects/$projectId" }],
      ...emptyDesignSystem,
      ...emptyActions,
      ...emptyEntities,
      ...emptyGlobalNavigation,
      ...emptyLinks,
    });
  });

  it("accepts a braced string literal destination", () => {
    expect(compile(fixture("braced-literal"))).toEqual({
      schemaVersion: "1",
      screens: screens(
        { route: "/", file: "routes/index.tsx" },
        { route: "/projects", file: "routes/projects.tsx" },
      ),
      navigation: [{ from: "/", to: "/projects" }],
      ...emptyDesignSystem,
      ...emptyActions,
      ...emptyEntities,
      ...emptyGlobalNavigation,
      ...emptyLinks,
    });
  });

  it("keeps only static absolute Link destinations to discovered screens", () => {
    expect(compile(fixture("non-literal"))).toEqual({
      schemaVersion: "1",
      screens: screens(
        { route: "/", file: "routes/index.tsx" },
        { route: "/projects", file: "routes/projects.tsx" },
      ),
      navigation: [{ from: "/", to: "/projects" }],
      ...emptyDesignSystem,
      actions: [
        {
          route: "/",
          kind: "invoke",
          label: "Navigate",
          source: { file: "routes/index.tsx" },
          effects: [],
        },
        {
          route: "/",
          kind: "invoke",
          label: "Redirect",
          source: { file: "routes/index.tsx" },
          effects: [],
        },
      ],
      ...emptyEntities,
      ...emptyGlobalNavigation,
      ...emptyLinks,
    });
  });

  it("omits links to undiscovered destinations", () => {
    expect(compile(fixture("unknown-destination"))).toEqual({
      schemaVersion: "1",
      screens: [{ route: "/", source: { file: "routes/index.tsx" } }],
      navigation: [],
      ...emptyDesignSystem,
      ...emptyActions,
      ...emptyEntities,
      ...emptyGlobalNavigation,
      ...emptyLinks,
    });
  });

  it("ignores a local component named Link", () => {
    expect(compile(fixture("local-name"))).toEqual({
      schemaVersion: "1",
      screens: screens(
        { route: "/", file: "routes/index.tsx" },
        { route: "/projects", file: "routes/projects.tsx" },
      ),
      navigation: [],
      ...emptyDesignSystem,
      ...emptyActions,
      ...emptyEntities,
      ...emptyGlobalNavigation,
      ...emptyLinks,
    });
  });

  it("ignores Link imported from another package", () => {
    expect(compile(fixture("other-package"))).toEqual({
      schemaVersion: "1",
      screens: screens(
        { route: "/", file: "routes/index.tsx" },
        { route: "/projects", file: "routes/projects.tsx" },
      ),
      navigation: [],
      ...emptyDesignSystem,
      ...emptyActions,
      ...emptyEntities,
      ...emptyGlobalNavigation,
      ...emptyLinks,
    });
  });

  it("ignores namespace Link usage", () => {
    expect(compile(fixture("namespace"))).toEqual({
      schemaVersion: "1",
      screens: screens(
        { route: "/", file: "routes/index.tsx" },
        { route: "/projects", file: "routes/projects.tsx" },
      ),
      navigation: [],
      ...emptyDesignSystem,
      ...emptyActions,
      ...emptyEntities,
      ...emptyGlobalNavigation,
      ...emptyLinks,
    });
  });

  it("does not treat a type-only Link import as a value import", () => {
    expect(compile(fixture("type-only"))).toEqual({
      schemaVersion: "1",
      screens: screens(
        { route: "/", file: "routes/index.tsx" },
        { route: "/projects", file: "routes/projects.tsx" },
      ),
      navigation: [],
      ...emptyDesignSystem,
      ...emptyActions,
      ...emptyEntities,
      ...emptyGlobalNavigation,
      ...emptyLinks,
    });
  });

  it("attributes links from a directly imported shared component", () => {
    expect(compile(fixture("shared"))).toEqual({
      schemaVersion: "1",
      screens: screens(
        { route: "/", file: "routes/index.tsx" },
        { route: "/projects", file: "routes/projects.tsx" },
      ),
      navigation: [{ from: "/", to: "/projects" }],
      ...emptyDesignSystem,
      ...emptyActions,
      ...emptyEntities,
      ...emptyGlobalNavigation,
      ...emptyLinks,
    });
  });

  it("drops links when a file declares more than one screen", () => {
    expect(compile(fixture("ambiguous"))).toEqual({
      schemaVersion: "1",
      screens: [
        { route: "/", source: { file: "routes/index.tsx" } },
        { route: "/about", source: { file: "routes/index.tsx" } },
      ],
      navigation: [],
      ...emptyDesignSystem,
      ...emptyActions,
      ...emptyEntities,
      ...emptyGlobalNavigation,
      ...emptyLinks,
    });
  });
});
