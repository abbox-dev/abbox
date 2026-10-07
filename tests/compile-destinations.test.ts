import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { compile } from "../src/index.js";
import {
  activation,
  stripInteractionIdsFromProduct,
} from "./helpers/interaction-expect.js";

function fixture(name: string): string {
  return fileURLToPath(
    new URL(`./fixtures/tanstack-destinations/${name}`, import.meta.url),
  );
}

function screens(...entries: { route: string; file: string }[]) {
  return entries.map(({ route, file }) => ({
    route,
    source: { file },
  }));
}

const emptyNavigation = { navigation: [] as const };
const emptyDesignSystem = { designSystem: { themes: [] as const } };
const emptyEntities = { entities: [] as const };
const emptyGlobalNavigation = { globalNavigation: [] as const };
const emptyLinks = { links: [] as const, globalLinks: [] as const };
const emptyInteractions = { interactions: [] as const };

describe("tanstack destination lowering", () => {
  it("keeps a leaf route", () => {
    expect(stripInteractionIdsFromProduct(compile(fixture("leaf")))).toEqual({
      schemaVersion: "2",
      screens: screens({
        route: "/dashboard",
        file: "routes/dashboard.tsx",
      }),
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

  it("lowers a standalone index route id to its destination", () => {
    expect(
      stripInteractionIdsFromProduct(compile(fixture("standalone-index"))),
    ).toEqual({
      schemaVersion: "2",
      screens: screens({
        route: "/about",
        file: "routes/about-page.tsx",
      }),
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

  it("omits a parent when an index route owns the destination", () => {
    expect(
      stripInteractionIdsFromProduct(compile(fixture("parent-index"))),
    ).toEqual({
      schemaVersion: "2",
      screens: screens({
        route: "/programs",
        file: "routes/programs-page.tsx",
      }),
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

  it("keeps a dynamic child beside the index destination", () => {
    expect(
      stripInteractionIdsFromProduct(compile(fixture("parent-index-child"))),
    ).toEqual({
      schemaVersion: "2",
      screens: screens(
        { route: "/programs", file: "routes/programs-page.tsx" },
        {
          route: "/programs/$programId",
          file: "routes/programs/$programId.tsx",
        },
      ),
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

  it("keeps a parent when no index route owns the destination", () => {
    expect(
      stripInteractionIdsFromProduct(compile(fixture("parent-child"))),
    ).toEqual({
      schemaVersion: "2",
      screens: screens(
        { route: "/programs", file: "routes/programs.tsx" },
        {
          route: "/programs/$programId",
          file: "routes/programs/$programId.tsx",
        },
      ),
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

  it("attributes an index-file action to the destination", () => {
    expect(
      stripInteractionIdsFromProduct(compile(fixture("index-action"))),
    ).toEqual({
      schemaVersion: "2",
      screens: screens({
        route: "/programs",
        file: "routes/programs-page.tsx",
      }),
      ...emptyNavigation,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      ...emptyDesignSystem,
      ...emptyEntities,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      interactions: [
        activation("/programs", "routes/programs-page.tsx", "Save"),
      ],
    });
    expect(compile(fixture("index-action")).content).toEqual([
      {
        id: "cnt_aba67d811f127fac",
        route: "/programs",
        source: { file: "routes/programs-page.tsx", line: 11 },
        definition: { file: "routes/programs-page.tsx" },
        kind: "text",
        value: { text: "Save" },
        structure: { element: "button" },
      },
    ]);
  });

  it("omits actions from a parent module when an index owns the destination", () => {
    expect(
      stripInteractionIdsFromProduct(compile(fixture("omitted-layout-action"))),
    ).toEqual({
      schemaVersion: "2",
      screens: screens({
        route: "/programs",
        file: "routes/programs-page.tsx",
      }),
      ...emptyNavigation,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      ...emptyDesignSystem,
      ...emptyEntities,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      interactions: [
        activation("/programs", "routes/programs-page.tsx", "Save"),
      ],
    });
    expect(compile(fixture("omitted-layout-action")).content).toEqual([
      {
        id: "cnt_aba67d811f127fac",
        route: "/programs",
        source: { file: "routes/programs-page.tsx", line: 11 },
        definition: { file: "routes/programs-page.tsx" },
        kind: "text",
        value: { text: "Save" },
        structure: { element: "button" },
      },
    ]);
  });

  it("keeps actions on a parent that has no index route", () => {
    expect(
      stripInteractionIdsFromProduct(compile(fixture("layout-action"))),
    ).toEqual({
      schemaVersion: "2",
      screens: screens(
        { route: "/programs", file: "routes/programs.tsx" },
        {
          route: "/programs/$programId",
          file: "routes/programs/$programId.tsx",
        },
      ),
      ...emptyNavigation,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      ...emptyDesignSystem,
      ...emptyEntities,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      interactions: [activation("/programs", "routes/programs.tsx", "Filter")],
    });
    expect(compile(fixture("layout-action")).content).toEqual([
      {
        id: "cnt_d1dbd209779004f7",
        route: "/programs",
        source: { file: "routes/programs.tsx", line: 11 },
        definition: { file: "routes/programs.tsx" },
        kind: "text",
        value: { text: "Filter" },
        structure: { element: "button" },
      },
    ]);
  });

  it("matches a link to the index destination", () => {
    expect(
      stripInteractionIdsFromProduct(compile(fixture("nav-destination"))),
    ).toEqual({
      schemaVersion: "2",
      screens: screens(
        { route: "/programs", file: "routes/programs-page.tsx" },
        {
          route: "/programs/$programId",
          file: "routes/programs/$programId.tsx",
        },
      ),
      navigation: [{ from: "/programs/$programId", to: "/programs" }],
      ...emptyDesignSystem,
      ...emptyEntities,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      ...emptyInteractions,
    });
  });

  it("resolves a link that uses the index route id", () => {
    expect(
      stripInteractionIdsFromProduct(compile(fixture("nav-index-id"))),
    ).toEqual({
      schemaVersion: "2",
      screens: screens(
        { route: "/programs", file: "routes/programs-page.tsx" },
        {
          route: "/programs/$programId",
          file: "routes/programs/$programId.tsx",
        },
      ),
      navigation: [{ from: "/programs/$programId", to: "/programs" }],
      ...emptyDesignSystem,
      ...emptyEntities,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      ...emptyInteractions,
    });
  });

  it("lowers a nested index route", () => {
    expect(
      stripInteractionIdsFromProduct(compile(fixture("nested-index"))),
    ).toEqual({
      schemaVersion: "2",
      screens: screens(
        { route: "/settings", file: "routes/settings-page.tsx" },
        { route: "/settings/billing", file: "routes/settings/billing.tsx" },
      ),
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

  it("keeps the root route", () => {
    expect(stripInteractionIdsFromProduct(compile(fixture("root")))).toEqual({
      schemaVersion: "2",
      screens: screens({ route: "/", file: "routes/index.tsx" }),
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

  it("omits a destination claimed by more than one index route", () => {
    expect(
      stripInteractionIdsFromProduct(compile(fixture("ambiguous-index"))),
    ).toEqual({
      schemaVersion: "2",
      screens: screens({ route: "/other", file: "routes/other.tsx" }),
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

  it("keeps a non-index route id unchanged", () => {
    expect(
      stripInteractionIdsFromProduct(compile(fixture("path-segment"))),
    ).toEqual({
      schemaVersion: "2",
      screens: screens({ route: "/_auth", file: "routes/auth.tsx" }),
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
});
