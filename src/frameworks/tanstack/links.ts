import { Node, Project, type SourceFile, SyntaxKind } from "ts-morph";
import { literalPropsForLocalComponentUsage } from "../react/jsx-literal-props.js";
import { importedLocalNames } from "./named-import.js";
import type { LiteralPropsMap } from "./static-link-destination.js";
import {
  absoluteRouteLiteral,
  contextForLinkNode,
  resolveLinkToDestinations,
  type StaticLinkContext,
} from "./static-link-destination.js";

const linkExportName = "Link";

export { absoluteRouteLiteral } from "./static-link-destination.js";

export interface StaticLinkHit {
  filePath: string;
  to: string;
}

export interface ScopedStaticLinkHit {
  filePath: string;
  /** Undefined when the link is not inside an exported function component body */
  componentExportName?: string;
  to: string;
}

export function collectStaticLinks(files: readonly string[]): StaticLinkHit[] {
  return collectScopedStaticLinks(files).map(({ filePath, to }) => ({
    filePath,
    to,
  }));
}

export function collectScopedStaticLinks(
  files: readonly string[],
): ScopedStaticLinkHit[] {
  if (files.length === 0) {
    return [];
  }

  const project = new Project({
    skipAddingFilesFromTsConfig: true,
  });
  const hits: ScopedStaticLinkHit[] = [];
  for (const file of files) {
    hits.push(...scopedLinksInFile(project.addSourceFileAtPath(file)));
  }
  return hits;
}

function scopedLinksInFile(sourceFile: SourceFile): ScopedStaticLinkHit[] {
  const names = importedLocalNames(sourceFile, linkExportName);
  if (names.size === 0) {
    return [];
  }

  const filePath = sourceFile.getFilePath();
  const hits: ScopedStaticLinkHit[] = [];
  const linkElements = [
    ...sourceFile.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement),
    ...sourceFile.getDescendantsOfKind(SyntaxKind.JsxOpeningElement),
  ];

  for (const element of linkElements) {
    const destinations = linkDestinationsFromElement(
      element.getTagNameNode(),
      names,
      element,
      sourceFile,
      element,
    );
    if (destinations.length === 0) {
      continue;
    }
    const componentExportName = enclosingExportedComponentName(
      element,
      sourceFile,
    );
    for (const to of destinations) {
      const hit: ScopedStaticLinkHit = { filePath, to };
      if (componentExportName !== undefined) {
        hit.componentExportName = componentExportName;
      }
      hits.push(hit);
    }
  }
  return hits;
}

function mergeLiteralProps(
  base: LiteralPropsMap | undefined,
  extra: LiteralPropsMap,
): LiteralPropsMap {
  const merged = new Map<string, string[]>();
  if (base !== undefined) {
    for (const [key, values] of base) {
      merged.set(key, [...values]);
    }
  }
  for (const [key, values] of extra) {
    const existing = merged.get(key);
    if (existing === undefined) {
      merged.set(key, [...values]);
    } else {
      merged.set(key, [...new Set([...existing, ...values])].sort());
    }
  }
  return merged;
}

function enclosingFunctionComponentName(
  linkNode: Node,
  sourceFile: SourceFile,
): string | undefined {
  let current: Node | undefined = linkNode;
  while (current !== undefined && current !== sourceFile) {
    if (
      Node.isFunctionDeclaration(current) &&
      current.getName() !== undefined
    ) {
      return current.getName();
    }
    if (Node.isVariableDeclaration(current)) {
      const initializer = current.getInitializer();
      if (
        initializer !== undefined &&
        (Node.isArrowFunction(initializer) ||
          Node.isFunctionExpression(initializer)) &&
        Node.isIdentifier(current.getNameNode())
      ) {
        return current.getNameNode().getText();
      }
    }
    current = current.getParent();
  }
  return undefined;
}

function enclosingExportedComponentName(
  linkNode: Node,
  sourceFile: SourceFile,
): string | undefined {
  let current: Node | undefined = linkNode;
  while (current !== undefined && current !== sourceFile) {
    if (Node.isFunctionDeclaration(current)) {
      if (!current.isExported()) {
        return undefined;
      }
      return current.getName();
    }
    if (Node.isVariableDeclaration(current)) {
      const parent = current.getParent();
      if (
        parent !== undefined &&
        Node.isVariableStatement(parent) &&
        parent.isExported()
      ) {
        const initializer = current.getInitializer();
        if (
          initializer !== undefined &&
          (Node.isArrowFunction(initializer) ||
            Node.isFunctionExpression(initializer))
        ) {
          return current.getName();
        }
      }
    }
    current = current.getParent();
  }
  return undefined;
}

