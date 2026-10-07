import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { compile } from "../src/index.js";

function fixture(name: string): string {
  return fileURLToPath(
    new URL(`./fixtures/entity-models/${name}`, import.meta.url),
  );
}

const emptyNavigation = { navigation: [] as const };
const emptyGlobalNavigation = { globalNavigation: [] as const };
const emptyLinks = { links: [] as const, globalLinks: [] as const };
const emptyDesignSystem = { designSystem: { themes: [] as const } };
const emptyActions = { actions: [] as const };

function entity(
  name: string,
  file: string,
  fields: { name: string; optional?: boolean }[],
) {
  return {
    name,
    fields: fields.map((field) => {
      const mapped: { name: string; optional?: boolean } = { name: field.name };
      if (field.optional === true) {
        mapped.optional = true;
      }
      return mapped;
    }),
    source: { file },
  };
}

describe("compile entities", () => {
  it("extracts an exported type alias and exported N[]", () => {
    expect(compile(fixture("type-and-array"))).toMatchObject({
      entities: [
        entity("Customer", "models.ts", [{ name: "id" }, { name: "name" }]),
      ],
    });
  });

  it("extracts an exported interface and exported Array<N>", () => {
    expect(compile(fixture("interface-array-generic"))).toMatchObject({
      entities: [
        entity("Order", "models.ts", [{ name: "id" }, { name: "total" }]),
      ],
    });
  });

  it("marks optional fields", () => {
    expect(compile(fixture("optional-field"))).toMatchObject({
      entities: [
        entity("Item", "models.ts", [
          { name: "id" },
          { name: "note", optional: true },
        ]),
      ],
    });
  });

  it("omits a type without a typed collection export", () => {
    expect(compile(fixture("type-only")).entities).toEqual([]);
  });

  it("omits a collection without a matching exported type", () => {
    expect(compile(fixture("array-only")).entities).toEqual([]);
  });

  it("omits a non-exported type even with a typed collection", () => {
    expect(compile(fixture("non-exported-type")).entities).toEqual([]);
  });

  it("omits a non-exported collection even with an exported type", () => {
    expect(compile(fixture("non-exported-collection")).entities).toEqual([]);
  });

  it("omits a type alias to another type reference", () => {
    expect(compile(fixture("alias-to-reference")).entities).toEqual([]);
  });

  it("omits an object type with no supported fields", () => {
    expect(compile(fixture("empty-object")).entities).toEqual([]);
  });

  it("extracts two entities from one file", () => {
    expect(compile(fixture("two-entities-one-file")).entities).toEqual([
      entity("Alpha", "models.ts", [{ name: "id" }]),
      entity("Beta", "models.ts", [{ name: "code" }]),
    ]);
  });

  it("omits a name evidenced in more than one file", () => {
    expect(compile(fixture("ambiguous-duplicate-name")).entities).toEqual([]);
  });

  it("sorts entities by name then source file", () => {
    expect(compile(fixture("deterministic-order")).entities).toEqual([
      entity("Alpha", "models.ts", [{ name: "id" }]),
      entity("Zebra", "models.ts", [{ name: "id" }]),
    ]);
  });

  it("sorts fields by name", () => {
    expect(compile(fixture("field-order")).entities).toEqual([
      entity("Ranked", "models.ts", [{ name: "alpha" }, { name: "zebra" }]),
    ]);
  });

  it("ignores unsupported members", () => {
    expect(compile(fixture("unsupported-members")).entities).toEqual([
      entity("Mixed", "models.ts", [{ name: "id" }]),
    ]);
  });

  it("rejects generic type declarations", () => {
    expect(compile(fixture("generic-type")).entities).toEqual([]);
  });

  it("returns an empty entities array when nothing qualifies", () => {
    expect(
      compile(
        fileURLToPath(
          new URL("./fixtures/tanstack-file-routes/root", import.meta.url),
        ),
      ),
    ).toEqual({
      schemaVersion: "1",
      screens: [{ route: "/", source: { file: "routes/index.tsx" } }],
      ...emptyNavigation,
      ...emptyGlobalNavigation,
      ...emptyLinks,
      ...emptyDesignSystem,
      ...emptyActions,
      entities: [],
    });
  });
});
