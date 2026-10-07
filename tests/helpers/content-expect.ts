import {
  type ContentIdentityMaterial,
  contentIdFromMaterial,
} from "../../src/frameworks/react/content-id.js";
import { headingLevelFromTag } from "../../src/frameworks/react/static-text.js";
import type { Content } from "../../src/ir/product-ir.js";

export function textContent(params: {
  route: string;
  attributionFile: string;
  definitionFile?: string;
  usageLocal?: string;
  structPath: string;
  line: number;
  element: string;
  text: string;
}): Content {
  const definitionFile = params.definitionFile ?? params.attributionFile;
  const usageLocal = params.usageLocal ?? "";
  const material: ContentIdentityMaterial = {
    route: params.route,
    attributionFile: params.attributionFile,
    definitionFile,
    usageLocal,
    kind: "text",
    element: params.element,
    structPath: params.structPath,
  };
  const structure: Content["structure"] = { element: params.element };
  const headingLevel = headingLevelFromTag(params.element);
  if (headingLevel !== undefined) {
    structure.headingLevel = headingLevel;
  }
  return {
    id: contentIdFromMaterial(material),
    route: params.route,
    source: { file: params.attributionFile, line: params.line },
    definition: { file: definitionFile },
    kind: "text",
    value: { text: params.text },
    structure,
  };
}