function linkDestinationsFromElement(
  tagName: Node,
  names: Set<string>,
  element:
    | import("ts-morph").JsxSelfClosingElement
    | import("ts-morph").JsxOpeningElement,
  sourceFile: SourceFile,
  linkNode: Node,
  contextOverride?: StaticLinkContext,
): string[] {
  if (!Node.isIdentifier(tagName) || !names.has(tagName.getText())) {
    return [];
  }

  const toAttribute = element
    .getAttributes()
    .find(
      (attribute) =>
        Node.isJsxAttribute(attribute) &&
        attribute.getNameNode().getText() === "to",
    );

  if (toAttribute === undefined || !Node.isJsxAttribute(toAttribute)) {
    return [];
  }

  const initializer = toAttribute.getInitializer();
  if (initializer === undefined) {
    return [];
  }

  if (Node.isStringLiteral(initializer)) {
    const route = absoluteRouteLiteral(initializer.getLiteralText());
    return route !== undefined ? [route] : [];
  }

  let context =
    contextOverride !== undefined
      ? contextOverride
      : contextForLinkNode(linkNode, sourceFile);
  const localFn = enclosingFunctionComponentName(linkNode, sourceFile);
  if (localFn !== undefined) {
    const localProps = literalPropsForLocalComponentUsage(sourceFile, localFn);
    if (localProps.size > 0) {
      context = {
        ...context,
        literalProps: mergeLiteralProps(context.literalProps, localProps),
      };
    }
  }

  if (
    Node.isJsxExpression(initializer) &&
    initializer.getExpression() !== undefined
  ) {
    return resolveLinkToDestinations(initializer.getExpression(), context);
  }

  return [];
}

export function staticLinksInComponentBody(
  sourceFile: SourceFile,
  exportName: string,
  literalProps?: LiteralPropsMap,
): string[] {
  const componentBody = exportedComponentBody(sourceFile, exportName);
  if (componentBody === undefined) {
    return [];
  }
  const names = importedLocalNames(sourceFile, linkExportName);
  if (names.size === 0) {
    return [];
  }

  const destinations: string[] = [];
  const contextBase = contextForLinkNode(
    componentBody,
    sourceFile,
    literalProps,
  );

  for (const element of componentBody.getDescendantsOfKind(
    SyntaxKind.JsxSelfClosingElement,
  )) {
    const toList = linkDestinationsFromElement(
      element.getTagNameNode(),
      names,
      element,
      sourceFile,
      element,
      contextBase,
    );
    destinations.push(...toList);
  }
  for (const element of componentBody.getDescendantsOfKind(
    SyntaxKind.JsxOpeningElement,
  )) {
    const toList = linkDestinationsFromElement(
      element.getTagNameNode(),
      names,
      element,
      sourceFile,
      element,
      contextBase,
    );
    destinations.push(...toList);
  }
  return destinations;
}

export function exportedComponentBody(
  sourceFile: SourceFile,
  exportName: string,
): Node | undefined {
  if (exportName === "default") {
    for (const statement of sourceFile.getStatements()) {
      if (
        Node.isFunctionDeclaration(statement) &&
        statement.isDefaultExport()
      ) {
        return statement;
      }
      if (Node.isExportAssignment(statement) && !statement.isExportEquals()) {
        const expression = statement.getExpression();
        if (
          Node.isArrowFunction(expression) ||
          Node.isFunctionExpression(expression)
        ) {
          return expression;
        }
      }
    }
    return undefined;
  }

  for (const declaration of sourceFile.getFunctions()) {
    if (declaration.isExported() && declaration.getName() === exportName) {
      return declaration;
    }
  }
  for (const statement of sourceFile.getVariableStatements()) {
    if (!statement.isExported()) {
      continue;
    }
    for (const declaration of statement.getDeclarations()) {
      if (declaration.getName() !== exportName) {
        continue;
      }
      const initializer = declaration.getInitializer();
      if (
        initializer !== undefined &&
        (Node.isArrowFunction(initializer) ||
          Node.isFunctionExpression(initializer))
      ) {
        return initializer;
      }
    }
  }
  return undefined;
}
