import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { compile } from "../src/index.js";

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
const emptyActions = { actions: [] as const };

describe("tanstack destination lowering", () => {
  it("keeps a leaf route", () => {
    expect(compile(fixture("leaf"))).toEqual({
      schemaVersion: "1",
      screens: screens({
        route: "/dashboard",
        file: "routes/dashboard.tsx",
      }),
      ...emptyNavigation,
      ...emptyDesignSystem,
      ...emptyActions,
    });
  });

  it("lowers a standalone index route id to its destination", () => {
    expect(compile(fixture("standalone-index"))).toEqual({
      schemaVersion: "1",
      screens: screens({
        route: "/about",
        file: "routes/about-page.tsx",
      }),
      ...emptyNavigation,
      ...emptyDesignSystem,
      ...emptyActions,
    });
  });

  it("omits a parent when an index route owns the destination", () => {
    expect(compile(fixture("parent-index"))).toEqual({
      schemaVersion: "1",
      screens: screens({
        route: "/programs",
        file: "routes/programs-page.tsx",
      }),
      ...emptyNavigation,
      ...emptyDesignSystem,
      ...emptyActions,
    });
  });

  it("keeps a dynamic child beside the index destination", () => {
    expect(compile(fixture("parent-index-child"))).toEqual({
      schemaVersion: "1",
      screens: screens(
        { route: "/programs", file: "routes/programs-page.tsx" },
        {
          route: "/programs/$programId",
          file: "routes/programs/$programId.tsx",
        },
      ),
      ...emptyNavigation,
      ...emptyDesignSystem,
      ...emptyActions,
    });
  });

  it("keeps a parent when no index route owns the destination", () => {
    expect(compile(fixture("parent-child"))).toEqual({
      schemaVersion: "1",
      screens: screens(
        { route: "/programs", file: "routes/programs.tsx" },
        {
          route: "/programs/$programId",
          file: "routes/programs/$programId.tsx",
        },
      ),
      ...emptyNavigation,
      ...emptyDesignSystem,
      ...emptyActions,
    });
  });

  it("attributes an index-file action to the destination", () => {
    expect(compile(fixture("index-action"))).toEqual({
      schemaVersion: "1",
      screens: screens({
        route: "/programs",
        file: "routes/programs-page.tsx",
      }),
      ...emptyNavigation,
      ...emptyDesignSystem,
      actions: [
        {
          route: "/programs",
          kind: "invoke",
          label: "Save",
          source: { file: "routes/programs-page.tsx" },
          effects: [],
        },
      ],
    });
  });

  it("omits actions from a parent module when an index owns the destination", () => {
    expect(compile(fixture("omitted-layout-action"))).toEqual({
      schemaVersion: "1",
      screens: screens({
        route: "/programs",
        file: "routes/programs-page.tsx",
      }),
      ...emptyNavigation,
      ...emptyDesignSystem,
      actions: [
        {
          route: "/programs",
          kind: "invoke",
          label: "Save",
          source: { file: "routes/programs-page.tsx" },
          effects: [],
        },
      ],
    });
  });

  it("keeps actions on a parent that has no index route", () => {
    expect(compile(fixture("layout-action"))).toEqual({
      schemaVersion: "1",
      screens: screens(
        { route: "/programs", file: "routes/programs.tsx" },
        {
          route: "/programs/$programId",
          file: "routes/programs/$programId.tsx",
        },
      ),
      ...emptyNavigation,
      ...emptyDesignSystem,
      actions: [
        {
          route: "/programs",
          kind: "invoke",
          label: "Filter",
          source: { file: "routes/programs.tsx" },
          effects: [],
        },
      ],
    });
  });

  it("matches a link to the index destination", () => {
    expect(compile(fixture("nav-destination"))).toEqual({
      schemaVersion: "1",
      screens: screens(
        { route: "/programs", file: "routes/programs-page.tsx" },
        {
          route: "/programs/$programId",
          file: "routes/programs/$programId.tsx",
        },
      ),
      navigation: [{ from: "/programs/$programId", to: "/programs" }],
      ...emptyDesignSystem,
      ...emptyActions,
    });
  });

  it("resolves a link that uses the index route id", () => {
    expect(compile(fixture("nav-index-id"))).toEqual({
      schemaVersion: "1",
      screens: screens(
        { route: "/programs", file: "routes/programs-page.tsx" },
        {
          route: "/programs/$programId",
          file: "routes/programs/$programId.tsx",
        },
      ),
      navigation: [{ from: "/programs/$programId", to: "/programs" }],
      ...emptyDesignSystem,
      ...emptyActions,
    });
  });

  it("lowers a nested index route", () => {
    expect(compile(fixture("nested-index"))).toEqual({
      schemaVersion: "1",
      screens: screens(
        { route: "/settings", file: "routes/settings-page.tsx" },
        { route: "/settings/billing", file: "routes/settings/billing.tsx" },
      ),
      ...emptyNavigation,
      ...emptyDesignSystem,
      ...emptyActions,
    });
  });

  it("keeps the root route", () => {
    expect(compile(fixture("root"))).toEqual({
      schemaVersion: "1",
      screens: screens({ route: "/", file: "routes/index.tsx" }),
      ...emptyNavigation,
      ...emptyDesignSystem,
      ...emptyActions,
    });
  });

  it("omits a destination claimed by more than one index route", () => {
    expect(compile(fixture("ambiguous-index"))).toEqual({
      schemaVersion: "1",
      screens: screens({ route: "/other", file: "routes/other.tsx" }),
      ...emptyNavigation,
      ...emptyDesignSystem,
      ...emptyActions,
    });
  });

  it("keeps a non-index route id unchanged", () => {
    expect(compile(fixture("path-segment"))).toEqual({
      schemaVersion: "1",
      screens: screens({ route: "/_auth", file: "routes/auth.tsx" }),
      ...emptyNavigation,
      ...emptyDesignSystem,
      ...emptyActions,
    });
  });
});
