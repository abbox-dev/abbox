import {
  type Expression,
  type JsxChild,
  Node,
  type SourceFile,
} from "ts-morph";
import {
  contextForLinkNode,
  type StaticLinkContext,
} from "../tanstack/static-link-destination.js";

export type StaticTextValue =
  | { kind: "text"; text: string }
  | { kind: "alternatives"; alternatives: string[] };

export function normalizeContentWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

export function staticTextContextForScope(
  sourceFile: SourceFile,
  scope: import("ts-morph").Node,
): StaticLinkContext {
  return contextForLinkNode(scope, sourceFile);
}

export function resolveStaticTextExpression(
  expression: Expression,
  context: StaticLinkContext,
): StaticTextValue | undefined {
  const unwrapped = unwrapExpression(expression);

  if (Node.isStringLiteral(unwrapped)) {
    const text = normalizeContentWhitespace(unwrapped.getLiteralText());
    return text.length === 0 ? undefined : { kind: "text", text };
  }

  if (Node.isNoSubstitutionTemplateLiteral(unwrapped)) {
    const text = normalizeContentWhitespace(unwrapped.getLiteralText());
    return text.length === 0 ? undefined : { kind: "text", text };
  }

  if (Node.isTemplateExpression(unwrapped)) {
    if (unwrapped.getTemplateSpans().length > 0) {
      return undefined;
    }
    const text = normalizeContentWhitespace(
      unwrapped.getHead().getLiteralText(),
    );
    return text.length === 0 ? undefined : { kind: "text", text };
  }

  if (Node.isIdentifier(unwrapped)) {
    const resolved = resolveIdentifierString(unwrapped, context);
    if (resolved === undefined) {
      return undefined;
    }
    const text = normalizeContentWhitespace(resolved);
    return text.length === 0 ? undefined : { kind: "text", text };
  }

  if (Node.isConditionalExpression(unwrapped)) {
    return resolveConditionalStaticText(unwrapped, context);
  }

  return undefined;
}

function resolveConditionalStaticText(
  expression: import("ts-morph").ConditionalExpression,
  context: StaticLinkContext,
): StaticTextValue | undefined {
  const whenTrue = resolveStaticTextExpression(
    expression.getWhenTrue(),
    context,
  );
  const whenFalse = resolveStaticTextExpression(
    expression.getWhenFalse(),
    context,
  );
  const literals = new Set<string>();
  collectLiteralStrings(whenTrue, literals);
  collectLiteralStrings(whenFalse, literals);
  if (literals.size === 0) {
    return undefined;
  }
  if (literals.size === 1) {
    return { kind: "text", text: [...literals][0] ?? "" };
  }
  return {
    kind: "alternatives",
    alternatives: [...literals].sort((left, right) =>
      left.localeCompare(right),
    ),
  };
}

function collectLiteralStrings(
  value: StaticTextValue | undefined,
  literals: Set<string>,
): void {
  if (value === undefined) {
    return;
  }
  if (value.kind === "text") {
    literals.add(value.text);
    return;
  }
  for (const alternative of value.alternatives) {
    literals.add(alternative);
  }
}

function resolveIdentifierString(
  identifier: import("ts-morph").Identifier,
  context: StaticLinkContext,
): string | undefined {
  const name = identifier.getText();
  const fromFn = context.functionBindings?.get(name);
  if (fromFn !== undefined) {
    return fromFn;
  }
  const fromMod = context.moduleBindings?.get(name);
  if (fromMod !== undefined) {
    return fromMod;
  }
  return undefined;
}

export function staticTextFromJsxChildren(
  children: readonly JsxChild[],
  context: StaticLinkContext,
): StaticTextValue | undefined {
  if (children.length === 1) {
    const only = children[0];
    if (only !== undefined && Node.isJsxExpression(only)) {
      const expression = only.getExpression();
      if (expression !== undefined) {
        return resolveStaticTextExpression(expression, context);
      }
      return undefined;
    }
  }

  const parts: string[] = [];
  for (const child of children) {
    if (Node.isJsxText(child)) {
      parts.push(child.getText());
      continue;
    }
    if (Node.isJsxExpression(child)) {
      const expression = child.getExpression();
      if (expression === undefined) {
        return undefined;
      }
      const resolved = resolveStaticTextExpression(expression, context);
      if (resolved === undefined || resolved.kind !== "text") {
        return undefined;
      }
      parts.push(resolved.text);
      continue;
    }
    if (Node.isJsxElement(child)) {
      const nested = staticTextFromJsxChildren(child.getJsxChildren(), context);
      if (nested === undefined || nested.kind !== "text") {
        return undefined;
      }
      parts.push(nested.text);
      continue;
    }
    if (Node.isJsxFragment(child)) {
      const nested = staticTextFromJsxChildren(child.getJsxChildren(), context);
      if (nested === undefined || nested.kind !== "text") {
        return undefined;
      }
      parts.push(nested.text);
    }
  }

  const text = normalizeContentWhitespace(parts.join(" "));
  return text.length === 0 ? undefined : { kind: "text", text };
}

function unwrapExpression(expression: Expression): Expression {
  let current = expression;
  while (
    Node.isParenthesizedExpression(current) ||
    Node.isAsExpression(current)
  ) {
    current = current.getExpression();
  }
  return current;
}

export function headingLevelFromTag(
  tagName: string,
): 1 | 2 | 3 | 4 | 5 | 6 | undefined {
  if (tagName === "h1") {
    return 1;
  }
  if (tagName === "h2") {
    return 2;
  }
  if (tagName === "h3") {
    return 3;
  }
  if (tagName === "h4") {
    return 4;
  }
  if (tagName === "h5") {
    return 5;
  }
  if (tagName === "h6") {
    return 6;
  }
  return undefined;
}

export const TEXT_HOST_TAGS = new Set([
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "p",
  "span",
  "div",
  "li",
  "blockquote",
  "figcaption",
  "dt",
  "dd",
  "small",
  "strong",
  "em",
  "label",
  "td",
  "th",
  "caption",
  "button",
  "a",
]);

export function isTextHostTag(tagName: string): boolean {
  return TEXT_HOST_TAGS.has(tagName);
}
