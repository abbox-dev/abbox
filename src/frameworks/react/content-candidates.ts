import {
  type JsxChild,
  Node,
  Project,
  type SourceFile,
  SyntaxKind,
} from "ts-morph";
import type { ContentValue } from "../../ir/product-ir.js";
import { exportedComponentBody } from "../tanstack/links.js";
import { staticStringFromJsxAttribute } from "./jsx-static-attributes.js";
import {
  isTextHostTag,
  type StaticTextValue,
  staticTextContextForScope,
  staticTextFromJsxChildren,
} from "./static-text.js";

export interface ContentCandidate {
  attributionFilePath: string;
  definitionFilePath: string;
  usageLocal: string;
  kind: "text" | "alt" | "placeholder";
  element: string;
  structPath: string;
  line: number;
  value: ContentValue;
}

export function collectRouteFileContentCandidates(
  routeFilePath: string,
): ContentCandidate[] {
  const project = new Project({
    skipAddingFilesFromTsConfig: true,
  });
  const sourceFile = project.addSourceFileAtPath(routeFilePath);
  return collectContentInScope(
    sourceFile,
    sourceFile,
    routeFilePath,
    routeFilePath,
    "",
  );
}

export function collectContentInExportBody(
  sourceFile: SourceFile,
  exportName: string,
  attributionFilePath: string,
  usageLocal: string,
): ContentCandidate[] {
  const body = exportedComponentBody(sourceFile, exportName);
  if (body === undefined) {
    return [];
  }
  return collectContentInScope(
    sourceFile,
    body,
    attributionFilePath,
    sourceFile.getFilePath(),
    usageLocal,
  );
}

function collectContentInScope(
  sourceFile: SourceFile,
  scope: import("ts-morph").Node,
  attributionFilePath: string,
  definitionFilePath: string,
  usageLocal: string,
): ContentCandidate[] {
  const context = staticTextContextForScope(sourceFile, scope);
  const candidates: ContentCandidate[] = [];

  for (const element of scope.getDescendantsOfKind(SyntaxKind.JsxElement)) {
    const opening = element.getOpeningElement();
    const tagName = tagNameText(opening.getTagNameNode());
    if (tagName === undefined) {
      continue;
    }
    const structPath = structPathToScope(element, scope);
    if (structPath === undefined) {
      continue;
    }
    const line = opening.getStartLineNumber();

    if (tagName === "img") {
      const alt = staticStringFromJsxAttribute(opening.getAttributes(), "alt");
      if (alt !== undefined && alt.length > 0) {
        candidates.push(
          candidateFromValue(
            attributionFilePath,
            definitionFilePath,
            usageLocal,
            "alt",
            "img",
            structPath,
            line,
            { text: alt },
          ),
        );
      }
      continue;
    }

    if (!isTextHostTag(tagName)) {
      continue;
    }

    const value = staticTextFromJsxChildren(element.getJsxChildren(), context);
    if (value !== undefined) {
      candidates.push(
        candidateFromValue(
          attributionFilePath,
          definitionFilePath,
          usageLocal,
          "text",
          tagName,
          structPath,
          line,
          toContentValue(value),
        ),
      );
    }
  }

  for (const element of scope.getDescendantsOfKind(
    SyntaxKind.JsxSelfClosingElement,
  )) {
    const tagName = tagNameText(element.getTagNameNode());
    if (tagName === undefined) {
      continue;
    }
    const structPath = structPathToScope(element, scope);
    if (structPath === undefined) {
      continue;
    }
    const line = element.getStartLineNumber();
    const attributes = element.getAttributes();

    if (tagName === "img") {
      const alt = staticStringFromJsxAttribute(attributes, "alt");
      if (alt !== undefined && alt.length > 0) {
        candidates.push(
          candidateFromValue(
            attributionFilePath,
            definitionFilePath,
            usageLocal,
            "alt",
            "img",
            structPath,
            line,
            { text: alt },
          ),
        );
      }
      continue;
    }

    if (tagName === "input" || tagName === "textarea") {
      const placeholder = staticStringFromJsxAttribute(
        attributes,
        "placeholder",
      );
      if (placeholder !== undefined && placeholder.length > 0) {
        candidates.push(
          candidateFromValue(
            attributionFilePath,
            definitionFilePath,
            usageLocal,
            "placeholder",
            tagName,
            structPath,
            line,
            { text: placeholder },
          ),
        );
      }
    }
  }

  return candidates;
}

