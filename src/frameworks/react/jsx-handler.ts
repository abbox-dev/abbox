import { type JsxAttributeLike, Node } from "ts-morph";

type JsxAttributeInitializer = ReturnType<
  import("ts-morph").JsxAttribute["getInitializer"]
>;

export type HandlerAttributeName = "onClick" | "onSubmit";

export function findJsxAttribute(
  attributes: readonly JsxAttributeLike[],
  name: HandlerAttributeName,
): import("ts-morph").JsxAttribute | undefined {
  for (const attribute of attributes) {
    if (
      Node.isJsxAttribute(attribute) &&
      attribute.getNameNode().getText() === name
    ) {
      return attribute;
    }
  }
  return undefined;
}

export function hasRecognizedHandler(
  attributes: readonly JsxAttributeLike[],
  name: HandlerAttributeName,
): boolean {
  const attribute = findJsxAttribute(attributes, name);
  if (attribute === undefined) {
    return false;
  }
  return isRecognizedHandlerInitializer(attribute.getInitializer());
}

function isRecognizedHandlerInitializer(
  initializer: JsxAttributeInitializer,
): boolean {
  if (initializer === undefined) {
    return false;
  }
  if (!Node.isJsxExpression(initializer)) {
    return false;
  }
  const expression = initializer.getExpression();
  if (expression === undefined) {
    return false;
  }
  if (Node.isIdentifier(expression)) {
    return true;
  }
  if (Node.isArrowFunction(expression)) {
    return true;
  }
  if (Node.isFunctionExpression(expression)) {
    return true;
  }
  return false;
}
