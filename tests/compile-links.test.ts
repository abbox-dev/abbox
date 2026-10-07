import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { compile } from "../src/index.js";
import {
  emptyDesignSystem,
  emptyEntities,
  emptyGlobalNavigation,
  emptyInteractions,
  emptyNavigation,
} from "./helpers/empty-ir-fields.js";
import { stripInteractionIdsFromProduct } from "./helpers/interaction-expect.js";

function fixture(name: string): string {
  return fileURLToPath(
    new URL(`./fixtures/tanstack-product-links/${name}`, import.meta.url),
  );
}

describe("product links", () => {
  it("extracts same-file anchor links on a screen route", () => {
    expect(
      stripInteractionIdsFromProduct(compile(fixture("anchor-same-file"))),
    ).toEqual({
      schemaVersion: "2",
      screens: [{ route: "/", source: { file: "routes/index.tsx" } }],
      ...emptyNavigation,
      ...emptyGlobalNavigation,
      links: [
        {
          route: "/",
          kind: "anchor",
          hash: "intro",
          label: "Jump to intro",
          source: { file: "routes/index.tsx" },
        },
      ],
      globalLinks: [],
      ...emptyDesignSystem,
      ...emptyInteractions,
      ...emptyEntities,
    });
    expect(compile(fixture("anchor-same-file")).content).toEqual([
      {
        id: "cnt_6128471a38591fa6",
        route: "/",
        source: { file: "routes/index.tsx", line: 9 },
        definition: { file: "routes/index.tsx" },
        kind: "text",
        value: { text: "Jump to intro" },
        structure: { element: "div" },
      },
      {
        id: "cnt_7dc3f65dfb5dcfd3",
        route: "/",
        source: { file: "routes/index.tsx", line: 10 },
        definition: { file: "routes/index.tsx" },
        kind: "text",
        value: { text: "Jump to intro" },
        structure: { element: "a" },
      },
    ]);
  });

  it("extracts external https links on a screen route", () => {
    expect(
      stripInteractionIdsFromProduct(compile(fixture("external-same-file"))),
    ).toMatchObject({
      links: [
        {
          route: "/",
          kind: "external",
          url: "https://example.com/docs",
          label: "Docs",
          source: { file: "routes/index.tsx" },
        },
      ],
      globalLinks: [],
    });
  });

  it("extracts resource paths and download metadata", () => {
    expect(
      stripInteractionIdsFromProduct(compile(fixture("resource-download"))),
    ).toMatchObject({
      links: [
        {
          route: "/",
          kind: "resource",
          path: "/files/report.pdf",
          label: "Download report",
          download: true,
          source: { file: "routes/index.tsx" },
        },
      ],
    });
  });

  it("extracts protocol links such as mailto", () => {
    expect(
      stripInteractionIdsFromProduct(compile(fixture("protocol-mailto"))),
    ).toMatchObject({
      links: [
        {
          route: "/",
          kind: "protocol",
          url: "mailto:hello@example.com",
          label: "Email us",
          source: { file: "routes/index.tsx" },
        },
      ],
    });
  });

  it("lowers plain anchor screen hrefs into navigation, not links", () => {
    expect(
      stripInteractionIdsFromProduct(compile(fixture("anchor-navigation"))),
    ).toMatchObject({
      navigation: [{ from: "/", to: "/about" }],
      links: [],
      globalLinks: [],
    });
  });

  it("attributes protocol links through a one-hop imported component", () => {
    expect(
      stripInteractionIdsFromProduct(compile(fixture("component-attributed"))),
    ).toMatchObject({
      links: [
        {
          route: "/",
          kind: "protocol",
          url: "tel:+15551234567",
          label: "Call support",
          source: { file: "routes/index.tsx" },
        },
      ],
    });
  });
});

describe("global product links", () => {
  it("extracts non-screen anchor and external links from root chrome", () => {
    expect(
      stripInteractionIdsFromProduct(compile(fixture("global-chrome-links"))),
    ).toMatchObject({
      globalLinks: [
        {
          kind: "anchor",
          hash: "legal",
          label: "Legal",
          source: { file: "components/SiteFooter.tsx" },
        },
        {
          kind: "external",
          url: "https://example.com",
          source: { file: "components/SiteFooter.tsx" },
        },
      ],
      links: [],
    });
  });
});
