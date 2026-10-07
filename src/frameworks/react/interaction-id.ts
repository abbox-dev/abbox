import { createHash } from "node:crypto";

/**
 * Deterministic interaction identity (schema v2).
 *
 * Inputs are joined with "|" (fields must not contain "|"). Paths use
 * project-relative POSIX separators. The digest is SHA-256; the id is
 * `int_` plus the first 16 hex characters.
 *
 * Identity intentionally excludes:
 * - label text (labels are not identity)
 * - source line (line moves must not change id)
 * - effects (reserved for a future fingerprint field)
 *
 * `jsxOrdinal` is the 0-based index of this control among all extracted
 * interaction controls in the same definition module and usage instance,
 * in compiler discovery order within that scope.
 *
 * `usageLocal` is the route-module JSX local name when the control is
 * attributed through a directly rendered imported component (e.g. CardA vs
 * CardB). Empty string when the control lives in the route module itself.
 */
export interface InteractionIdentityMaterial {
  route: string;
  attributionFile: string;
  definitionFile: string;
  triggerKind: "activation" | "submit";
  event: "click" | "submit";
  tag: string;
  handlerRef: string;
  jsxOrdinal: number;
  usageLocal: string;
}

export function interactionIdentityMaterialKey(
  material: InteractionIdentityMaterial,
): string {
  return [
    "v2",
    material.route,
    material.attributionFile,
    material.definitionFile,
    material.triggerKind,
    material.event,
    material.tag,
    material.handlerRef,
    String(material.jsxOrdinal),
    material.usageLocal,
  ].join("|");
}

export function interactionIdFromMaterial(
  material: InteractionIdentityMaterial,
): string {
  const digest = createHash("sha256")
    .update(interactionIdentityMaterialKey(material), "utf8")
    .digest("hex");
  return `int_${digest.slice(0, 16)}`;
}

/** Pre-route dedupe key for interaction candidates (absolute paths). */
export function interactionCandidateDedupeKey(candidate: {
  attributionFilePath: string;
  definitionFilePath: string;
  triggerKind: "activation" | "submit";
  event: "click" | "submit";
  tag: string;
  handlerRef: string;
  jsxOrdinal: number;
  usageLocal: string;
}): string {
  return [
    "v2",
    normalizePathKey(candidate.attributionFilePath),
    normalizePathKey(candidate.definitionFilePath),
    candidate.triggerKind,
    candidate.event,
    candidate.tag,
    candidate.handlerRef,
    String(candidate.jsxOrdinal),
    candidate.usageLocal,
  ].join("|");
}

function normalizePathKey(absolutePath: string): string {
  return absolutePath.split("\\").join("/");
}
