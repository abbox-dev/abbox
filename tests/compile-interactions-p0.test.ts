import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { interactionIdFromMaterial } from "../src/frameworks/react/interaction-id.js";
import { compile, productIrSchemaVersion } from "../src/index.js";

function fixture(name: string): string {
  return fileURLToPath(
    new URL(`./fixtures/tanstack-actions/${name}`, import.meta.url),
  );
}

describe("interaction IR P0", () => {
  it("emits schemaVersion 2 without actions", () => {
    const product = compile(fixture("button-static-label"));
    expect(productIrSchemaVersion).toBe("2");
    expect(product.schemaVersion).toBe("2");
    expect(product).not.toHaveProperty("actions");
    expect(Array.isArray(product.interactions)).toBe(true);
  });

  it("assigns deterministic interaction ids", () => {
    const first = compile(fixture("duplicate-buttons"));
    const second = compile(fixture("duplicate-buttons"));
    expect(first.interactions.map((item) => item.id)).toEqual(
      second.interactions.map((item) => item.id),
    );
    expect(first.interactions).toHaveLength(2);
    expect(first.interactions[0]?.id).toMatch(/^int_[0-9a-f]{16}$/);
    expect(first.interactions[0]?.id).not.toBe(first.interactions[1]?.id);
  });

  it("keeps ids stable when unrelated lines move", () => {
    const project = fixture("duplicate-buttons");
    const routePath = fileURLToPath(
      new URL(
        "./fixtures/tanstack-actions/duplicate-buttons/routes/index.tsx",
        import.meta.url,
      ),
    );
    const before = compile(project);
    const original = readFileSync(routePath, "utf8");
    const shifted = `// moved comment\n${original}`;
    writeFileSync(routePath, shifted);
    try {
      const after = compile(project);
      expect(after.interactions.map((item) => item.id)).toEqual(
        before.interactions.map((item) => item.id),
      );
    } finally {
      writeFileSync(routePath, original);
    }
  });

  it("exposes deterministic source.line", () => {
    const product = compile(fixture("button-static-label"));
    expect(product.interactions[0]?.source.line).toBeGreaterThan(0);
    expect(
      compile(fixture("button-static-label")).interactions[0]?.source.line,
    ).toBe(product.interactions[0]?.source.line);
  });

  it("maps invoke to activation and submit to submit triggers", () => {
    const product = compile(fixture("form-mixed-actions"));
    const triggers = product.interactions.map((item) => item.trigger.kind);
    expect(triggers).toContain("activation");
    expect(triggers).toContain("submit");
    expect(triggers).not.toContain("invoke");
  });

  it("documents the interaction id material", () => {
    const id = interactionIdFromMaterial({
      route: "/",
      attributionFile: "routes/index.tsx",
      definitionFile: "routes/index.tsx",
      triggerKind: "activation",
      event: "click",
      tag: "button",
      handlerRef: "save",
      jsxOrdinal: 0,
      usageLocal: "",
    });
    expect(id).toBe("int_9da7b05701c7ce23");
  });
});
