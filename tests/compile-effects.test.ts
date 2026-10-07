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
    new URL(`./fixtures/tanstack-effects/${name}`, import.meta.url),
  );
}

const emptyNavigation = { navigation: [] as const };
const emptyGlobalNavigation = { globalNavigation: [] as const };
const emptyLinks = { links: [] as const, globalLinks: [] as const };
const emptyDesignSystem = { designSystem: { themes: [] as const } };

function invoke(
  label: string,
  effects: ReturnType<typeof activation>["effects"],
) {
  return activation("/", "routes/index.tsx", label, [...effects]);
}

describe("compile effects", () => {
  it("extracts a literal boolean state write", () => {
    expect(
      stripInteractionIdsFromProduct(compile(fixture("state-boolean"))),
    ).toMatchObject({
      schemaVersion: "2",
      interactions: [
        invoke("Open", [{ kind: "state", target: "open", value: true }]),
      ],
    });
  });

  it("extracts literal string, number, and null state values", () => {
    expect(
      stripInteractionIdsFromProduct(compile(fixture("state-literals")))
        .interactions,
    ).toEqual([
      invoke("Name", [{ kind: "state", target: "name", value: "Ada" }]),
      invoke("Count", [{ kind: "state", target: "count", value: 2 }]),
      invoke("Note", [{ kind: "state", target: "note", value: null }]),
    ]);
  });

  it("omits the value when the setter argument is an updater", () => {
    expect(
      stripInteractionIdsFromProduct(compile(fixture("state-updater")))
        .interactions,
    ).toEqual([invoke("Increment", [{ kind: "state", target: "count" }])]);
  });

  it("follows one same-file arrow handler", () => {
    expect(
      stripInteractionIdsFromProduct(compile(fixture("named-handler")))
        .interactions,
    ).toEqual([
      invoke("Clear", [{ kind: "state", target: "open", value: false }]),
    ]);
  });

  it("follows one same-file function declaration", () => {
    expect(
      stripInteractionIdsFromProduct(compile(fixture("named-function")))
        .interactions,
    ).toEqual([
      invoke("Clear", [{ kind: "state", target: "open", value: false }]),
    ]);
  });

  it("follows one same-file handler into a search call", () => {
    expect(
      stripInteractionIdsFromProduct(compile(fixture("named-search")))
        .interactions,
    ).toEqual([invoke("Clear", [{ kind: "search" }])]);
  });

  it("recognizes a useNavigate binding that stays on the current destination", () => {
    expect(
      stripInteractionIdsFromProduct(compile(fixture("search-use-navigate")))
        .interactions,
    ).toEqual([invoke("Cards", [{ kind: "search" }])]);
  });

  it("recognizes Route.useNavigate when Route is the createFileRoute binding", () => {
    expect(
      stripInteractionIdsFromProduct(compile(fixture("search-route-navigate")))
        .interactions,
    ).toEqual([invoke("Search", [{ kind: "search" }])]);
  });

  it("does not treat an arbitrary useNavigate method as navigation", () => {
    expect(
      stripInteractionIdsFromProduct(
        compile(fixture("search-arbitrary-object")),
      ).interactions,
    ).toEqual([invoke("Search", [])]);
  });

  it("does not emit search when to names another destination", () => {
    expect(
      stripInteractionIdsFromProduct(
        compile(fixture("search-other-destination")),
      ).interactions,
    ).toEqual([invoke("Leave", [])]);
  });

  it("does not emit search when to is dynamic", () => {
    expect(
      stripInteractionIdsFromProduct(compile(fixture("search-dynamic-to")))
        .interactions,
    ).toEqual([invoke("Search", [])]);
  });

  it("does not emit a state effect inside if", () => {
    expect(
      stripInteractionIdsFromProduct(compile(fixture("state-if"))).interactions,
    ).toEqual([invoke("Open", [])]);
  });

  it("does not emit state effects nested in other control flow", () => {
    expect(
      stripInteractionIdsFromProduct(compile(fixture("state-control-flow")))
        .interactions,
    ).toEqual([
      invoke("And", []),
      invoke("Switch", []),
      invoke("Or", []),
      invoke("Try", []),
      invoke("Ternary", []),
      invoke("For", []),
      invoke("While", []),
    ]);
  });

  it("does not follow an imported handler", () => {
    expect(
      stripInteractionIdsFromProduct(compile(fixture("imported-handler")))
        .interactions,
    ).toEqual([invoke("Save", [])]);
  });

  it("does not follow a prop callback", () => {
    expect(
      stripInteractionIdsFromProduct(compile(fixture("prop-callback")))
        .interactions,
    ).toEqual([invoke("Close", [])]);
  });

  it("does not follow a destructured hook method", () => {
    expect(
      stripInteractionIdsFromProduct(compile(fixture("hook-method")))
        .interactions,
    ).toEqual([invoke("Save", [])]);
  });

  it("keeps two direct effects in source order", () => {
    expect(
      stripInteractionIdsFromProduct(compile(fixture("two-effects")))
        .interactions,
    ).toEqual([
      invoke("Apply", [
        { kind: "state", target: "open", value: true },
        { kind: "search" },
      ]),
    ]);
  });

  it("keeps duplicate direct effects", () => {
    expect(
      stripInteractionIdsFromProduct(compile(fixture("duplicate-effects")))
        .interactions,
    ).toEqual([
      invoke("Open", [
        { kind: "state", target: "open", value: true },
        { kind: "state", target: "open", value: true },
      ]),
    ]);
  });

  it("does not treat preventDefault as an effect", () => {
    expect(
      stripInteractionIdsFromProduct(
        compile(fixture("submit-prevent-default")),
      ),
    ).toMatchObject({
      interactions: [submit("/", "routes/index.tsx")],
      ...emptyNavigation,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      ...emptyDesignSystem,
    });
  });

  it("extracts an unconditional state write from a submit handler", () => {
    expect(
      stripInteractionIdsFromProduct(compile(fixture("submit-state")))
        .interactions,
    ).toEqual([
      submit("/", "routes/index.tsx", "Send", [
        { kind: "state", target: "name", value: "" },
      ]),
    ]);
  });

  it("omits a conditional state write in a submit handler", () => {
    expect(
      stripInteractionIdsFromProduct(compile(fixture("submit-conditional")))
        .interactions,
    ).toEqual([submit("/", "routes/index.tsx", "Send", [])]);
  });

  it("does not follow a call made by the resolved function", () => {
    expect(
      stripInteractionIdsFromProduct(compile(fixture("no-recursive-follow")))
        .interactions,
    ).toEqual([invoke("Clear", [])]);
  });

  it("extracts a navigation effect when useNavigate targets a discovered screen", () => {
    expect(
      stripInteractionIdsFromProduct(compile(fixture("navigation-effect")))
        .interactions,
    ).toEqual([invoke("Settings", [{ kind: "navigation", to: "/settings" }])]);
  });
});