function candidateFromValue(
  attributionFilePath: string,
  definitionFilePath: string,
  usageLocal: string,
  kind: ContentCandidate["kind"],
  element: string,
  structPath: string,
  line: number,
  value: ContentValue,
): ContentCandidate {
  return {
    attributionFilePath,
    definitionFilePath,
    usageLocal,
    kind,
    element,
    structPath,
    line,
    value,
  };
}

function toContentValue(value: StaticTextValue): ContentValue {
  if (value.kind === "text") {
    return { text: value.text };
  }
  return { alternatives: value.alternatives };
}

function tagNameText(tagName: import("ts-morph").Node): string | undefined {
  if (Node.isIdentifier(tagName)) {
    return tagName.getText();
  }
  return undefined;
}

function structPathToScope(
  node: import("ts-morph").Node,
  scope: import("ts-morph").Node,
): string | undefined {
  const indices: number[] = [];
  let current: import("ts-morph").Node | undefined = node;

  while (current !== undefined && current !== scope) {
    const parent = current.getParent();
    if (parent === undefined) {
      return undefined;
    }

    if (Node.isJsxElement(parent)) {
      const index = jsxChildIndexInParent(current, parent);
      if (index === undefined) {
        return undefined;
      }
      indices.unshift(index);
      current = parent;
      continue;
    }

    if (Node.isJsxFragment(parent)) {
      const index = jsxChildIndexInFragment(current, parent);
      if (index === undefined) {
        return undefined;
      }
      indices.unshift(index);
      current = parent;
      continue;
    }

    current = parent;
  }

  if (current !== scope) {
    return undefined;
  }

  return indices.join(",");
}

function jsxChildIndexInParent(
  child: import("ts-morph").Node,
  parent: import("ts-morph").JsxElement,
): number | undefined {
  const children = parent.getJsxChildren();
  return jsxChildIndexAmong(children, child);
}

function jsxChildIndexInFragment(
  child: import("ts-morph").Node,
  parent: import("ts-morph").JsxFragment,
): number | undefined {
  return jsxChildIndexAmong(parent.getJsxChildren(), child);
}

function jsxChildIndexAmong(
  children: readonly JsxChild[],
  child: import("ts-morph").Node,
): number | undefined {
  let index = 0;
  for (const jsxChild of children) {
    if (matchesJsxChild(jsxChild, child)) {
      return index;
    }
    if (countsAsStructuralJsxChild(jsxChild)) {
      index += 1;
    }
  }
  return undefined;
}

function matchesJsxChild(
  jsxChild: JsxChild,
  target: import("ts-morph").Node,
): boolean {
  if (Node.isJsxElement(jsxChild)) {
    return (
      jsxChild === target ||
      jsxChild.getOpeningElement() === target ||
      jsxChild.getClosingElement() === target
    );
  }
  if (Node.isJsxSelfClosingElement(jsxChild)) {
    return jsxChild === target;
  }
  if (Node.isJsxFragment(jsxChild)) {
    return jsxChild === target;
  }
  return jsxChild === target;
}

function countsAsStructuralJsxChild(jsxChild: JsxChild): boolean {
  return (
    Node.isJsxElement(jsxChild) ||
    Node.isJsxSelfClosingElement(jsxChild) ||
    Node.isJsxFragment(jsxChild) ||
    Node.isJsxExpression(jsxChild) ||
    Node.isJsxText(jsxChild)
  );
}
