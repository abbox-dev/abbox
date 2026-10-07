import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { compile } from "../src/index.js";
import type { Content, ProductIr } from "../src/ir/product-ir.js";

function fixture(name: string): string {
  return fileURLToPath(
    new URL(`./fixtures/tanstack-content/${name}`, import.meta.url),
  );
}

function contentTexts(ir: ProductIr): string[] {
  return ir.content.flatMap((entry) => {
    if ("text" in entry.value) {
      return [entry.value.text];
    }
    return entry.value.alternatives;
  });
}

function byElement(ir: ProductIr, element: string): Content[] {
  return ir.content.filter((entry) => entry.structure.element === element);
}

function textValue(entry: Content): string | undefined {
  return "text" in entry.value ? entry.value.text : undefined;
}

describe("compile content", () => {
  const basics = (): ProductIr => compile(fixture("basics"));

  it("extracts h1 static text", () => {
    const h1 = byElement(basics(), "h1").find((e) => e.kind === "text");
    expect(h1?.value).toEqual({ text: "Hello World" });
    expect(h1?.structure.headingLevel).toBe(1);
  });

  it("extracts paragraph static text", () => {
    expect(contentTexts(basics())).toContain("Paragraph copy");
  });

  it("extracts span and div text", () => {
    expect(contentTexts(basics())).toContain("Span text");
    expect(contentTexts(basics())).toContain("Div text");
  });

  it("extracts JSX string expression children", () => {
    expect(contentTexts(basics())).toContain("Hello World");
    const mixed = basics().content.find(
      (e) => textValue(e) === "Hello World" && e.structure.element === "p",
    );
    expect(mixed).toBeDefined();
  });

  it("extracts static template literal", () => {
    expect(contentTexts(basics())).toContain("Static template");
  });

  it("extracts same-file const-bound text", () => {
    expect(contentTexts(basics())).toContain("Const title");
  });

  it("extracts mixed nested static text", () => {
    expect(contentTexts(basics())).toContain("Mixed nested static");
  });

  it("includes button text as content", () => {
    expect(
      byElement(basics(), "button").some((e) => textValue(e) === "Save"),
    ).toBe(true);
  });

  it("includes link text as content", () => {
    expect(
      byElement(basics(), "a").some((e) => textValue(e) === "Download CV"),
    ).toBe(true);
  });

  it("extracts deterministic alt text", () => {
    const alt = basics().content.find((e) => e.kind === "alt");
    expect(alt?.value).toEqual({ text: "Landing preview." });
    expect(alt?.structure.element).toBe("img");
  });

  it("extracts deterministic placeholder text", () => {
    const placeholder = basics().content.find((e) => e.kind === "placeholder");
    expect(placeholder?.value).toEqual({ text: "Search investors..." });
  });

  it("represents static ternary alternatives without picking a branch", () => {
    const ternary = basics().content.find(
      (e) => e.structure.element === "h2" && "alternatives" in e.value,
    );
    expect(ternary?.value).toEqual({ alternatives: ["Save", "Saved"] });
  });

  it("preserves content id when only text changes", () => {
    const a = compile(fixture("id-stability"));
    const b = compile(fixture("id-stability-text"));
    const h1a = byElement(a, "h1")[0];
    const h1b = byElement(b, "h1")[0];
    expect(h1a?.id).toBeDefined();
    expect(h1a?.id).toBe(h1b?.id);
    expect(h1a?.value).toEqual({ text: "Version A" });
    expect(h1b?.value).toEqual({ text: "Version B" });
  });

  it("preserves content id when unrelated lines are inserted above", () => {
    const a = compile(fixture("id-stability"));
    const b = compile(fixture("id-stability-line"));
    expect(byElement(a, "h1")[0]?.id).toBe(byElement(b, "h1")[0]?.id);
  });

  it("keeps repeated identical strings as distinct structural entries", () => {
    const repeats = basics().content.filter(
      (e) => textValue(e) === "Repeat" && e.structure.element === "p",
    );
    expect(repeats.length).toBe(2);
    expect(repeats[0]?.id).not.toBe(repeats[1]?.id);
  });

  it("compiles content deterministically across runs", () => {
    const first = compile(fixture("basics"));
    const second = compile(fixture("basics"));
    expect(first.content).toEqual(second.content);
  });

  it("attributes content to the screen route", () => {
    expect(basics().content.every((e) => e.route === "/")).toBe(true);
    expect(basics().content[0]?.source.file).toBe("routes/index.tsx");
  });

  it("attributes one-hop imported component content to the route", () => {
    const ir = compile(fixture("component-hop"));
    const heading = ir.content.find(
      (e) => textValue(e) === "Component heading",
    );
    expect(heading?.route).toBe("/");
    expect(heading?.source.file).toBe("routes/index.tsx");
    expect(heading?.definition.file).toBe("components/Hero.tsx");
    expect(heading?.id).toMatch(/^cnt_/);
  });

  it("omits dynamic runtime expression text", () => {
    expect(contentTexts(basics())).not.toContain("Ada");
    expect(basics().content.some((e) => textValue(e)?.includes("user"))).toBe(
      false,
    );
  });

  it("does not extract className attribute values as content", () => {
    expect(contentTexts(basics())).not.toContain("text-muted");
  });

  it("does not emit createFileRoute path strings as content", () => {
    expect(contentTexts(basics())).not.toContain("/");
  });

  it("includes source file and line on each entry", () => {
    for (const entry of basics().content) {
      expect(entry.source.file).toBe("routes/index.tsx");
      expect(entry.source.line).toBeGreaterThan(0);
    }
  });

  it("uses cnt_ ids derived from structural identity", () => {
    expect(basics().content.every((e) => /^cnt_[0-9a-f]{16}$/.test(e.id))).toBe(
      true,
    );
  });

  it("sorts by route then source line then id", () => {
    const sorted = [...basics().content];
    sorted.sort((left, right) => {
      const byRoute = left.route.localeCompare(right.route);
      if (byRoute !== 0) {
        return byRoute;
      }
      const byLine = left.source.line - right.source.line;
      if (byLine !== 0) {
        return byLine;
      }
      return left.id.localeCompare(right.id);
    });
    expect(basics().content).toEqual(sorted);
  });
});
