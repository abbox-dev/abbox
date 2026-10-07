import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { compile } from "../src/index.js";
import { stripInteractionIdsFromProduct } from "./helpers/interaction-expect.js";

function fixture(name: string): string {
  return fileURLToPath(
    new URL(`./fixtures/tanstack-navigation-v2/${name}`, import.meta.url),
  );
}

const emptyDesignSystem = { designSystem: { themes: [] as const } };
const emptyInteractions = { interactions: [] as const };
const emptyEntities = { entities: [] as const };
const emptyGlobalNavigation = { globalNavigation: [] as const };
const emptyLinks = { links: [] as const, globalLinks: [] as const };

function screens(...entries: { route: string; file: string }[]) {
  return entries.map(({ route, file }) => ({
    route,
    source: { file },
  }));
}

describe("navigation v2 component attribution", () => {
  it("attributes a direct named imported component link", () => {
    expect(
      stripInteractionIdsFromProduct(compile(fixture("component-named"))),
    ).toEqual({
      schemaVersion: "2",
      screens: screens(
        { route: "/", file: "routes/index.tsx" },
        { route: "/items/$itemId", file: "routes/items/$itemId.tsx" },
      ),
      navigation: [{ from: "/", to: "/items/$itemId" }],
      ...emptyGlobalNavigation,
      ...emptyLinks,
      ...emptyDesignSystem,
      ...emptyInteractions,
      ...emptyEntities,
    });
  });

  it("follows a named import alias", () => {
    expect(
      stripInteractionIdsFromProduct(compile(fixture("component-alias"))),
    ).toMatchObject({
      navigation: [{ from: "/", to: "/target" }],
      globalNavigation: [],
    });
  });

  it("attributes a default exported component", () => {
    expect(
      stripInteractionIdsFromProduct(compile(fixture("component-default"))),
    ).toMatchObject({
      navigation: [{ from: "/", to: "/target" }],
    });
  });

  it("attributes only the referenced component in a multi-export module", () => {
    expect(
      stripInteractionIdsFromProduct(compile(fixture("multi-export-module"))),
    ).toMatchObject({
      navigation: [{ from: "/", to: "/a" }],
      globalNavigation: [],
    });
  });

  it("attributes the same component used on multiple screens", () => {
    expect(
      stripInteractionIdsFromProduct(compile(fixture("multi-screen-usage"))),
    ).toMatchObject({
      navigation: [
        { from: "/", to: "/detail/$id" },
        { from: "/other", to: "/detail/$id" },
      ],
    });
  });

  it("attributes links when the component is conditionally rendered", () => {
    expect(
      stripInteractionIdsFromProduct(compile(fixture("conditional-component"))),
    ).toMatchObject({
      navigation: [{ from: "/", to: "/target" }],
    });
  });

  it("attributes links inside a fragment within the component", () => {
    expect(
      stripInteractionIdsFromProduct(compile(fixture("fragment-link"))),
    ).toMatchObject({
      navigation: [{ from: "/", to: "/target" }],
    });
  });

  it("attributes Link nested under Button asChild", () => {
    expect(
      stripInteractionIdsFromProduct(compile(fixture("button-as-child"))),
    ).toMatchObject({
      navigation: [{ from: "/", to: "/target" }],
    });
  });

  it("does not traverse an imported child component", () => {
    expect(
      stripInteractionIdsFromProduct(compile(fixture("no-recursive-child"))),
    ).toMatchObject({
      navigation: [],
    });
  });

  it("omits barrel re-export imports", () => {
    expect(
      stripInteractionIdsFromProduct(compile(fixture("barrel-import"))),
    ).toMatchObject({
      navigation: [],
    });
  });

  it("omits dynamic component bindings", () => {
    expect(
      stripInteractionIdsFromProduct(compile(fixture("dynamic-component"))),
    ).toMatchObject({
      navigation: [],
    });
  });

  it("omits conditional Link destinations", () => {
    expect(
      stripInteractionIdsFromProduct(compile(fixture("dynamic-to"))),
    ).toMatchObject({
      navigation: [],
    });
  });

  it("omits unknown destinations", () => {
    expect(
      stripInteractionIdsFromProduct(compile(fixture("unknown-destination"))),
    ).toMatchObject({
      navigation: [],
    });
  });

  it("dedupes same-file and component-attributed edges", () => {
    expect(
      stripInteractionIdsFromProduct(compile(fixture("dedupe-edges"))),
    ).toMatchObject({
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

  it("extracts global navigation from sibling chrome around Outlet", () => {
    expect(compile(fixture("global-chrome-siblings")).globalNavigation).toEqual(
      [
        { to: "/", source: { file: "components/TopBar.tsx" } },
        { to: "/about", source: { file: "components/TopBar.tsx" } },
        { to: "/contact", source: { file: "components/BottomBar.tsx" } },
      ],
    );
    expect(compile(fixture("global-chrome-siblings")).navigation).toEqual([]);
  });

  it("omits sibling global chrome when the module is reused on a route screen", () => {
    expect(
      compile(fixture("global-chrome-siblings-reused")).globalNavigation,
    ).toEqual([]);
  });
});

describe("navigation v3 static lowering", () => {
  it("attributes navigation through a literal JSX prop into an imported component", () => {
    expect(
      stripInteractionIdsFromProduct(compile(fixture("prop-link-screen"))),
    ).toMatchObject({
      navigation: [{ from: "/", to: "/target" }],
    });
  });

  it("attributes navigation through a literal prop into a same-file helper component", () => {
    expect(
      stripInteractionIdsFromProduct(compile(fixture("prop-link-local-slug"))),
    ).toMatchObject({
      navigation: [{ from: "/", to: "/detail" }],
    });
  });

  it("resolves a local const binding in Link to", () => {
    expect(
      stripInteractionIdsFromProduct(compile(fixture("static-local-const"))),
    ).toMatchObject({
      navigation: [{ from: "/", to: "/target" }],
    });
  });

  it("resolves static array map property access in Link to", () => {
    expect(
      stripInteractionIdsFromProduct(compile(fixture("static-local-map"))),
    ).toMatchObject({
      navigation: [
        { from: "/", to: "/a" },
        { from: "/", to: "/b" },
      ],
    });
  });

  it("resolves destructured map parameters in Link to", () => {
    expect(
      stripInteractionIdsFromProduct(
        compile(fixture("static-local-map-destructure")),
      ),
    ).toMatchObject({
      navigation: [
        { from: "/", to: "/x" },
        { from: "/", to: "/y" },
      ],
    });
  });
});
