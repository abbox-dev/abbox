import {
  type JsxAttributeLike,
  Node,
  Project,
  type SourceFile,
  SyntaxKind,
} from "ts-morph";
import type { Effect } from "../../ir/product-ir.js";
import { exportedComponentBody } from "../tanstack/links.js";
import { effectsFromHandler } from "./handler-effects.js";
import { recognizedHandlerExpression } from "./jsx-handler.js";
import { extractStaticLabel } from "./jsx-label.js";
import { importedUiButtonLocalNames } from "./ui-button-import.js";

export interface ActionCandidate {
  filePath: string;
  kind: "invoke" | "submit";
  label?: string;
  effects: Effect[];
  discoveryIndex: number;
}

export function collectActionCandidates(
  files: readonly string[],
  nextIndex: () => number = createDiscoveryIndex(),
): ActionCandidate[] {
  if (files.length === 0) {
    return [];
  }

  const project = new Project({
    skipAddingFilesFromTsConfig: true,
  });
  const candidates: ActionCandidate[] = [];
  for (const file of files) {
    const sourceFile = project.addSourceFileAtPath(file);
    candidates.push(...candidatesInFile(sourceFile, file, nextIndex));
  }
  return candidates;
}

export function candidatesInExportBody(
  sourceFile: SourceFile,
  exportName: string,
  attributionFilePath: string,
  nextIndex: () => number,
): ActionCandidate[] {
  const body = exportedComponentBody(sourceFile, exportName);
  if (body === undefined) {
    return [];
  }
  return candidatesInScope(sourceFile, body, attributionFilePath, nextIndex);
}

function candidatesInFile(
  sourceFile: SourceFile,
  attributionFilePath: string,
  nextIndex: () => number,
): ActionCandidate[] {
  return candidatesInScope(
    sourceFile,
    sourceFile,
    attributionFilePath,
    nextIndex,
  );
}

function candidatesInScope(
  sourceFile: SourceFile,
  scope: Node,
  attributionFilePath: string,
  nextIndex: () => number,
): ActionCandidate[] {
  const uiButtonNames = importedUiButtonLocalNames(sourceFile);
  const candidates: ActionCandidate[] = [];

  for (const element of jsxElementsInScope(scope)) {
    const opening = element.getOpeningElement();
    if (isFormOpening(opening)) {
      const candidate = submitFromElement(
        sourceFile,
        opening.getAttributes(),
        attributionFilePath,
        nextIndex,
      );
      if (candidate !== undefined) {
        candidates.push(candidate);
      }
    }
  }

  for (const element of jsxSelfClosingInScope(scope)) {
    if (isFormSelfClosing(element)) {
      const candidate = submitFromElement(
        sourceFile,
        element.getAttributes(),
        attributionFilePath,
        nextIndex,
      );
      if (candidate !== undefined) {
        candidates.push(candidate);
      }
    }
  }

  for (const element of jsxSelfClosingInScope(scope)) {
    const candidate = invokeFromInteractiveElement(
      sourceFile,
      element,
      element.getTagNameNode(),
      element.getAttributes(),
      uiButtonNames,
      attributionFilePath,
      nextIndex,
    );
    if (candidate !== undefined) {
      candidates.push(candidate);
    }
  }

  for (const element of jsxElementsInScope(scope)) {
    const opening = element.getOpeningElement();
    const candidate = invokeFromInteractiveElement(
      sourceFile,
      element,
      opening.getTagNameNode(),
      opening.getAttributes(),
      uiButtonNames,
      attributionFilePath,
      nextIndex,
    );
    if (candidate !== undefined) {
      candidates.push(candidate);
    }
  }

  return candidates;
}

function jsxElementsInScope(scope: Node): import("ts-morph").JsxElement[] {
  if (Node.isSourceFile(scope)) {
    return scope.getDescendantsOfKind(SyntaxKind.JsxElement);
  }
  return scope.getDescendantsOfKind(SyntaxKind.JsxElement);
}

function jsxSelfClosingInScope(
  scope: Node,
): import("ts-morph").JsxSelfClosingElement[] {
  if (Node.isSourceFile(scope)) {
    return scope.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement);
  }
  return scope.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement);
}

function createDiscoveryIndex(): () => number {
  let discoveryIndex = 0;
  return () => {
    const index = discoveryIndex;
    discoveryIndex += 1;
    return index;
  };
}

function submitFromElement(
  sourceFile: import("ts-morph").SourceFile,
  attributes: readonly JsxAttributeLike[],
  filePath: string,
  nextIndex: () => number,
): ActionCandidate | undefined {
  const handler = recognizedHandlerExpression(attributes, "onSubmit");
  if (handler === undefined) {
    return undefined;
  }
  return {
    filePath,
    kind: "submit",
    effects: effectsFromHandler(sourceFile, handler),
    discoveryIndex: nextIndex(),
  };
}

function invokeFromInteractiveElement(
  sourceFile: import("ts-morph").SourceFile,
  element:
    | import("ts-morph").JsxElement
    | import("ts-morph").JsxSelfClosingElement,
  tagName: Node,
  attributes: readonly JsxAttributeLike[],
  uiButtonNames: Set<string>,
  filePath: string,
  nextIndex: () => number,
): ActionCandidate | undefined {
  if (!isInteractiveButton(tagName, uiButtonNames)) {
    return undefined;
  }
  const handler = recognizedHandlerExpression(attributes, "onClick");
  if (handler === undefined) {
    return undefined;
  }

  const label = extractStaticLabel(element);
  return {
    filePath,
    kind: "invoke",
    label,
    effects: effectsFromHandler(sourceFile, handler),
    discoveryIndex: nextIndex(),
  };
}

function isInteractiveButton(
  tagName: Node,
  uiButtonNames: Set<string>,
): boolean {
  if (!Node.isIdentifier(tagName)) {
    return false;
  }
  const name = tagName.getText();
  return name === "button" || uiButtonNames.has(name);
}

function isFormOpening(opening: import("ts-morph").JsxOpeningElement): boolean {
  const tag = opening.getTagNameNode();
  return Node.isIdentifier(tag) && tag.getText() === "form";
}

function isFormSelfClosing(
  element: import("ts-morph").JsxSelfClosingElement,
): boolean {
  const tag = element.getTagNameNode();
  return Node.isIdentifier(tag) && tag.getText() === "form";
}
