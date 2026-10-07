import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { compile } from "../src/index.js";
import {
  activation,
  stripInteractionIdsFromProduct,
} from "./helpers/interaction-expect.js";

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
const emptyInteractions = { interactions: [] as const };
const emptyEntities = { entities: [] as const };
const emptyGlobalNavigation = { globalNavigation: [] as const };
const emptyLinks = { links: [] as const, globalLinks: [] as const };

describe("compile navigation", () => {
  it("links from / to a discovered /projects screen", () => {
    expect(stripInteractionIdsFromProduct(compile(fixture("direct")))).toEqual({
      schemaVersion: "2",
      screens: screens(
        { route: "/", file: "routes/index.tsx" },
        { route: "/projects", file: "routes/projects.tsx" },
      ),
      navigation: [{ from: "/", to: "/projects" }],
      ...emptyDesignSystem,
      ...emptyInteractions,
      ...emptyEntities,
      ...emptyGlobalNavigation,
      ...emptyLinks,
    });
  });

  it("attributes a link in another function in the route file", () => {
    expect(
      stripInteractionIdsFromProduct(compile(fixture("same-file-helper"))),
    ).toEqual({
      schemaVersion: "2",
      screens: screens(
        { route: "/", file: "routes/index.tsx" },
        { route: "/projects", file: "routes/projects.tsx" },
      ),
      navigation: [{ from: "/", to: "/projects" }],
      ...emptyDesignSystem,
      ...emptyInteractions,
      ...emptyEntities,
      ...emptyGlobalNavigation,
      ...emptyLinks,
    });
  });

  it("follows a same-file Link import alias", () => {
    expect(stripInteractionIdsFromProduct(compile(fixture("aliased")))).toEqual(
      {
        schemaVersion: "2",
        screens: screens(
          { route: "/", file: "routes/index.tsx" },
          { route: "/settings", file: "routes/settings.tsx" },
        ),
        navigation: [{ from: "/", to: "/settings" }],
        ...emptyDesignSystem,
        ...emptyInteractions,
        ...emptyEntities,
        ...emptyGlobalNavigation,
        ...emptyLinks,
      },
    );
  });

  it("deduplicates edges and sorts by from then to", () => {
    expect(
      stripInteractionIdsFromProduct(compile(fixture("multiple"))),
    ).toEqual({
      schemaVersion: "2",
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
      ...emptyInteractions,
      ...emptyEntities,
      ...emptyGlobalNavigation,
      ...emptyLinks,
    });
  });

  it("preserves a dynamic route literal when the screen exists", () => {
    expect(
      stripInteractionIdsFromProduct(compile(fixture("dynamic-segment"))),
    ).toEqual({
      schemaVersion: "2",
      screens: screens(
        { route: "/", file: "routes/index.tsx" },
        {
          route: "/projects/$projectId",
          file: "routes/projects/$projectId.tsx",
        },
      ),
      navigation: [{ from: "/", to: "/projects/$projectId" }],
      ...emptyDesignSystem,
      ...emptyInteractions,
      ...emptyEntities,
      ...emptyGlobalNavigation,
      ...emptyLinks,
    });
  });

  it("accepts a braced string literal destination", () => {
    expect(
      stripInteractionIdsFromProduct(compile(fixture("braced-literal"))),
    ).toEqual({
      schemaVersion: "2",
      screens: screens(
        { route: "/", file: "routes/index.tsx" },
        { route: "/projects", file: "routes/projects.tsx" },
      ),
      navigation: [{ from: "/", to: "/projects" }],
      ...emptyDesignSystem,
      ...emptyInteractions,
      ...emptyEntities,
      ...emptyGlobalNavigation,
      ...emptyLinks,
    });
  });

  it("keeps only static absolute Link destinations to discovered screens", () => {
    expect(
      stripInteractionIdsFromProduct(compile(fixture("non-literal"))),
    ).toEqual({
      schemaVersion: "2",
      screens: screens(
        { route: "/", file: "routes/index.tsx" },
        { route: "/projects", file: "routes/projects.tsx" },
      ),
      navigation: [{ from: "/", to: "/projects" }],
      ...emptyDesignSystem,
      interactions: [
        activation("/", "routes/index.tsx", "Navigate"),
        activation("/", "routes/index.tsx", "Redirect"),
      ],
      ...emptyEntities,
      ...emptyGlobalNavigation,
      ...emptyLinks,
    });
    expect(compile(fixture("non-literal")).content).toEqual([
      {
        id: "cnt_fba9f0a0b12509c2",
        route: "/",
        source: { file: "routes/index.tsx", line: 23 },
        definition: { file: "routes/index.tsx" },
        kind: "text",
        value: { text: "Anchor" },
        structure: { element: "a" },
      },
      {
        id: "cnt_0c916ff3b162dea4",
        route: "/",
        source: { file: "routes/index.tsx", line: 24 },
        definition: { file: "routes/index.tsx" },
        kind: "text",
        value: { text: "Navigate" },
        structure: { element: "button" },
      },
      {
        id: "cnt_f8ce4e784b0878b4",
        route: "/",
        source: { file: "routes/index.tsx", line: 27 },
        definition: { file: "routes/index.tsx" },
        kind: "text",
        value: { text: "Redirect" },
        structure: { element: "button" },
      },
    ]);
  });

  it("omits links to undiscovered destinations", () => {
    expect(
      stripInteractionIdsFromProduct(compile(fixture("unknown-destination"))),
    ).toEqual({
      schemaVersion: "2",
      screens: [{ route: "/", source: { file: "routes/index.tsx" } }],
      navigation: [],
      ...emptyDesignSystem,
      ...emptyInteractions,
      ...emptyEntities,
      ...emptyGlobalNavigation,
      ...emptyLinks,
    });
  });

  it("ignores a local component named Link", () => {
    expect(
      stripInteractionIdsFromProduct(compile(fixture("local-name"))),
    ).toEqual({
      schemaVersion: "2",
      screens: screens(
        { route: "/", file: "routes/index.tsx" },
        { route: "/projects", file: "routes/projects.tsx" },
      ),
      navigation: [],
      ...emptyDesignSystem,
      ...emptyInteractions,
      ...emptyEntities,
      ...emptyGlobalNavigation,
      ...emptyLinks,
    });
  });

  it("ignores Link imported from another package", () => {
    expect(
      stripInteractionIdsFromProduct(compile(fixture("other-package"))),
    ).toEqual({
      schemaVersion: "2",
      screens: screens(
        { route: "/", file: "routes/index.tsx" },
        { route: "/projects", file: "routes/projects.tsx" },
      ),
      navigation: [],
      ...emptyDesignSystem,
      ...emptyInteractions,
      ...emptyEntities,
      ...emptyGlobalNavigation,
      ...emptyLinks,
    });
  });

  it("ignores namespace Link usage", () => {
    expect(
      stripInteractionIdsFromProduct(compile(fixture("namespace"))),
    ).toEqual({
      schemaVersion: "2",
      screens: screens(
        { route: "/", file: "routes/index.tsx" },
        { route: "/projects", file: "routes/projects.tsx" },
      ),
      navigation: [],
      ...emptyDesignSystem,
      ...emptyInteractions,
      ...emptyEntities,
      ...emptyGlobalNavigation,
      ...emptyLinks,
    });
  });

  it("does not treat a type-only Link import as a value import", () => {
    expect(
      stripInteractionIdsFromProduct(compile(fixture("type-only"))),
    ).toEqual({
      schemaVersion: "2",
      screens: screens(
        { route: "/", file: "routes/index.tsx" },
        { route: "/projects", file: "routes/projects.tsx" },
      ),
      navigation: [],
      ...emptyDesignSystem,
      ...emptyInteractions,
      ...emptyEntities,
      ...emptyGlobalNavigation,
      ...emptyLinks,
    });
  });

  it("attributes links from a directly imported shared component", () => {
    expect(stripInteractionIdsFromProduct(compile(fixture("shared")))).toEqual({
      schemaVersion: "2",
      screens: screens(
        { route: "/", file: "routes/index.tsx" },
        { route: "/projects", file: "routes/projects.tsx" },
      ),
      navigation: [{ from: "/", to: "/projects" }],
      ...emptyDesignSystem,
      ...emptyInteractions,
      ...emptyEntities,
      ...emptyGlobalNavigation,
      ...emptyLinks,
    });
  });

  it("drops links when a file declares more than one screen", () => {
    expect(
      stripInteractionIdsFromProduct(compile(fixture("ambiguous"))),
    ).toEqual({
      schemaVersion: "2",
      screens: [
        { route: "/", source: { file: "routes/index.tsx" } },
        { route: "/about", source: { file: "routes/index.tsx" } },
      ],
      navigation: [],
      ...emptyDesignSystem,
      ...emptyInteractions,
      ...emptyEntities,
      ...emptyGlobalNavigation,
      ...emptyLinks,
    });
  });
});
