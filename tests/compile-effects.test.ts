import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { compile } from "../src/index.js";

function fixture(name: string): string {
  return fileURLToPath(
    new URL(`./fixtures/tanstack-effects/${name}`, import.meta.url),
  );
}

const emptyNavigation = { navigation: [] as const };
const emptyGlobalNavigation = { globalNavigation: [] as const };
const emptyLinks = { links: [] as const, globalLinks: [] as const };
const emptyDesignSystem = { designSystem: { themes: [] as const } };

function invoke(
  label: string,
  effects: ReadonlyArray<{
    kind: "state" | "search";
    target?: string;
    value?: string | number | boolean | null;
  }>,
) {
  return {
    route: "/",
    kind: "invoke" as const,
    label,
    source: { file: "routes/index.tsx" },
    effects,
  };
}

describe("compile effects", () => {
  it("extracts a literal boolean state write", () => {
    expect(compile(fixture("state-boolean"))).toMatchObject({
      schemaVersion: "1",
      actions: [
        invoke("Open", [{ kind: "state", target: "open", value: true }]),
      ],
    });
  });

  it("extracts literal string, number, and null state values", () => {
    expect(compile(fixture("state-literals")).actions).toEqual([
      invoke("Count", [{ kind: "state", target: "count", value: 2 }]),
      invoke("Name", [{ kind: "state", target: "name", value: "Ada" }]),
      invoke("Note", [{ kind: "state", target: "note", value: null }]),
    ]);
  });

  it("omits the value when the setter argument is an updater", () => {
    expect(compile(fixture("state-updater")).actions).toEqual([
      invoke("Increment", [{ kind: "state", target: "count" }]),
    ]);
  });

  it("follows one same-file arrow handler", () => {
    expect(compile(fixture("named-handler")).actions).toEqual([
      invoke("Clear", [{ kind: "state", target: "open", value: false }]),
    ]);
  });

  it("follows one same-file function declaration", () => {
    expect(compile(fixture("named-function")).actions).toEqual([
      invoke("Clear", [{ kind: "state", target: "open", value: false }]),
    ]);
  });

  it("follows one same-file handler into a search call", () => {
    expect(compile(fixture("named-search")).actions).toEqual([
      invoke("Clear", [{ kind: "search" }]),
    ]);
  });

  it("recognizes a useNavigate binding that stays on the current destination", () => {
    expect(compile(fixture("search-use-navigate")).actions).toEqual([
      invoke("Cards", [{ kind: "search" }]),
    ]);
  });

  it("recognizes Route.useNavigate when Route is the createFileRoute binding", () => {
    expect(compile(fixture("search-route-navigate")).actions).toEqual([
      invoke("Search", [{ kind: "search" }]),
    ]);
  });

  it("does not treat an arbitrary useNavigate method as navigation", () => {
    expect(compile(fixture("search-arbitrary-object")).actions).toEqual([
      invoke("Search", []),
    ]);
  });

  it("does not emit search when to names another destination", () => {
    expect(compile(fixture("search-other-destination")).actions).toEqual([
      invoke("Leave", []),
    ]);
  });

  it("does not emit search when to is dynamic", () => {
    expect(compile(fixture("search-dynamic-to")).actions).toEqual([
      invoke("Search", []),
    ]);
  });

  it("does not emit a state effect inside if", () => {
    expect(compile(fixture("state-if")).actions).toEqual([invoke("Open", [])]);
  });

  it("does not emit state effects nested in other control flow", () => {
    expect(compile(fixture("state-control-flow")).actions).toEqual([
      invoke("And", []),
      invoke("For", []),
      invoke("Or", []),
      invoke("Switch", []),
      invoke("Ternary", []),
      invoke("Try", []),
      invoke("While", []),
    ]);
  });

  it("does not follow an imported handler", () => {
    expect(compile(fixture("imported-handler")).actions).toEqual([
      invoke("Save", []),
    ]);
  });

  it("does not follow a prop callback", () => {
    expect(compile(fixture("prop-callback")).actions).toEqual([
      invoke("Close", []),
    ]);
  });

  it("does not follow a destructured hook method", () => {
    expect(compile(fixture("hook-method")).actions).toEqual([
      invoke("Save", []),
    ]);
  });

  it("keeps two direct effects in source order", () => {
    expect(compile(fixture("two-effects")).actions).toEqual([
      invoke("Apply", [
        { kind: "state", target: "open", value: true },
        { kind: "search" },
      ]),
    ]);
  });

  it("keeps duplicate direct effects", () => {
    expect(compile(fixture("duplicate-effects")).actions).toEqual([
      invoke("Open", [
        { kind: "state", target: "open", value: true },
        { kind: "state", target: "open", value: true },
      ]),
    ]);
  });

  it("does not treat preventDefault as an effect", () => {
    expect(compile(fixture("submit-prevent-default"))).toMatchObject({
      actions: [
        {
          route: "/",
          kind: "submit",
          source: { file: "routes/index.tsx" },
          effects: [],
        },
      ],
      ...emptyNavigation,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      ...emptyDesignSystem,
    });
  });

  it("extracts an unconditional state write from a submit handler", () => {
    expect(compile(fixture("submit-state")).actions).toEqual([
      {
        route: "/",
        kind: "submit",
        source: { file: "routes/index.tsx" },
        effects: [{ kind: "state", target: "name", value: "" }],
      },
    ]);
  });

  it("omits a conditional state write in a submit handler", () => {
    expect(compile(fixture("submit-conditional")).actions).toEqual([
      {
        route: "/",
        kind: "submit",
        source: { file: "routes/index.tsx" },
        effects: [],
      },
    ]);
  });

  it("does not follow a call made by the resolved function", () => {
    expect(compile(fixture("no-recursive-follow")).actions).toEqual([
      invoke("Clear", []),
    ]);
  });
});
