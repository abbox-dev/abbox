import { type Identifier, Node, type SourceFile } from "ts-morph";
import { importedLocalNames } from "./named-import.js";

const createFileRouteName = "createFileRoute";
const useNavigateExport = "useNavigate";

export function isTanStackNavigateBinding(
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
