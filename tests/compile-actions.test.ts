import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { compile } from "../src/index.js";

function fixture(name: string): string {
  return fileURLToPath(
    new URL(`./fixtures/tanstack-actions/${name}`, import.meta.url),
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

function invoke(
  route: string,
  file: string,
  label?: string,
): {
  route: string;
  kind: "invoke";
  source: { file: string };
  label?: string;
} {
  const action = {
    route,
    kind: "invoke" as const,
    source: { file },
    effects: [] as const,
  };
  if (label !== undefined) {
    return { ...action, label };
  }
  return action;
}

function submit(route: string, file: string) {
  return {
    route,
    kind: "submit" as const,
    source: { file },
    effects: [] as const,
  };
}

describe("compile actions", () => {
  it("extracts a native button with static text and identifier handler", () => {
    expect(compile(fixture("button-static-label"))).toEqual({
      schemaVersion: "1",
      screens: screens({ route: "/", file: "routes/index.tsx" }),
      ...emptyNavigation,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      ...emptyDesignSystem,
      ...emptyEntities,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      actions: [invoke("/", "routes/index.tsx", "Save")],
    });
  });

  it("extracts an inline arrow handler", () => {
    expect(compile(fixture("button-inline-arrow"))).toEqual({
      schemaVersion: "1",
      screens: screens({ route: "/", file: "routes/index.tsx" }),
      ...emptyNavigation,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      ...emptyDesignSystem,
      ...emptyEntities,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      actions: [invoke("/", "routes/index.tsx", "Add investor")],
    });
  });

  it("omits a button without onClick", () => {
    expect(compile(fixture("button-no-handler"))).toEqual({
      schemaVersion: "1",
      screens: screens({ route: "/", file: "routes/index.tsx" }),
      ...emptyNavigation,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      ...emptyDesignSystem,
      ...emptyEntities,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      actions: [],
    });
  });

  it("extracts multiple actions on one screen", () => {
    expect(compile(fixture("multiple-on-screen"))).toEqual({
      schemaVersion: "1",
      screens: screens({ route: "/", file: "routes/index.tsx" }),
      ...emptyNavigation,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      ...emptyDesignSystem,
      ...emptyEntities,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      actions: [
        invoke("/", "routes/index.tsx", "First"),
        invoke("/", "routes/index.tsx", "Second"),
      ],
    });
  });

  it("attributes actions to the correct routes across files", () => {
    expect(compile(fixture("two-screens"))).toEqual({
      schemaVersion: "1",
      screens: screens(
        { route: "/", file: "routes/index.tsx" },
        { route: "/projects", file: "routes/projects.tsx" },
      ),
      ...emptyNavigation,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      ...emptyDesignSystem,
      ...emptyEntities,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      actions: [
        invoke("/", "routes/index.tsx", "Home"),
        invoke("/projects", "routes/projects.tsx", "Projects"),
      ],
    });
  });

  it("extracts form onSubmit as submit", () => {
    expect(compile(fixture("form-submit"))).toEqual({
      schemaVersion: "1",
      screens: screens({ route: "/", file: "routes/index.tsx" }),
      ...emptyNavigation,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      ...emptyDesignSystem,
      ...emptyEntities,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      actions: [submit("/", "routes/index.tsx")],
    });
  });

  it("keeps independent type=button invokes inside an onSubmit form", () => {
    expect(compile(fixture("form-mixed-actions"))).toEqual({
      schemaVersion: "1",
      screens: screens({ route: "/", file: "routes/index.tsx" }),
      ...emptyNavigation,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      ...emptyDesignSystem,
      ...emptyEntities,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      actions: [
        invoke("/", "routes/index.tsx", "Add item"),
        invoke("/", "routes/index.tsx", "Remove row"),
        submit("/", "routes/index.tsx"),
      ],
    });
  });

  it("emits invoke for submit control with its own onClick", () => {
    expect(compile(fixture("form-submit-with-onclick"))).toEqual({
      schemaVersion: "1",
      screens: screens({ route: "/", file: "routes/index.tsx" }),
      ...emptyNavigation,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      ...emptyDesignSystem,
      ...emptyEntities,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      actions: [
        invoke("/", "routes/index.tsx", "Save"),
        submit("/", "routes/index.tsx"),
      ],
    });
  });

  it("extracts invoke when a form has no onSubmit but a button has onClick", () => {
    expect(compile(fixture("form-button-onclick-only"))).toEqual({
      schemaVersion: "1",
      screens: screens({ route: "/", file: "routes/index.tsx" }),
      ...emptyNavigation,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      ...emptyDesignSystem,
      ...emptyEntities,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      actions: [invoke("/", "routes/index.tsx", "Cancel")],
    });
  });

  it("uses aria-label when static children are not usable", () => {
    expect(compile(fixture("button-aria-label"))).toEqual({
      schemaVersion: "1",
      screens: screens({ route: "/", file: "routes/index.tsx" }),
      ...emptyNavigation,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      ...emptyDesignSystem,
      ...emptyEntities,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      actions: [invoke("/", "routes/index.tsx", "Save")],
    });
  });

  it("omits label for expression-based children", () => {
    expect(compile(fixture("button-dynamic-label"))).toEqual({
      schemaVersion: "1",
      screens: screens({ route: "/", file: "routes/index.tsx" }),
      ...emptyNavigation,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      ...emptyDesignSystem,
      ...emptyEntities,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      actions: [invoke("/", "routes/index.tsx")],
    });
  });

  it("collects nested static text for the label", () => {
    expect(compile(fixture("button-nested-static"))).toEqual({
      schemaVersion: "1",
      screens: screens({ route: "/", file: "routes/index.tsx" }),
      ...emptyNavigation,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      ...emptyDesignSystem,
      ...emptyEntities,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      actions: [invoke("/", "routes/index.tsx", "Save")],
    });
  });

  it("recognizes ui/button imports", () => {
    expect(compile(fixture("ui-button-import"))).toEqual({
      schemaVersion: "1",
      screens: screens({ route: "/", file: "routes/index.tsx" }),
      ...emptyNavigation,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      ...emptyDesignSystem,
      ...emptyEntities,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      actions: [invoke("/", "routes/index.tsx", "Save")],
    });
  });

  it("ignores a local component named Button", () => {
    expect(compile(fixture("ui-button-false-positive"))).toEqual({
      schemaVersion: "1",
      screens: screens({ route: "/", file: "routes/index.tsx" }),
      ...emptyNavigation,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      ...emptyDesignSystem,
      ...emptyEntities,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      actions: [],
    });
  });

  it("attributes actions in directly rendered shared components", () => {
    expect(compile(fixture("shared-component"))).toEqual({
      schemaVersion: "1",
      screens: screens({ route: "/", file: "routes/index.tsx" }),
      ...emptyNavigation,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      ...emptyDesignSystem,
      ...emptyEntities,
      actions: [invoke("/", "routes/index.tsx", "Delete")],
    });
  });

  it("drops actions when a file declares more than one screen", () => {
    expect(compile(fixture("ambiguous-file"))).toEqual({
      schemaVersion: "1",
      screens: [
        { route: "/", source: { file: "routes/index.tsx" } },
        { route: "/about", source: { file: "routes/index.tsx" } },
      ],
      ...emptyNavigation,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      ...emptyDesignSystem,
      ...emptyEntities,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      actions: [],
    });
  });

  it("does not deduplicate identical-looking actions", () => {
    expect(compile(fixture("duplicate-buttons"))).toEqual({
      schemaVersion: "1",
      screens: screens({ route: "/", file: "routes/index.tsx" }),
      ...emptyNavigation,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      ...emptyDesignSystem,
      ...emptyEntities,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      actions: [
        invoke("/", "routes/index.tsx", "Save"),
        invoke("/", "routes/index.tsx", "Save"),
      ],
    });
  });

  it("sorts actions deterministically", () => {
    expect(compile(fixture("ordering"))).toEqual({
      schemaVersion: "1",
      screens: screens({ route: "/", file: "routes/index.tsx" }),
      ...emptyNavigation,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      ...emptyDesignSystem,
      ...emptyEntities,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      actions: [
        invoke("/", "routes/index.tsx", "Alpha"),
        invoke("/", "routes/index.tsx", "Zebra"),
        submit("/", "routes/index.tsx"),
      ],
    });
  });

  it("treats navigate onClick as invoke without navigation", () => {
    expect(compile(fixture("navigate-onclick"))).toEqual({
      schemaVersion: "1",
      screens: screens({ route: "/", file: "routes/index.tsx" }),
      ...emptyNavigation,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      ...emptyDesignSystem,
      ...emptyEntities,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      actions: [invoke("/", "routes/index.tsx", "Settings")],
    });
  });

  it("does not recognize conditional handlers", () => {
    expect(compile(fixture("button-conditional-handler"))).toEqual({
      schemaVersion: "1",
      screens: screens({ route: "/", file: "routes/index.tsx" }),
      ...emptyNavigation,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      ...emptyDesignSystem,
      ...emptyEntities,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      actions: [],
    });
  });

  it("does not recognize logical handlers", () => {
    expect(compile(fixture("button-logical-handler"))).toEqual({
      schemaVersion: "1",
      screens: screens({ route: "/", file: "routes/index.tsx" }),
      ...emptyNavigation,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      ...emptyDesignSystem,
      ...emptyEntities,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      actions: [],
    });
  });

  it("omits the label when nested children mix expressions and static text", () => {
    expect(compile(fixture("button-label-mixed-dynamic"))).toEqual({
      schemaVersion: "1",
      screens: screens({ route: "/", file: "routes/index.tsx" }),
      ...emptyNavigation,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      ...emptyDesignSystem,
      ...emptyEntities,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      actions: [invoke("/", "routes/index.tsx")],
    });
  });

  it("omits the label when an expression is mixed with static suffix text", () => {
    expect(compile(fixture("button-label-expression-suffix"))).toEqual({
      schemaVersion: "1",
      screens: screens({ route: "/", file: "routes/index.tsx" }),
      ...emptyNavigation,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      ...emptyDesignSystem,
      ...emptyEntities,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      actions: [invoke("/", "routes/index.tsx")],
    });
  });

  it("recovers static text nested inside a component wrapper", () => {
    expect(compile(fixture("button-label-component-static"))).toEqual({
      schemaVersion: "1",
      screens: screens({ route: "/", file: "routes/index.tsx" }),
      ...emptyNavigation,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      ...emptyDesignSystem,
      ...emptyEntities,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      actions: [invoke("/", "routes/index.tsx", "Save")],
    });
  });

  it("prefers a static aria-label over expression-based children", () => {
    expect(compile(fixture("button-label-aria-over-dynamic"))).toEqual({
      schemaVersion: "1",
      screens: screens({ route: "/", file: "routes/index.tsx" }),
      ...emptyNavigation,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      ...emptyDesignSystem,
      ...emptyEntities,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      actions: [invoke("/", "routes/index.tsx", "Save")],
    });
  });
});

describe("compile actions attribution v2", () => {
  it("attributes invoke actions from a named imported component", () => {
    const result = compile(fixture("component-named"));
    expect(result.schemaVersion).toBe("1");
    expect(result.actions).toEqual([
      invoke("/items", "routes/index.tsx", "Save item"),
    ]);
  });

  it("attributes invoke actions from a default imported component", () => {
    expect(compile(fixture("component-default")).actions).toEqual([
      invoke("/", "routes/index.tsx", "Default card"),
    ]);
  });

  it("attributes actions when the import is aliased", () => {
    expect(compile(fixture("component-alias")).actions).toEqual([
      invoke("/", "routes/index.tsx", "Aliased"),
    ]);
  });

  it("attributes submit actions inside an imported component", () => {
    expect(compile(fixture("component-submit")).actions).toEqual([
      submit("/", "routes/index.tsx"),
    ]);
  });

  it("preserves supported effects on attributed actions", () => {
    expect(compile(fixture("component-state-effect")).actions).toEqual([
      {
        route: "/",
        kind: "invoke",
        label: "Bump",
        source: { file: "routes/index.tsx" },
        effects: [{ kind: "state", target: "count", value: 1 }],
      },
    ]);
  });

  it("analyzes only the exported component referenced by the route", () => {
    expect(compile(fixture("component-multi-export")).actions).toEqual([
      invoke("/", "routes/index.tsx", "A only"),
    ]);
  });

  it("attributes the same component action to each screen that renders it", () => {
    expect(compile(fixture("component-two-screens")).actions).toEqual([
      invoke("/alpha", "routes/index.tsx", "Shared"),
      invoke("/beta", "routes/beta.tsx", "Shared"),
    ]);
  });

  it("omits actions when the component import cannot be resolved", () => {
    expect(compile(fixture("component-unresolved")).actions).toEqual([]);
  });

  it("omits actions when the import resolves through a barrel module", () => {
    expect(compile(fixture("component-barrel")).actions).toEqual([]);
  });

  it("omits type-only imports for component attribution", () => {
    expect(compile(fixture("component-type-only")).actions).toEqual([
      invoke("/", "routes/index.tsx", "Real"),
    ]);
  });

  it("omits component attribution when the route module has multiple screens", () => {
    expect(compile(fixture("component-ambiguous")).actions).toEqual([]);
  });

  it("does not attribute actions from nested imported child components", () => {
    expect(compile(fixture("component-no-recursive")).actions).toEqual([]);
  });

  it("omits actions defined in a sibling local component outside the export body", () => {
    expect(compile(fixture("component-nested-local")).actions).toEqual([]);
  });

  it("omits unsupported conditional handlers inside attributed components", () => {
    expect(compile(fixture("component-conditional-handler")).actions).toEqual(
      [],
    );
  });

  it("supports conditional JSX when the component tag is static", () => {
    expect(compile(fixture("component-conditional-jsx")).actions).toEqual([
      invoke("/", "routes/index.tsx", "Conditional"),
    ]);
  });

  it("dedupes duplicate attributed discovery for the same route module", () => {
    expect(compile(fixture("component-dedupe-alias")).actions).toEqual([
      invoke("/", "routes/index.tsx", "Once"),
    ]);
  });

  it("leaves same-file action extraction unchanged", () => {
    expect(compile(fixture("button-static-label")).actions).toEqual([
      invoke("/", "routes/index.tsx", "Save"),
    ]);
  });

  it("does not change navigation when adding component action attribution", () => {
    expect(compile(fixture("component-nav-unchanged"))).toMatchObject({
      schemaVersion: "1",
      navigation: [{ from: "/", to: "/target" }],
      actions: [invoke("/", "routes/index.tsx", "Stay")],
    });
  });

  it("does not attribute actions from global application chrome to screens", () => {
    expect(compile(fixture("global-chrome-button"))).toMatchObject({
      schemaVersion: "1",
      actions: [],
      globalNavigation: [
        { to: "/", source: { file: "components/Chrome.tsx" } },
      ],
    });
  });
});
