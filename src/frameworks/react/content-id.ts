import { createHash } from "node:crypto";

/**
 * Stable Content identity (schema v2).
 *
 * Pipe-separated material; paths are project-relative POSIX in output,
 * absolute normalized paths in pre-route dedupe. Excludes text, alternatives,
 * and source.line.
 *
 * `structPath` is comma-separated child indices from the attribution scope root
 * to the content-bearing JSX node (see content-candidates.ts).
 */
export interface ContentIdentityMaterial {
  route: string;
  attributionFile: string;
  definitionFile: string;
  usageLocal: string;
  kind: "text" | "alt" | "placeholder";
  element: string;
  structPath: string;
}

export function contentIdentityMaterialKey(
  material: ContentIdentityMaterial,
): string {
  return [
    "v2-content",
    material.route,
    material.attributionFile,
    material.definitionFile,
    material.usageLocal,
    material.kind,
    material.element,
    material.structPath,
  ].join("|");
}

export function contentIdFromMaterial(
  material: ContentIdentityMaterial,
): string {
  const digest = createHash("sha256")
    .update(contentIdentityMaterialKey(material), "utf8")
    .digest("hex");
  return `cnt_${digest.slice(0, 16)}`;
}

export function contentCandidateDedupeKey(candidate: {
  attributionFilePath: string;
  definitionFilePath: string;
  usageLocal: string;
  kind: "text" | "alt" | "placeholder";
  element: string;
  structPath: string;
}): string {
  return [
    "v2-content",
    normalizePathKey(candidate.attributionFilePath),
    normalizePathKey(candidate.definitionFilePath),
    candidate.usageLocal,
    candidate.kind,
    candidate.element,
    candidate.structPath,
  ].join("|");
}

function normalizePathKey(absolutePath: string): string {
  return absolutePath.split("\\").join("/");
}
