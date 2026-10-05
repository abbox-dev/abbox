import { type Expression, type JsxAttributeLike, Node } from "ts-morph";

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
  return recognizedHandlerExpression(attributes, name) !== undefined;
}

export function recognizedHandlerExpression(
  attributes: readonly JsxAttributeLike[],
  name: HandlerAttributeName,
): Expression | undefined {
  const attribute = findJsxAttribute(attributes, name);
  if (attribute === undefined) {
    return undefined;
  }
  return handlerExpressionFromInitializer(attribute.getInitializer());
}

function handlerExpressionFromInitializer(
  initializer: JsxAttributeInitializer,
): Expression | undefined {
  if (initializer === undefined || !Node.isJsxExpression(initializer)) {
    return undefined;
  }
  const expression = initializer.getExpression();
  if (expression === undefined) {
    return undefined;
  }
  if (
    Node.isIdentifier(expression) ||
    Node.isArrowFunction(expression) ||
    Node.isFunctionExpression(expression)
  ) {
    return expression;
  }
  return undefined;
}
