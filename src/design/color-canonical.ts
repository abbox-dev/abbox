import { formatHex, formatHex8, parse } from "culori";

export function canonicalHexFromCssColor(value: string): string | undefined {
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed === "currentColor") {
    return undefined;
  }

  const parsed = parse(trimmed);
  if (parsed === undefined) {
    return undefined;
  }

  const alpha = parsed.alpha ?? 1;
  if (alpha < 1) {
    const hex8 = formatHex8(parsed);
    return hex8 === undefined ? undefined : hex8.toUpperCase();
  }

  const hex = formatHex(parsed);
  return hex === undefined ? undefined : hex.toUpperCase();
}

export function isStaticCssColor(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed === "currentColor") {
    return false;
  }
  return parse(trimmed) !== undefined;
}
