import {
  type Expression,
  type JsxAttributeLike,
  Node,
  Project,
  type SourceFile,
  SyntaxKind,
} from "ts-morph";
import type { Effect, InteractionLabels } from "../../ir/product-ir.js";
import { exportedComponentBody } from "../tanstack/links.js";
import { submitLabelEvidenceForFormElement } from "./form-submit-label.js";
import { effectsFromHandler } from "./handler-effects.js";
import { recognizedHandlerExpression } from "./jsx-handler.js";
import { extractStaticLabelEvidence } from "./jsx-label.js";
import { isProvablyDisabled } from "./jsx-static-attributes.js";
import { importedUiButtonLocalNames } from "./ui-button-import.js";

export interface InteractionCandidate {
  attributionFilePath: string;
  definitionFilePath: string;
  triggerKind: "activation" | "submit";
  event: "click" | "submit";
  tag: string;
  handlerRef: string;
  jsxOrdinal: number;
  usageLocal: string;
  labels?: InteractionLabels;
  effects: Effect[];
  line: number;
}

export function collectInteractionCandidates(
  files: readonly string[],
  knownRoutes: ReadonlySet<string>,
): InteractionCandidate[] {
  if (files.length === 0) {
    return [];
  }

  const project = new Project({
    skipAddingFilesFromTsConfig: true,
  });
  const candidates: InteractionCandidate[] = [];
  for (const file of files) {
    const sourceFile = project.addSourceFileAtPath(file);
    candidates.push(...candidatesInFile(sourceFile, file, knownRoutes, ""));
  }
  return candidates;
}

export function candidatesInExportBody(
  sourceFile: SourceFile,
  exportName: string,
  attributionFilePath: string,
  knownRoutes: ReadonlySet<string>,
  usageLocal: string,
): InteractionCandidate[] {
  const body = exportedComponentBody(sourceFile, exportName);
  if (body === undefined) {
    return [];
  }
  return candidatesInScope(
    sourceFile,
    body,
    attributionFilePath,
    knownRoutes,
    usageLocal,
  );
}

function candidatesInFile(
  sourceFile: SourceFile,
  attributionFilePath: string,
  knownRoutes: ReadonlySet<string>,
  usageLocal: string,
): InteractionCandidate[] {
  return candidatesInScope(
    sourceFile,
    sourceFile,
    attributionFilePath,
    knownRoutes,
    usageLocal,
  );
}

