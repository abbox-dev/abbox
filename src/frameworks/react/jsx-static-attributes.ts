import { type JsxAttributeLike, Node } from "ts-morph";

export function staticStringFromJsxAttribute(
  attributes: readonly JsxAttributeLike[],
  name: string,
): string | undefined {
  for (const attribute of attributes) {
    if (
      !Node.isJsxAttribute(attribute) ||
      attribute.getNameNode().getText() !== name
    ) {
      continue;
    }
    const initializer = attribute.getInitializer();
    if (initializer === undefined) {
      return undefined;
    }
    if (Node.isStringLiteral(initializer)) {
      return initializer.getLiteralText();
    }
    if (Node.isJsxExpression(initializer)) {
      const expression = initializer.getExpression();
      if (expression !== undefined && Node.isStringLiteral(expression)) {
        return expression.getLiteralText();
      }
    }
  }
  return undefined;
}

export function isProvablyDisabled(
  attributes: readonly JsxAttributeLike[],
): boolean {
  for (const attribute of attributes) {
    if (
      !Node.isJsxAttribute(attribute) ||
      attribute.getNameNode().getText() !== "disabled"
    ) {
      continue;
    }
    const initializer = attribute.getInitializer();
    if (initializer === undefined) {
      return true;
    }
    if (Node.isJsxExpression(initializer)) {
      const expression = initializer.getExpression();
      if (expression !== undefined && Node.isTrueLiteral(expression)) {
        return true;
      }
    }
  }
  return false;
}
