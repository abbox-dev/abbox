import { Node, type SourceFile, SyntaxKind } from "ts-morph";
import { literalFromJsxAttributeInitializer } from "../tanstack/static-link-destination.js";
import type { DirectComponentImport } from "./direct-component-imports.js";

export type ComponentLiteralProps = ReadonlyMap<string, readonly string[]>;

/** Literal props from JSX usages of a same-file function component by name. */
export function literalPropsForLocalComponentUsage(
  sourceFile: SourceFile,
  componentName: string,
): ComponentLiteralProps {
  const byProp = new Map<string, Set<string>>();
  const fakeEntry: DirectComponentImport = {
    localName: componentName,
    resolvedFilePath: sourceFile.getFilePath(),
    exportName: componentName,
  };
  collectFromFile(sourceFile, fakeEntry, byProp);
  const result = new Map<string, readonly string[]>();
  for (const [key, values] of byProp) {
    result.set(key, [...values].sort());
  }
  return result;
}

function collectFromFile(
  sourceFile: SourceFile,
  entry: DirectComponentImport,
  byProp: Map<string, Set<string>>,
): void {
  for (const element of sourceFile.getDescendantsOfKind(
    SyntaxKind.JsxSelfClosingElement,
  )) {
    collectFromJsxElement(element.getTagNameNode(), element, entry, byProp);
  }
  for (const element of sourceFile.getDescendantsOfKind(
    SyntaxKind.JsxOpeningElement,
  )) {
    collectFromJsxElement(element.getTagNameNode(), element, entry, byProp);
  }
}

/**
 * Merges literal prop values from all JSX usages of a component in a file.
 * Multiple call sites union their values per prop name.
 */
export function literalPropsForComponentUsage(
  sourceFile: SourceFile,
  entry: DirectComponentImport,
): ComponentLiteralProps {
  const byProp = new Map<string, Set<string>>();
  collectFromFile(sourceFile, entry, byProp);
  const result = new Map<string, readonly string[]>();
  for (const [key, values] of byProp) {
    result.set(key, [...values].sort());
  }
  return result;
}

function collectFromJsxElement(
  tagName: import("ts-morph").Node,
  element:
    | import("ts-morph").JsxSelfClosingElement
    | import("ts-morph").JsxOpeningElement,
  entry: DirectComponentImport,
  byProp: Map<string, Set<string>>,
): void {
  if (!Node.isIdentifier(tagName) || tagName.getText() !== entry.localName) {
    return;
  }

  for (const attribute of element.getAttributes()) {
    if (!Node.isJsxAttribute(attribute)) {
      continue;
    }
    const propName = attribute.getNameNode().getText();
    const literal = literalFromJsxAttributeInitializer(
      attribute.getInitializer(),
    );
    if (literal === undefined) {
      continue;
    }
    const route = literal.startsWith("/") ? literal : undefined;
    if (route === undefined) {
      continue;
    }
    let set = byProp.get(propName);
    if (set === undefined) {
      set = new Set<string>();
      byProp.set(propName, set);
    }
    set.add(route);
  }
}