function candidatesInScope(
  sourceFile: SourceFile,
  scope: Node,
  attributionFilePath: string,
  knownRoutes: ReadonlySet<string>,
  usageLocal: string,
): InteractionCandidate[] {
  const uiButtonNames = importedUiButtonLocalNames(sourceFile);
  const candidates: InteractionCandidate[] = [];
  const nextOrdinal = createOrdinalAllocator();
  const definitionFilePath = sourceFile.getFilePath();

  for (const element of jsxElementsInScope(scope)) {
    const opening = element.getOpeningElement();
    if (isFormOpening(opening)) {
      const candidate = submitFromForm(
        sourceFile,
        element,
        attributionFilePath,
        definitionFilePath,
        knownRoutes,
        usageLocal,
        nextOrdinal,
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
        undefined,
        element.getStartLineNumber(),
        attributionFilePath,
        definitionFilePath,
        knownRoutes,
        usageLocal,
        nextOrdinal,
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
      element.getStartLineNumber(),
      uiButtonNames,
      attributionFilePath,
      definitionFilePath,
      knownRoutes,
      usageLocal,
      nextOrdinal,
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
      opening.getStartLineNumber(),
      uiButtonNames,
      attributionFilePath,
      definitionFilePath,
      knownRoutes,
      usageLocal,
      nextOrdinal,
    );
    if (candidate !== undefined) {
      candidates.push(candidate);
    }
  }

  return candidates;
}

function createOrdinalAllocator(): (
  definitionFilePath: string,
  usageLocal: string,
) => number {
  const counters = new Map<string, number>();
  return (definitionFilePath: string, usageLocal: string) => {
    const key = `${definitionFilePath}\0${usageLocal}`;
    const ordinal = counters.get(key) ?? 0;
    counters.set(key, ordinal + 1);
    return ordinal;
  };
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

function submitFromForm(
  sourceFile: SourceFile,
  formElement: import("ts-morph").JsxElement,
  attributionFilePath: string,
  definitionFilePath: string,
  knownRoutes: ReadonlySet<string>,
  usageLocal: string,
  nextOrdinal: (definitionFilePath: string, usageLocal: string) => number,
): InteractionCandidate | undefined {
  const opening = formElement.getOpeningElement();
  const labels = submitLabelEvidenceForFormElement(formElement);
  return submitFromElement(
    sourceFile,
    opening.getAttributes(),
    labels,
    opening.getStartLineNumber(),
    attributionFilePath,
    definitionFilePath,
    knownRoutes,
    usageLocal,
    nextOrdinal,
  );
}

function submitFromElement(
  sourceFile: SourceFile,
  attributes: readonly JsxAttributeLike[],
  labels: InteractionLabels | undefined,
  line: number,
  attributionFilePath: string,
  definitionFilePath: string,
  knownRoutes: ReadonlySet<string>,
  usageLocal: string,
  nextOrdinal: (definitionFilePath: string, usageLocal: string) => number,
): InteractionCandidate | undefined {
  if (isProvablyDisabled(attributes)) {
    return undefined;
  }
  const handler = recognizedHandlerExpression(attributes, "onSubmit");
  if (handler === undefined) {
    return undefined;
  }
  const candidate: InteractionCandidate = {
    attributionFilePath,
    definitionFilePath,
    triggerKind: "submit",
    event: "submit",
    tag: "form",
    handlerRef: handlerRef(handler),
    jsxOrdinal: nextOrdinal(definitionFilePath, usageLocal),
    usageLocal,
    effects: effectsFromHandler(sourceFile, handler, knownRoutes),
    line,
  };
  if (labels !== undefined) {
    candidate.labels = labels;
  }
  return candidate;
}

function invokeFromInteractiveElement(
  sourceFile: SourceFile,
  element:
    | import("ts-morph").JsxElement
    | import("ts-morph").JsxSelfClosingElement,
  tagName: Node,
  attributes: readonly JsxAttributeLike[],
  line: number,
  uiButtonNames: Set<string>,
  attributionFilePath: string,
  definitionFilePath: string,
  knownRoutes: ReadonlySet<string>,
  usageLocal: string,
  nextOrdinal: (definitionFilePath: string, usageLocal: string) => number,
): InteractionCandidate | undefined {
  if (!isInteractiveButton(tagName, uiButtonNames)) {
    return undefined;
  }
  if (isProvablyDisabled(attributes)) {
    return undefined;
  }
  const handler = recognizedHandlerExpression(attributes, "onClick");
  if (handler === undefined) {
    return undefined;
  }

  const labels = extractStaticLabelEvidence(element);
  const tag = tagName.getText();
  const candidate: InteractionCandidate = {
    attributionFilePath,
    definitionFilePath,
    triggerKind: "activation",
    event: "click",
    tag,
    handlerRef: handlerRef(handler),
    jsxOrdinal: nextOrdinal(definitionFilePath, usageLocal),
    usageLocal,
    effects: effectsFromHandler(sourceFile, handler, knownRoutes),
    line,
  };
  if (labels !== undefined) {
    candidate.labels = labels;
  }
  return candidate;
}

function handlerRef(handler: Expression): string {
  if (Node.isIdentifier(handler)) {
    return handler.getText();
  }
  if (Node.isArrowFunction(handler) || Node.isFunctionExpression(handler)) {
    return "inline";
  }
  return "unknown";
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
