import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { compile } from "../src/index.js";
import {
  activation,
  stripInteractionIdsFromProduct,
  submit,
} from "./helpers/interaction-expect.js";

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

function expectProduct(projectPath: string, expected: object): void {
  expect(stripInteractionIdsFromProduct(compile(projectPath))).toEqual(
    expected,
  );
}

describe("compile actions", () => {
  it("extracts a native button with static text and identifier handler", () => {
    expectProduct(fixture("button-static-label"), {
      schemaVersion: "2",
      screens: screens({ route: "/", file: "routes/index.tsx" }),
      ...emptyNavigation,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      ...emptyDesignSystem,
      ...emptyEntities,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      interactions: [activation("/", "routes/index.tsx", "Save")],
    });
  });

  it("extracts an inline arrow handler", () => {
    expectProduct(fixture("button-inline-arrow"), {
      schemaVersion: "2",
      screens: screens({ route: "/", file: "routes/index.tsx" }),
      ...emptyNavigation,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      ...emptyDesignSystem,
      ...emptyEntities,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      interactions: [activation("/", "routes/index.tsx", "Add investor")],
    });
  });

  it("omits a button without onClick", () => {
    expectProduct(fixture("button-no-handler"), {
      schemaVersion: "2",
      screens: screens({ route: "/", file: "routes/index.tsx" }),
      ...emptyNavigation,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      ...emptyDesignSystem,
      ...emptyEntities,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      interactions: [],
    });
  });

  it("extracts multiple actions on one screen", () => {
    expectProduct(fixture("multiple-on-screen"), {
      schemaVersion: "2",
      screens: screens({ route: "/", file: "routes/index.tsx" }),
      ...emptyNavigation,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      ...emptyDesignSystem,
      ...emptyEntities,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      interactions: [
        activation("/", "routes/index.tsx", "First"),
        activation("/", "routes/index.tsx", "Second"),
      ],
    });
  });

  it("attributes actions to the correct routes across files", () => {
    expectProduct(fixture("two-screens"), {
      schemaVersion: "2",
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
      interactions: [
        activation("/", "routes/index.tsx", "Home"),
        activation("/projects", "routes/projects.tsx", "Projects"),
      ],
    });
  });

  it("labels submit from a static submit button inside the form", () => {
    expect(
      stripInteractionIdsFromProduct(compile(fixture("form-submit-label"))),
    ).toMatchObject({
      interactions: [submit("/", "routes/index.tsx", "Send message")],
    });
  });

  it("uses title when aria-label and static children are absent", () => {
    expect(
      stripInteractionIdsFromProduct(compile(fixture("button-title"))),
    ).toMatchObject({
      interactions: [
        activation("/", "routes/index.tsx", "Save draft", [], {
          labelFrom: "title",
        }),
      ],
    });
  });

  it("omits provably disabled invoke controls", () => {
    expect(
      stripInteractionIdsFromProduct(compile(fixture("button-disabled"))),
    ).toMatchObject({
      interactions: [],
    });
  });

  it("extracts form onSubmit as submit", () => {
    expectProduct(fixture("form-submit"), {
      schemaVersion: "2",
      screens: screens({ route: "/", file: "routes/index.tsx" }),
      ...emptyNavigation,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      ...emptyDesignSystem,
      ...emptyEntities,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      interactions: [submit("/", "routes/index.tsx")],
    });
  });

  it("keeps independent type=button invokes inside an onSubmit form", () => {
    expectProduct(fixture("form-mixed-actions"), {
      schemaVersion: "2",
      screens: screens({ route: "/", file: "routes/index.tsx" }),
      ...emptyNavigation,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      ...emptyDesignSystem,
      ...emptyEntities,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      interactions: [
        activation("/", "routes/index.tsx", "Add item"),
        activation("/", "routes/index.tsx", "Remove row"),
        submit("/", "routes/index.tsx", "Create"),
      ],
    });
  });

  it("emits invoke for submit control with its own onClick", () => {
    expectProduct(fixture("form-submit-with-onclick"), {
      schemaVersion: "2",
      screens: screens({ route: "/", file: "routes/index.tsx" }),
      ...emptyNavigation,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      ...emptyDesignSystem,
      ...emptyEntities,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      interactions: [
        activation("/", "routes/index.tsx", "Save"),
        submit("/", "routes/index.tsx", "Save"),
      ],
    });
  });

  it("extracts invoke when a form has no onSubmit but a button has onClick", () => {
    expectProduct(fixture("form-button-onclick-only"), {
      schemaVersion: "2",
      screens: screens({ route: "/", file: "routes/index.tsx" }),
      ...emptyNavigation,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      ...emptyDesignSystem,
      ...emptyEntities,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      interactions: [activation("/", "routes/index.tsx", "Cancel")],
    });
  });

  it("uses aria-label when static children are not usable", () => {
    expectProduct(fixture("button-aria-label"), {
      schemaVersion: "2",
      screens: screens({ route: "/", file: "routes/index.tsx" }),
      ...emptyNavigation,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      ...emptyDesignSystem,
      ...emptyEntities,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      interactions: [
        activation("/", "routes/index.tsx", "Save", [], {
          labelFrom: "aria-label",
        }),
      ],
    });
  });

  it("omits label for expression-based children", () => {
    expectProduct(fixture("button-dynamic-label"), {
      schemaVersion: "2",
      screens: screens({ route: "/", file: "routes/index.tsx" }),
      ...emptyNavigation,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      ...emptyDesignSystem,
      ...emptyEntities,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      interactions: [activation("/", "routes/index.tsx")],
    });
  });

  it("collects nested static text for the label", () => {
    expectProduct(fixture("button-nested-static"), {
      schemaVersion: "2",
      screens: screens({ route: "/", file: "routes/index.tsx" }),
      ...emptyNavigation,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      ...emptyDesignSystem,
      ...emptyEntities,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      interactions: [activation("/", "routes/index.tsx", "Save")],
    });
  });

  it("recognizes ui/button imports", () => {
    expectProduct(fixture("ui-button-import"), {
      schemaVersion: "2",
      screens: screens({ route: "/", file: "routes/index.tsx" }),
      ...emptyNavigation,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      ...emptyDesignSystem,
      ...emptyEntities,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      interactions: [
        activation("/", "routes/index.tsx", "Save", [], { tag: "Button" }),
      ],
    });
  });

  it("ignores a local component named Button", () => {
    expectProduct(fixture("ui-button-false-positive"), {
      schemaVersion: "2",
      screens: screens({ route: "/", file: "routes/index.tsx" }),
      ...emptyNavigation,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      ...emptyDesignSystem,
      ...emptyEntities,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      interactions: [],
    });
  });

  it("attributes actions in directly rendered shared components", () => {
    expectProduct(fixture("shared-component"), {
      schemaVersion: "2",
      screens: screens({ route: "/", file: "routes/index.tsx" }),
      ...emptyNavigation,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      ...emptyDesignSystem,
      ...emptyEntities,
      interactions: [activation("/", "routes/index.tsx", "Delete")],
    });
  });

  it("drops actions when a file declares more than one screen", () => {
    expectProduct(fixture("ambiguous-file"), {
      schemaVersion: "2",
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
      interactions: [],
    });
  });

  it("does not deduplicate identical-looking actions", () => {
    expectProduct(fixture("duplicate-buttons"), {
      schemaVersion: "2",
      screens: screens({ route: "/", file: "routes/index.tsx" }),
      ...emptyNavigation,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      ...emptyDesignSystem,
      ...emptyEntities,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      interactions: [
        activation("/", "routes/index.tsx", "Save"),
        activation("/", "routes/index.tsx", "Save"),
      ],
    });
  });

  it("sorts interactions deterministically by route, trigger, then id", () => {
    expectProduct(fixture("ordering"), {
      schemaVersion: "2",
      screens: screens({ route: "/", file: "routes/index.tsx" }),
      ...emptyNavigation,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      ...emptyDesignSystem,
      ...emptyEntities,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      interactions: [
        activation("/", "routes/index.tsx", "Zebra"),
        activation("/", "routes/index.tsx", "Alpha"),
        submit("/", "routes/index.tsx", "Go"),
      ],
    });
  });

  it("treats navigate onClick as invoke without navigation", () => {
    expectProduct(fixture("navigate-onclick"), {
      schemaVersion: "2",
      screens: screens({ route: "/", file: "routes/index.tsx" }),
      ...emptyNavigation,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      ...emptyDesignSystem,
      ...emptyEntities,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      interactions: [
        activation("/", "routes/index.tsx", "Settings", [], { tag: "Button" }),
      ],
    });
  });

  it("does not recognize conditional handlers", () => {
    expectProduct(fixture("button-conditional-handler"), {
      schemaVersion: "2",
      screens: screens({ route: "/", file: "routes/index.tsx" }),
      ...emptyNavigation,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      ...emptyDesignSystem,
      ...emptyEntities,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      interactions: [],
    });
  });

  it("does not recognize logical handlers", () => {
    expectProduct(fixture("button-logical-handler"), {
      schemaVersion: "2",
      screens: screens({ route: "/", file: "routes/index.tsx" }),
      ...emptyNavigation,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      ...emptyDesignSystem,
      ...emptyEntities,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      interactions: [],
    });
  });

  it("omits the label when nested children mix expressions and static text", () => {
    expectProduct(fixture("button-label-mixed-dynamic"), {
      schemaVersion: "2",
      screens: screens({ route: "/", file: "routes/index.tsx" }),
      ...emptyNavigation,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      ...emptyDesignSystem,
      ...emptyEntities,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      interactions: [activation("/", "routes/index.tsx")],
    });
  });

  it("omits the label when an expression is mixed with static suffix text", () => {
    expectProduct(fixture("button-label-expression-suffix"), {
      schemaVersion: "2",
      screens: screens({ route: "/", file: "routes/index.tsx" }),
      ...emptyNavigation,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      ...emptyDesignSystem,
      ...emptyEntities,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      interactions: [activation("/", "routes/index.tsx")],
    });
  });

  it("recovers static text nested inside a component wrapper", () => {
    expectProduct(fixture("button-label-component-static"), {
      schemaVersion: "2",
      screens: screens({ route: "/", file: "routes/index.tsx" }),
      ...emptyNavigation,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      ...emptyDesignSystem,
      ...emptyEntities,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      interactions: [activation("/", "routes/index.tsx", "Save")],
    });
  });

  it("prefers a static aria-label over expression-based children", () => {
    expectProduct(fixture("button-label-aria-over-dynamic"), {
      schemaVersion: "2",
      screens: screens({ route: "/", file: "routes/index.tsx" }),
      ...emptyNavigation,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      ...emptyDesignSystem,
      ...emptyEntities,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      interactions: [
        activation("/", "routes/index.tsx", "Save", [], {
          labelFrom: "aria-label",
        }),
      ],
    });
  });
});

