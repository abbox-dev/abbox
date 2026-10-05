import {
  type Identifier,
  Node,
  type ObjectLiteralExpression,
  type SourceFile,
} from "ts-morph";
import type { SearchEffect } from "../../ir/product-ir.js";
import { importedLocalNames } from "./named-import.js";

const createFileRouteName = "createFileRoute";
const useNavigateExport = "useNavigate";

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
    !isNavigateBinding(callee, sourceFile) ||
    !isCurrentDestinationSearch(argument)
  ) {
    return undefined;
  }
  return { kind: "search" };
}

function isNavigateBinding(
  identifier: Identifier,
  sourceFile: SourceFile,
): boolean {
  const declaration = singleVariableDeclaration(identifier, sourceFile);
  const initializer = declaration?.getInitializer();
  if (initializer === undefined || !Node.isCallExpression(initializer)) {
    return false;
  }
  return isNavigateFactory(initializer, sourceFile);
}

function isNavigateFactory(
  call: import("ts-morph").CallExpression,
  sourceFile: SourceFile,
): boolean {
  const expression = call.getExpression();
  if (Node.isIdentifier(expression)) {
    return importedLocalNames(sourceFile, useNavigateExport).has(
      expression.getText(),
    );
  }
  if (!Node.isPropertyAccessExpression(expression)) {
    return false;
  }
  const object = expression.getExpression();
  return (
    expression.getName() === useNavigateExport &&
    Node.isIdentifier(object) &&
    isCreateFileRouteBinding(object, sourceFile)
  );
}

function isCreateFileRouteBinding(
  identifier: Identifier,
  sourceFile: SourceFile,
): boolean {
  const declaration = singleVariableDeclaration(identifier, sourceFile);
  const initializer = declaration?.getInitializer();
  if (initializer === undefined || !Node.isCallExpression(initializer)) {
    return false;
  }
  const factory = initializer.getExpression();
  if (!Node.isCallExpression(factory)) {
    return false;
  }
  const callee = factory.getExpression();
  const routeId = factory.getArguments()[0];
  return (
    factory.getArguments().length === 1 &&
    routeId !== undefined &&
    Node.isStringLiteral(routeId) &&
    Node.isIdentifier(callee) &&
    importedLocalNames(sourceFile, createFileRouteName).has(callee.getText())
  );
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

function singleVariableDeclaration(
  identifier: Identifier,
  sourceFile: SourceFile,
): import("ts-morph").VariableDeclaration | undefined {
  const declarations = identifier.getSymbol()?.getDeclarations() ?? [];
  if (declarations.length !== 1) {
    return undefined;
  }
  const declaration = declarations[0];
  if (
    declaration === undefined ||
    declaration.getSourceFile() !== sourceFile ||
    !Node.isVariableDeclaration(declaration)
  ) {
    return undefined;
  }
  return declaration;
}
