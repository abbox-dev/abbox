import { Node, Project, type SourceFile, SyntaxKind } from "ts-morph";
import { fileRouteDestination } from "./file-routes.js";
import { importedLocalNames } from "./named-import.js";

const linkExportName = "Link";

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
    const tagName = element.getTagNameNode();
    const to = linkDestinationFromElement(tagName, names, element);
    if (to === undefined) {
      continue;
    }
    const componentExportName = enclosingExportedComponentName(
      element,
      sourceFile,
    );
    const hit: ScopedStaticLinkHit = { filePath, to };
    if (componentExportName !== undefined) {
      hit.componentExportName = componentExportName;
    }
    hits.push(hit);
  }
  return hits;
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

function linkDestinationFromElement(
  tagName: Node,
  names: Set<string>,
  element:
    | import("ts-morph").JsxSelfClosingElement
    | import("ts-morph").JsxOpeningElement,
): string | undefined {
  if (!Node.isIdentifier(tagName) || !names.has(tagName.getText())) {
    return undefined;
  }

  const toAttribute = element
    .getAttributes()
    .find(
      (attribute) =>
        Node.isJsxAttribute(attribute) &&
        attribute.getNameNode().getText() === "to",
    );

  if (toAttribute === undefined || !Node.isJsxAttribute(toAttribute)) {
    return undefined;
  }

  const initializer = toAttribute.getInitializer();
  if (initializer === undefined) {
    return undefined;
  }

  if (Node.isStringLiteral(initializer)) {
    return absoluteRouteLiteral(initializer.getLiteralText());
  }

  if (
    Node.isJsxExpression(initializer) &&
    initializer.getExpression() !== undefined
  ) {
    const expression = initializer.getExpression();
    if (expression !== undefined && Node.isStringLiteral(expression)) {
      return absoluteRouteLiteral(expression.getLiteralText());
    }
  }

  return undefined;
}

export function absoluteRouteLiteral(text: string): string | undefined {
  if (text.length === 0 || !text.startsWith("/") || text.startsWith("//")) {
    return undefined;
  }
  return fileRouteDestination(text);
}

export function staticLinksInComponentBody(
  sourceFile: SourceFile,
  exportName: string,
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
  for (const element of componentBody.getDescendantsOfKind(
    SyntaxKind.JsxSelfClosingElement,
  )) {
    const to = linkDestinationFromElement(
      element.getTagNameNode(),
      names,
      element,
    );
    if (to !== undefined) {
      destinations.push(to);
    }
  }
  for (const element of componentBody.getDescendantsOfKind(
    SyntaxKind.JsxOpeningElement,
  )) {
    const to = linkDestinationFromElement(
      element.getTagNameNode(),
      names,
      element,
    );
    if (to !== undefined) {
      destinations.push(to);
    }
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
