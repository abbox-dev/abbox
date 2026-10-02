import { Node, Project, type SourceFile, SyntaxKind } from "ts-morph";
import { importedLocalNames } from "./named-import.js";

const linkExportName = "Link";

export interface StaticLinkHit {
  filePath: string;
  to: string;
}

export function collectStaticLinks(files: readonly string[]): StaticLinkHit[] {
  if (files.length === 0) {
    return [];
  }

  const project = new Project({
    skipAddingFilesFromTsConfig: true,
  });
  const hits: StaticLinkHit[] = [];
  for (const file of files) {
    hits.push(...linksInFile(project.addSourceFileAtPath(file)));
  }
  return hits;
}

function linksInFile(sourceFile: SourceFile): StaticLinkHit[] {
  const names = importedLocalNames(sourceFile, linkExportName);
  if (names.size === 0) {
    return [];
  }

  const hits: StaticLinkHit[] = [];
  for (const element of sourceFile.getDescendantsOfKind(
    SyntaxKind.JsxSelfClosingElement,
  )) {
    const hit = linkDestinationFromElement(
      element.getTagNameNode(),
      names,
      element,
    );
    if (hit !== undefined) {
      hits.push({ filePath: sourceFile.getFilePath(), to: hit });
    }
  }
  for (const element of sourceFile.getDescendantsOfKind(
    SyntaxKind.JsxOpeningElement,
  )) {
    const hit = linkDestinationFromElement(
      element.getTagNameNode(),
      names,
      element,
    );
    if (hit !== undefined) {
      hits.push({ filePath: sourceFile.getFilePath(), to: hit });
    }
  }
  return hits;
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

function absoluteRouteLiteral(text: string): string | undefined {
  if (text.length === 0 || !text.startsWith("/") || text.startsWith("//")) {
    return undefined;
  }
  return text;
}
