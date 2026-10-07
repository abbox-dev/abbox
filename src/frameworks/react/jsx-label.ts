import { type JsxChild, type JsxElement, Node } from "ts-morph";
import { staticStringFromJsxAttribute as staticStringFromAttributes } from "./jsx-static-attributes.js";

export function extractStaticLabel(
  element: JsxElement | import("ts-morph").JsxSelfClosingElement,
): string | undefined {
  const attributes = Node.isJsxElement(element)
    ? element.getOpeningElement().getAttributes()
    : element.getAttributes();
  const ariaLabel = staticStringFromAttributes(attributes, "aria-label");
  if (ariaLabel !== undefined) {
    return normalizeWhitespace(ariaLabel);
  }

  const title = staticStringFromAttributes(attributes, "title");
  if (title !== undefined) {
    return normalizeWhitespace(title);
  }

  if (!Node.isJsxElement(element)) {
    return undefined;
  }

  const text = collectStaticText(element.getJsxChildren());
  if (text === undefined) {
    return undefined;
  }
  const trimmed = normalizeWhitespace(text);
  return trimmed.length === 0 ? undefined : trimmed;
}

function collectStaticText(children: readonly JsxChild[]): string | undefined {
  const parts: string[] = [];
  for (const child of children) {
    if (Node.isJsxExpression(child)) {
      return undefined;
    }
    if (Node.isJsxText(child)) {
      parts.push(child.getText());
      continue;
    }
    if (Node.isJsxElement(child)) {
      const nested = collectStaticText(child.getJsxChildren());
      if (nested === undefined) {
        return undefined;
      }
      parts.push(nested);
      continue;
    }
    if (Node.isJsxFragment(child)) {
      const nested = collectStaticText(child.getJsxChildren());
      if (nested === undefined) {
        return undefined;
      }
      parts.push(nested);
    }
  }
  return parts.join(" ");
}

function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}
