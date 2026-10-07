import { Node, Project, type SourceFile, SyntaxKind } from "ts-morph";
import { extractStaticLabel } from "../react/jsx-label.js";
import { literalPropsForLocalComponentUsage } from "../react/jsx-literal-props.js";
import { exportedComponentBody } from "./links.js";
import {
  type ClassifiedHref,
  classifyStaticHref,
} from "./static-href-target.js";
import {
  contextForLinkNode,
  type LiteralPropsMap,
  resolveStaticStringExpressions,
  type StaticLinkContext,
} from "./static-link-destination.js";

export interface ScopedAnchorNavigationHit {
  filePath: string;
  to: string;
}

export interface ScopedProductLinkHit {
  filePath: string;
  classification: Exclude<ClassifiedHref, { kind: "screen" }>;
  label?: string;
  download?: boolean;
}

function isNativeAnchorTag(tagName: Node): boolean {
  return Node.isIdentifier(tagName) && tagName.getText() === "a";
}

function hrefStringsFromElement(
  element:
    | import("ts-morph").JsxSelfClosingElement
    | import("ts-morph").JsxOpeningElement,
  sourceFile: SourceFile,
  linkNode: Node,
  contextOverride?: StaticLinkContext,
): string[] {
  const hrefAttribute = element
    .getAttributes()
    .find(
      (attribute) =>
        Node.isJsxAttribute(attribute) &&
        attribute.getNameNode().getText() === "href",
    );
  if (hrefAttribute === undefined || !Node.isJsxAttribute(hrefAttribute)) {
    return [];
  }

  const initializer = hrefAttribute.getInitializer();
  if (initializer === undefined) {
    return [];
  }

  if (Node.isStringLiteral(initializer)) {
    return [initializer.getLiteralText()];
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

  if (Node.isJsxExpression(initializer)) {
    const expression = initializer.getExpression();
    if (expression !== undefined) {
      return resolveStaticStringExpressions(expression, context);
    }
  }

  return [];
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

function downloadFromElement(
  element:
    | import("ts-morph").JsxSelfClosingElement
    | import("ts-morph").JsxOpeningElement,
): boolean | undefined {
  const downloadAttribute = element
    .getAttributes()
    .find(
      (attribute) =>
        Node.isJsxAttribute(attribute) &&
        attribute.getNameNode().getText() === "download",
    );
  if (
    downloadAttribute === undefined ||
    !Node.isJsxAttribute(downloadAttribute)
  ) {
    return undefined;
  }
  const initializer = downloadAttribute.getInitializer();
  if (initializer === undefined) {
    return true;
  }
  if (Node.isStringLiteral(initializer)) {
    return true;
  }
  if (
    Node.isJsxExpression(initializer) &&
    initializer.getExpression() !== undefined
  ) {
    const expression = initializer.getExpression();
    if (expression !== undefined && Node.isTrueLiteral(expression)) {
      return true;
    }
  }
  return undefined;
}

function labelForAnchor(
  element:
    | import("ts-morph").JsxSelfClosingElement
    | import("ts-morph").JsxOpeningElement,
): string | undefined {
  if (Node.isJsxSelfClosingElement(element)) {
    return undefined;
  }
  const parent = element.getParent();
  if (parent === undefined || !Node.isJsxElement(parent)) {
    return undefined;
  }
  return extractStaticLabel(parent);
}

export function collectAnchorsInScope(
  sourceFile: SourceFile,
  scope: import("ts-morph").Node,
  knownRoutes: ReadonlySet<string>,
  contextOverride?: StaticLinkContext,
): {
  navigationHits: ScopedAnchorNavigationHit[];
  productLinkHits: ScopedProductLinkHit[];
} {
  const filePath = sourceFile.getFilePath();
  const navigationHits: ScopedAnchorNavigationHit[] = [];
  const productLinkHits: ScopedProductLinkHit[] = [];

  const elements = [
    ...scope.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement),
    ...scope.getDescendantsOfKind(SyntaxKind.JsxOpeningElement),
  ];

  for (const element of elements) {
    const tagName = element.getTagNameNode();
    if (!isNativeAnchorTag(tagName)) {
      continue;
    }

    const hrefStrings = hrefStringsFromElement(
      element,
      sourceFile,
      element,
      contextOverride,
    );
    if (hrefStrings.length === 0) {
      continue;
    }

    const label = labelForAnchor(element);
    const download = downloadFromElement(element) === true ? true : undefined;

    for (const href of hrefStrings) {
      const classified = classifyStaticHref(href, knownRoutes);
      if (classified === undefined) {
        continue;
      }
      if (classified.kind === "screen") {
        navigationHits.push({ filePath, to: classified.route });
        if (classified.anchorHash !== undefined) {
          productLinkHits.push({
            filePath,
            classification: {
              kind: "anchor",
              hash: classified.anchorHash,
            },
            label,
          });
        }
        continue;
      }

      const hit: ScopedProductLinkHit = {
        filePath,
        classification: classified,
        label,
      };
      if (classified.kind === "resource" && download === true) {
        hit.download = true;
      }
      productLinkHits.push(hit);
    }
  }

  return { navigationHits, productLinkHits };
}

export function collectScopedAnchorsInFile(
  sourceFile: SourceFile,
  knownRoutes: ReadonlySet<string>,
): {
  navigationHits: ScopedAnchorNavigationHit[];
  productLinkHits: ScopedProductLinkHit[];
} {
  return collectAnchorsInScope(sourceFile, sourceFile, knownRoutes);
}

export function collectScopedAnchors(
  files: readonly string[],
  knownRoutes: ReadonlySet<string>,
): {
  navigationHits: ScopedAnchorNavigationHit[];
  productLinkHits: ScopedProductLinkHit[];
} {
  if (files.length === 0) {
    return { navigationHits: [], productLinkHits: [] };
  }

  const project = new Project({
    skipAddingFilesFromTsConfig: true,
  });
  const navigationHits: ScopedAnchorNavigationHit[] = [];
  const productLinkHits: ScopedProductLinkHit[] = [];

  for (const filePath of files) {
    const sourceFile = project.addSourceFileAtPath(filePath);
    const scoped = collectScopedAnchorsInFile(sourceFile, knownRoutes);
    navigationHits.push(...scoped.navigationHits);
    productLinkHits.push(...scoped.productLinkHits);
  }

  return { navigationHits, productLinkHits };
}

export function staticAnchorsInComponentBody(
  sourceFile: SourceFile,
  exportName: string,
  knownRoutes: ReadonlySet<string>,
  literalProps?: LiteralPropsMap,
): {
  navigationDestinations: string[];
  productLinkHits: ScopedProductLinkHit[];
} {
  const componentBody = exportedComponentBody(sourceFile, exportName);
  if (componentBody === undefined) {
    return { navigationDestinations: [], productLinkHits: [] };
  }
  const context = contextForLinkNode(componentBody, sourceFile, literalProps);
  const { navigationHits, productLinkHits } = collectAnchorsInScope(
    sourceFile,
    componentBody,
    knownRoutes,
    context,
  );
  const destinations = [...new Set(navigationHits.map((hit) => hit.to))];
  return {
    navigationDestinations: destinations,
    productLinkHits: productLinkHits.map((hit) => ({
      ...hit,
      filePath: sourceFile.getFilePath(),
    })),
  };
}
