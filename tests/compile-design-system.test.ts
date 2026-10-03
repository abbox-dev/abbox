import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { compile } from "../src/index.js";

function fixture(name: string): string {
  return fileURLToPath(
    new URL(`./fixtures/design-system-colors/${name}`, import.meta.url),
  );
}

function designSystemOnly(path: string) {
  return compile(path).designSystem;
}

describe("compile design system", () => {
  it("emits an empty themes array when no CSS themes exist", () => {
    expect(
      compile(
        fileURLToPath(
          new URL("./fixtures/tanstack-file-routes/root", import.meta.url),
        ),
      ).designSystem,
    ).toEqual({ themes: [] });
  });

  it("maps :root to the default theme", () => {
    const { themes } = designSystemOnly(fixture("root-default"));
    expect(themes.map((theme) => theme.name)).toEqual(["default"]);
    expect(themes[0]?.colors).toEqual([
      {
        name: "background",
        value: "oklch(0.99 0 0)",
        hex: "#FCFCFC",
        source: { file: "styles.css" },
      },
    ]);
  });

  it("maps .dark to the dark theme after default", () => {
    const { themes } = designSystemOnly(fixture("default-dark"));
    expect(themes.map((theme) => theme.name)).toEqual(["default", "dark"]);
  });

  it("resolves different default and dark values for the same semantic token", () => {
    const { themes } = designSystemOnly(fixture("default-dark"));
    const defaultPrimary = themes[0]?.colors.find(
      (color) => color.name === "primary",
    );
    const darkPrimary = themes[1]?.colors.find(
      (color) => color.name === "primary",
    );
    expect(defaultPrimary?.value).toBe("oklch(0.46 0.13 296)");
    expect(darkPrimary?.value).toBe("oklch(0.65 0.15 296)");
    expect(defaultPrimary?.source).toEqual({ file: "styles.css" });
    expect(darkPrimary?.source).toEqual({ file: "styles.css" });
    expect(defaultPrimary?.hex).toMatch(/^#[0-9A-F]{6}$/);
    expect(darkPrimary?.hex).toMatch(/^#[0-9A-F]{6}$/);
    expect(defaultPrimary?.hex).not.toBe(darkPrimary?.hex);
  });

  it("resolves @theme semantic aliases through one physical var level", () => {
    const { themes } = designSystemOnly(fixture("default-dark"));
    const names = themes[0]?.colors.map((color) => color.name).sort();
    expect(names).toEqual(["background", "primary"]);
  });

  it("keeps unresolved aliases conservative in dark when physical var is missing", () => {
    const { themes } = designSystemOnly(fixture("alias-unresolved"));
    const darkPrimary = themes[1]?.colors.find(
      (color) => color.name === "primary",
    );
    expect(darkPrimary).toEqual({
      name: "primary",
      value: "var(--primary)",
      source: { file: "styles.css" },
    });
    expect(darkPrimary?.hex).toBeUndefined();
  });

  it("does not resolve aliases with a fallback", () => {
    const { themes } = designSystemOnly(fixture("alias-fallback"));
    expect(themes[0]?.colors).toEqual([
      {
        name: "primary",
        value: "var(--primary, #000000)",
        source: { file: "styles.css" },
      },
    ]);
  });

  it("does not resolve chained physical var aliases", () => {
    const { themes } = designSystemOnly(fixture("alias-chain"));
    expect(themes[0]?.colors).toEqual([
      {
        name: "primary",
        value: "var(--primary)",
        source: { file: "styles.css" },
      },
      {
        name: "secondary",
        value: "oklch(0.46 0.13 296)",
        hex: "#604597",
        source: { file: "styles.css" },
      },
    ]);
  });

  it("records source.file on every token", () => {
    const { themes } = designSystemOnly(fixture("default-dark"));
    for (const theme of themes) {
      for (const color of theme.colors) {
        expect(color.source.file).toBe("styles.css");
      }
    }
  });

  it("keeps conflicting same-theme declarations across files", () => {
    const { themes } = designSystemOnly(fixture("conflict"));
    expect(themes[0]?.colors).toEqual([
      {
        name: "accent",
        value: "#2864dc",
        hex: "#2864DC",
        source: { file: "styles/a.css" },
      },
      {
        name: "accent",
        value: "#2965dd",
        hex: "#2965DD",
        source: { file: "styles/b.css" },
      },
    ]);
  });

  it("deduplicates exact duplicate declarations", () => {
    const { themes } = designSystemOnly(fixture("exact-duplicate"));
    expect(themes[0]?.colors).toEqual([
      {
        name: "muted",
        value: "#2763db",
        hex: "#2763DB",
        source: { file: "styles.css" },
      },
    ]);
  });

  it("canonicalizes supported static color syntaxes", () => {
    const { themes } = designSystemOnly(fixture("hex-formats"));
    const byName = new Map(
      themes[0]?.colors.map((color) => [color.name, color]),
    );
    expect(byName.get("hex")).toMatchObject({
      value: "#336699",
      hex: "#336699",
    });
    expect(byName.get("rgb")?.hex).toMatch(/^#[0-9A-F]{6}$/);
    expect(byName.get("rgba")?.hex).toMatch(/^#[0-9A-F]{8}$/);
    expect(byName.get("named")).toMatchObject({
      value: "transparent",
      hex: "#00000000",
    });
  });

  it("keeps near-identical colors distinct", () => {
    const { themes } = designSystemOnly(fixture("near-duplicates"));
    expect(themes[0]?.colors).toHaveLength(3);
    const hexes = themes[0]?.colors.map((color) => color.hex);
    expect(new Set(hexes).size).toBe(3);
  });

  it("repeats static @theme colors for each runtime theme", () => {
    const { themes } = designSystemOnly(fixture("theme-static"));
    const defaultBrand = themes[0]?.colors.find(
      (color) => color.name === "brand",
    );
    const darkBrand = themes[1]?.colors.find((color) => color.name === "brand");
    expect(defaultBrand?.value).toBe("oklch(0.5 0.1 200)");
    expect(darkBrand?.value).toBe("oklch(0.5 0.1 200)");
    expect(defaultBrand?.source.file).toBe("styles.css");
    expect(darkBrand?.source.file).toBe("styles.css");
  });
});
