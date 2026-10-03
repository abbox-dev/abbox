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
  };
}

describe("compile actions", () => {
  it("extracts a native button with static text and identifier handler", () => {
    expect(compile(fixture("button-static-label"))).toEqual({
      schemaVersion: "1",
      screens: screens({ route: "/", file: "routes/index.tsx" }),
      ...emptyNavigation,
      ...emptyDesignSystem,
      actions: [invoke("/", "routes/index.tsx", "Save")],
    });
  });

  it("extracts an inline arrow handler", () => {
    expect(compile(fixture("button-inline-arrow"))).toEqual({
      schemaVersion: "1",
      screens: screens({ route: "/", file: "routes/index.tsx" }),
      ...emptyNavigation,
      ...emptyDesignSystem,
      actions: [invoke("/", "routes/index.tsx", "Add investor")],
    });
  });

  it("omits a button without onClick", () => {
    expect(compile(fixture("button-no-handler"))).toEqual({
      schemaVersion: "1",
      screens: screens({ route: "/", file: "routes/index.tsx" }),
      ...emptyNavigation,
      ...emptyDesignSystem,
      actions: [],
    });
  });

  it("extracts multiple actions on one screen", () => {
    expect(compile(fixture("multiple-on-screen"))).toEqual({
      schemaVersion: "1",
      screens: screens({ route: "/", file: "routes/index.tsx" }),
      ...emptyNavigation,
      ...emptyDesignSystem,
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
      ...emptyDesignSystem,
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
      ...emptyDesignSystem,
      actions: [submit("/", "routes/index.tsx")],
    });
  });

  it("keeps independent type=button invokes inside an onSubmit form", () => {
    expect(compile(fixture("form-mixed-actions"))).toEqual({
      schemaVersion: "1",
      screens: screens({ route: "/", file: "routes/index.tsx" }),
      ...emptyNavigation,
      ...emptyDesignSystem,
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
      ...emptyDesignSystem,
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
      ...emptyDesignSystem,
      actions: [invoke("/", "routes/index.tsx", "Cancel")],
    });
  });

  it("uses aria-label when static children are not usable", () => {
    expect(compile(fixture("button-aria-label"))).toEqual({
      schemaVersion: "1",
      screens: screens({ route: "/", file: "routes/index.tsx" }),
      ...emptyNavigation,
      ...emptyDesignSystem,
      actions: [invoke("/", "routes/index.tsx", "Save")],
    });
  });

  it("omits label for expression-based children", () => {
    expect(compile(fixture("button-dynamic-label"))).toEqual({
      schemaVersion: "1",
      screens: screens({ route: "/", file: "routes/index.tsx" }),
      ...emptyNavigation,
      ...emptyDesignSystem,
      actions: [invoke("/", "routes/index.tsx")],
    });
  });

  it("collects nested static text for the label", () => {
    expect(compile(fixture("button-nested-static"))).toEqual({
      schemaVersion: "1",
      screens: screens({ route: "/", file: "routes/index.tsx" }),
      ...emptyNavigation,
      ...emptyDesignSystem,
      actions: [invoke("/", "routes/index.tsx", "Save")],
    });
  });

  it("recognizes ui/button imports", () => {
    expect(compile(fixture("ui-button-import"))).toEqual({
      schemaVersion: "1",
      screens: screens({ route: "/", file: "routes/index.tsx" }),
      ...emptyNavigation,
      ...emptyDesignSystem,
      actions: [invoke("/", "routes/index.tsx", "Save")],
    });
  });

  it("ignores a local component named Button", () => {
    expect(compile(fixture("ui-button-false-positive"))).toEqual({
      schemaVersion: "1",
      screens: screens({ route: "/", file: "routes/index.tsx" }),
      ...emptyNavigation,
      ...emptyDesignSystem,
      actions: [],
    });
  });

  it("does not attribute actions in shared components", () => {
    expect(compile(fixture("shared-component"))).toEqual({
      schemaVersion: "1",
      screens: screens({ route: "/", file: "routes/index.tsx" }),
      ...emptyNavigation,
      ...emptyDesignSystem,
      actions: [],
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
      ...emptyDesignSystem,
      actions: [],
    });
  });

  it("does not deduplicate identical-looking actions", () => {
    expect(compile(fixture("duplicate-buttons"))).toEqual({
      schemaVersion: "1",
      screens: screens({ route: "/", file: "routes/index.tsx" }),
      ...emptyNavigation,
      ...emptyDesignSystem,
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
      ...emptyDesignSystem,
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
      ...emptyDesignSystem,
      actions: [invoke("/", "routes/index.tsx", "Settings")],
    });
  });

  it("does not recognize conditional handlers", () => {
    expect(compile(fixture("button-conditional-handler"))).toEqual({
      schemaVersion: "1",
      screens: screens({ route: "/", file: "routes/index.tsx" }),
      ...emptyNavigation,
      ...emptyDesignSystem,
      actions: [],
    });
  });

  it("does not recognize logical handlers", () => {
    expect(compile(fixture("button-logical-handler"))).toEqual({
      schemaVersion: "1",
      screens: screens({ route: "/", file: "routes/index.tsx" }),
      ...emptyNavigation,
      ...emptyDesignSystem,
      actions: [],
    });
  });

  it("omits the label when nested children mix expressions and static text", () => {
    expect(compile(fixture("button-label-mixed-dynamic"))).toEqual({
      schemaVersion: "1",
      screens: screens({ route: "/", file: "routes/index.tsx" }),
      ...emptyNavigation,
      ...emptyDesignSystem,
      actions: [invoke("/", "routes/index.tsx")],
    });
  });

  it("omits the label when an expression is mixed with static suffix text", () => {
    expect(compile(fixture("button-label-expression-suffix"))).toEqual({
      schemaVersion: "1",
      screens: screens({ route: "/", file: "routes/index.tsx" }),
      ...emptyNavigation,
      ...emptyDesignSystem,
      actions: [invoke("/", "routes/index.tsx")],
    });
  });

  it("recovers static text nested inside a component wrapper", () => {
    expect(compile(fixture("button-label-component-static"))).toEqual({
      schemaVersion: "1",
      screens: screens({ route: "/", file: "routes/index.tsx" }),
      ...emptyNavigation,
      ...emptyDesignSystem,
      actions: [invoke("/", "routes/index.tsx", "Save")],
    });
  });

  it("prefers a static aria-label over expression-based children", () => {
    expect(compile(fixture("button-label-aria-over-dynamic"))).toEqual({
      schemaVersion: "1",
      screens: screens({ route: "/", file: "routes/index.tsx" }),
      ...emptyNavigation,
      ...emptyDesignSystem,
      actions: [invoke("/", "routes/index.tsx", "Save")],
    });
  });
});
