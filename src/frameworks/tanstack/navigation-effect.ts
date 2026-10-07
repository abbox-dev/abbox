import { Node, type SourceFile } from "ts-morph";
import type { NavigationEffect } from "../../ir/product-ir.js";
import { isTanStackNavigateBinding } from "./navigate-binding.js";
import { absoluteRouteLiteral } from "./static-link-destination.js";

export function navigationEffectFromCall(
  call: import("ts-morph").CallExpression,
  sourceFile: SourceFile,
  knownRoutes: ReadonlySet<string>,
): NavigationEffect | undefined {
  const callee = call.getExpression();
  const args = call.getArguments();
  const argument = args[0];
  if (
    !Node.isIdentifier(callee) ||
    args.length !== 1 ||
    argument === undefined ||
    !Node.isObjectLiteralExpression(argument) ||
    !isTanStackNavigateBinding(callee, sourceFile)
  ) {
    return undefined;
  }

  const toRoute = staticNavigateToRoute(argument);
  if (toRoute === undefined || !knownRoutes.has(toRoute)) {
    return undefined;
  }

  return { kind: "navigation", to: toRoute };
}

function staticNavigateToRoute(
  object: import("ts-morph").ObjectLiteralExpression,
): string | undefined {
  for (const property of object.getProperties()) {
    if (
      !Node.isPropertyAssignment(property) &&
      !Node.isShorthandPropertyAssignment(property)
    ) {
      continue;
    }
    const name = staticPropertyName(property);
    if (name !== "to") {
      continue;
    }
    if (!Node.isPropertyAssignment(property)) {
      return undefined;
    }
    const initializer = property.getInitializer();
    if (initializer === undefined || !Node.isStringLiteral(initializer)) {
      return undefined;
    }
    const text = initializer.getLiteralText();
    if (text === ".") {
      return undefined;
    }
    const route = absoluteRouteLiteral(text);
    return route;
  }
  return undefined;
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
