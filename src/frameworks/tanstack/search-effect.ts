import { Node, type ObjectLiteralExpression, type SourceFile } from "ts-morph";
import type { SearchEffect } from "../../ir/product-ir.js";
import { isTanStackNavigateBinding } from "./navigate-binding.js";

export function searchEffectFromCall(
  call: import("ts-morph").CallExpression,
  sourceFile: SourceFile,
): SearchEffect | undefined {
  const callee = call.getExpression();
  const args = call.getArguments();
  const argument = args[0];
  if (
    !Node.isIdentifier(callee) ||
    args.length !== 1 ||
    argument === undefined ||
    !Node.isObjectLiteralExpression(argument) ||
    !isTanStackNavigateBinding(callee, sourceFile) ||
    !isCurrentDestinationSearch(argument)
  ) {
    return undefined;
  }
  return { kind: "search" };
}

function isCurrentDestinationSearch(object: ObjectLiteralExpression): boolean {
  let hasSearch = false;
  let toStaysHere = true;
  for (const property of object.getProperties()) {
    if (
      !Node.isPropertyAssignment(property) &&
      !Node.isShorthandPropertyAssignment(property)
    ) {
      return false;
    }
    const name = staticPropertyName(property);
    if (name === undefined) {
      return false;
    }
    if (name === "search") {
      hasSearch = true;
    }
    if (name === "to" && !isDotLiteral(property)) {
      toStaysHere = false;
    }
  }
  return hasSearch && toStaysHere;
}

function isDotLiteral(
  property:
    | import("ts-morph").PropertyAssignment
    | import("ts-morph").ShorthandPropertyAssignment,
): boolean {
  if (!Node.isPropertyAssignment(property)) {
    return false;
  }
  const initializer = property.getInitializer();
  return (
    initializer !== undefined &&
    Node.isStringLiteral(initializer) &&
    initializer.getLiteralText() === "."
  );
}

function staticPropertyName(
  property:
    | import("ts-morph").PropertyAssignment
    | import("ts-morph").ShorthandPropertyAssignment,
): string | undefined {
  const name = property.getNameNode();
  if (Node.isIdentifier(name)) {
    return name.getText();
  }
  if (Node.isStringLiteral(name)) {
    return name.getLiteralText();
  }
  return undefined;
}
