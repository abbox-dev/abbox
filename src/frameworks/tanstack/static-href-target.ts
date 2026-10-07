import { absoluteRouteLiteral } from "./static-link-destination.js";

const protocolPrefixes = ["mailto:", "tel:", "sms:"];

export type ClassifiedHref =
  | { kind: "screen"; route: string; anchorHash?: string }
  | { kind: "anchor"; hash: string }
  | { kind: "external"; url: string }
  | { kind: "resource"; path: string }
  | { kind: "protocol"; url: string };

export function classifyStaticHref(
  text: string,
  knownRoutes: ReadonlySet<string>,
): ClassifiedHref | undefined {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return undefined;
  }
  const lower = trimmed.toLowerCase();
  if (lower.startsWith("javascript:")) {
    return undefined;
  }

  for (const prefix of protocolPrefixes) {
    if (lower.startsWith(prefix)) {
      return { kind: "protocol", url: trimmed };
    }
  }

  if (lower.startsWith("http://") || lower.startsWith("https://")) {
    return { kind: "external", url: trimmed };
  }

  if (trimmed.startsWith("#")) {
    const hash = trimmed.slice(1);
    if (hash.length === 0) {
      return undefined;
    }
    return { kind: "anchor", hash };
  }

  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return undefined;
  }

  const hashIndex = trimmed.indexOf("#");
  const pathPart = hashIndex === -1 ? trimmed : trimmed.slice(0, hashIndex);
  const hashPart = hashIndex === -1 ? undefined : trimmed.slice(hashIndex + 1);

  const route = absoluteRouteLiteral(pathPart);
  if (route !== undefined && knownRoutes.has(route)) {
    if (hashPart !== undefined && hashPart.length > 0) {
      return { kind: "screen", route, anchorHash: hashPart };
    }
    return { kind: "screen", route };
  }

  if (hashPart !== undefined && hashPart.length > 0 && route === undefined) {
    return undefined;
  }

  return { kind: "resource", path: pathPart };
}
