import { type JsxChild, type JsxElement, Node } from "ts-morph";

type JsxAttributeInitializer = ReturnType<
  import("ts-morph").JsxAttribute["getInitializer"]
>;

export function extractStaticLabel(
  element: JsxElement | import("ts-morph").JsxSelfClosingElement,
): string | undefined {
  const attributes = Node.isJsxElement(element)
    ? element.getOpeningElement().getAttributes()
    : element.getAttributes();
  const ariaLabel = ariaLabelFromAttributes(attributes);
  if (ariaLabel !== undefined) {
    return ariaLabel;
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

function ariaLabelFromAttributes(
  attributes: readonly import("ts-morph").JsxAttributeLike[],
): string | undefined {
  for (const attribute of attributes) {
    if (
      !Node.isJsxAttribute(attribute) ||
      attribute.getNameNode().getText() !== "aria-label"
    ) {
      continue;
    }
    const literal = stringLiteralFromAttributeValue(attribute.getInitializer());
    if (literal !== undefined) {
      return normalizeWhitespace(literal);
    }
  }
  return undefined;
}

function stringLiteralFromAttributeValue(
  value: JsxAttributeInitializer,
): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (Node.isStringLiteral(value)) {
    return value.getLiteralText();
  }
  if (Node.isJsxExpression(value)) {
    const expression = value.getExpression();
    if (expression !== undefined && Node.isStringLiteral(expression)) {
      return expression.getLiteralText();
    }
  }
  return undefined;
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