function expectInteractionsOnly(
  projectPath: string,
  expected: ReturnType<typeof activation>[],
): void {
  expect(
    stripInteractionIdsFromProduct(compile(projectPath)).interactions,
  ).toEqual(expected);
}

describe("compile actions attribution v2", () => {
  it("attributes invoke actions from a named imported component", () => {
    expect(compile(fixture("component-named")).schemaVersion).toBe("2");
    expectInteractionsOnly(fixture("component-named"), [
      activation("/items", "routes/index.tsx", "Save item"),
    ]);
  });

  it("attributes invoke actions from a default imported component", () => {
    expectInteractionsOnly(fixture("component-default"), [
      activation("/", "routes/index.tsx", "Default card"),
    ]);
  });

  it("attributes actions when the import is aliased", () => {
    expectInteractionsOnly(fixture("component-alias"), [
      activation("/", "routes/index.tsx", "Aliased"),
    ]);
  });

  it("attributes submit actions inside an imported component", () => {
    expectInteractionsOnly(fixture("component-submit"), [
      submit("/", "routes/index.tsx"),
    ]);
  });

  it("preserves supported effects on attributed actions", () => {
    expectInteractionsOnly(fixture("component-state-effect"), [
      activation("/", "routes/index.tsx", "Bump", [
        { kind: "state", target: "count", value: 1 },
      ]),
    ]);
  });

  it("analyzes only the exported component referenced by the route", () => {
    expectInteractionsOnly(fixture("component-multi-export"), [
      activation("/", "routes/index.tsx", "A only"),
    ]);
  });

  it("attributes the same component action to each screen that renders it", () => {
    expectInteractionsOnly(fixture("component-two-screens"), [
      activation("/alpha", "routes/index.tsx", "Shared"),
      activation("/beta", "routes/beta.tsx", "Shared"),
    ]);
  });

  it("omits actions when the component import cannot be resolved", () => {
    expectInteractionsOnly(fixture("component-unresolved"), []);
  });

  it("omits actions when the import resolves through a barrel module", () => {
    expectInteractionsOnly(fixture("component-barrel"), []);
  });

  it("omits type-only imports for component attribution", () => {
    expectInteractionsOnly(fixture("component-type-only"), [
      activation("/", "routes/index.tsx", "Real"),
    ]);
  });

  it("omits component attribution when the route module has multiple screens", () => {
    expectInteractionsOnly(fixture("component-ambiguous"), []);
  });

  it("does not attribute actions from nested imported child components", () => {
    expectInteractionsOnly(fixture("component-no-recursive"), []);
  });

  it("omits actions defined in a sibling local component outside the export body", () => {
    expectInteractionsOnly(fixture("component-nested-local"), []);
  });

  it("omits unsupported conditional handlers inside attributed components", () => {
    expectInteractionsOnly(fixture("component-conditional-handler"), []);
  });

  it("supports conditional JSX when the component tag is static", () => {
    expectInteractionsOnly(fixture("component-conditional-jsx"), [
      activation("/", "routes/index.tsx", "Conditional"),
    ]);
  });

  it("keeps distinct interactions for the same label on separate component instances", () => {
    expectInteractionsOnly(fixture("component-dedupe-alias"), [
      activation("/", "routes/index.tsx", "Once"),
      activation("/", "routes/index.tsx", "Once"),
    ]);
  });

  it("leaves same-file action extraction unchanged", () => {
    expectInteractionsOnly(fixture("button-static-label"), [
      activation("/", "routes/index.tsx", "Save"),
    ]);
  });

  it("does not change navigation when adding component action attribution", () => {
    expect(
      stripInteractionIdsFromProduct(
        compile(fixture("component-nav-unchanged")),
      ),
    ).toMatchObject({
      schemaVersion: "2",
      navigation: [{ from: "/", to: "/target" }],
      interactions: [activation("/", "routes/index.tsx", "Stay")],
    });
  });

  it("does not attribute actions from global application chrome to screens", () => {
    expect(
      stripInteractionIdsFromProduct(compile(fixture("global-chrome-button"))),
    ).toMatchObject({
      schemaVersion: "2",
      interactions: [],
      globalNavigation: [
        { to: "/", source: { file: "components/Chrome.tsx" } },
      ],
    });
  });
});
