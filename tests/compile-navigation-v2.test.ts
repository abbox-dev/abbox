import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { compile } from "../src/index.js";

function fixture(name: string): string {
  return fileURLToPath(
    new URL(`./fixtures/tanstack-navigation-v2/${name}`, import.meta.url),
  );
}

const emptyDesignSystem = { designSystem: { themes: [] as const } };
const emptyActions = { actions: [] as const };
const emptyEntities = { entities: [] as const };
const emptyGlobalNavigation = { globalNavigation: [] as const };

function screens(...entries: { route: string; file: string }[]) {
  return entries.map(({ route, file }) => ({
    route,
    source: { file },
  }));
}

describe("navigation v2 component attribution", () => {
  it("attributes a direct named imported component link", () => {
    expect(compile(fixture("component-named"))).toEqual({
      schemaVersion: "1",
      screens: screens(
        { route: "/", file: "routes/index.tsx" },
        { route: "/items/$itemId", file: "routes/items/$itemId.tsx" },
      ),
      navigation: [{ from: "/", to: "/items/$itemId" }],
      ...emptyGlobalNavigation,
      ...emptyDesignSystem,
      ...emptyActions,
      ...emptyEntities,
    });
  });

  it("follows a named import alias", () => {
    expect(compile(fixture("component-alias"))).toMatchObject({
      navigation: [{ from: "/", to: "/target" }],
      globalNavigation: [],
    });
  });

  it("attributes a default exported component", () => {
    expect(compile(fixture("component-default"))).toMatchObject({
      navigation: [{ from: "/", to: "/target" }],
    });
  });

  it("attributes only the referenced component in a multi-export module", () => {
    expect(compile(fixture("multi-export-module"))).toMatchObject({
      navigation: [{ from: "/", to: "/a" }],
      globalNavigation: [],
    });
  });

  it("attributes the same component used on multiple screens", () => {
    expect(compile(fixture("multi-screen-usage"))).toMatchObject({
      navigation: [
        { from: "/", to: "/detail/$id" },
        { from: "/other", to: "/detail/$id" },
      ],
    });
  });

  it("attributes links when the component is conditionally rendered", () => {
    expect(compile(fixture("conditional-component"))).toMatchObject({
      navigation: [{ from: "/", to: "/target" }],
    });
  });

  it("attributes links inside a fragment within the component", () => {
    expect(compile(fixture("fragment-link"))).toMatchObject({
      navigation: [{ from: "/", to: "/target" }],
    });
  });

  it("attributes Link nested under Button asChild", () => {
    expect(compile(fixture("button-as-child"))).toMatchObject({
      navigation: [{ from: "/", to: "/target" }],
    });
  });

  it("does not traverse an imported child component", () => {
    expect(compile(fixture("no-recursive-child"))).toMatchObject({
      navigation: [],
    });
  });

  it("omits barrel re-export imports", () => {
    expect(compile(fixture("barrel-import"))).toMatchObject({
      navigation: [],
    });
  });

  it("omits dynamic component bindings", () => {
    expect(compile(fixture("dynamic-component"))).toMatchObject({
      navigation: [],
    });
  });

  it("omits conditional Link destinations", () => {
    expect(compile(fixture("dynamic-to"))).toMatchObject({
      navigation: [],
    });
  });

  it("omits unknown destinations", () => {
    expect(compile(fixture("unknown-destination"))).toMatchObject({
      navigation: [],
    });
  });

  it("dedupes same-file and component-attributed edges", () => {
    expect(compile(fixture("dedupe-edges"))).toMatchObject({
      navigation: [{ from: "/", to: "/target" }],
    });
  });
});

describe("navigation v2 global chrome", () => {
  it("extracts global navigation from root chrome wrapping Outlet", () => {
    const result = compile(fixture("global-chrome"));
    expect(result.globalNavigation).toEqual([
      { to: "/", source: { file: "components/Chrome.tsx" } },
      { to: "/b", source: { file: "components/Chrome.tsx" } },
    ]);
    expect(result.navigation).toEqual([]);
  });

  it("dedupes duplicate chrome destinations", () => {
    expect(compile(fixture("global-chrome-dedupe")).globalNavigation).toEqual([
      { to: "/", source: { file: "components/Chrome.tsx" } },
      { to: "/b", source: { file: "components/Chrome.tsx" } },
    ]);
  });

  it("does not expand global navigation into per-screen navigation edges", () => {
    const result = compile(fixture("global-chrome"));
    expect(result.navigation).toEqual([]);
    expect(
      result.navigation.some((edge) => edge.to === "/b" && edge.from !== "/"),
    ).toBe(false);
  });

  it("does not include notFoundComponent links in global navigation", () => {
    expect(
      compile(fixture("global-chrome-not-found")).globalNavigation,
    ).toEqual([{ to: "/b", source: { file: "components/Chrome.tsx" } }]);
  });

  it("does not include errorComponent links in global navigation", () => {
    expect(compile(fixture("global-chrome-error")).globalNavigation).toEqual([
      { to: "/b", source: { file: "components/Chrome.tsx" } },
    ]);
  });

  it("still extracts chrome when a provider wraps the shell", () => {
    expect(compile(fixture("global-chrome-provider")).globalNavigation).toEqual(
      [{ to: "/b", source: { file: "components/Chrome.tsx" } }],
    );
  });

  it("collects chrome links only from the innermost Outlet wrapper, not SavedProvider", () => {
    expect(
      compile(fixture("global-chrome-saved-provider")).globalNavigation,
    ).toEqual([{ to: "/", source: { file: "components/Chrome.tsx" } }]);
  });

  it("omits ambiguous root wrappers", () => {
    expect(
      compile(fixture("global-chrome-ambiguous")).globalNavigation,
    ).toEqual([]);
  });

  it("omits global chrome when the module is reused on a route screen", () => {
    expect(
      compile(fixture("global-chrome-reused-on-route")).globalNavigation,
    ).toEqual([]);
  });

  it("returns empty globalNavigation when no chrome qualifies", () => {
    expect(compile(fixture("component-named")).globalNavigation).toEqual([]);
  });
});
