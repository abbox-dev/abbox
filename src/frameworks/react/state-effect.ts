import { type Identifier, Node, type SourceFile, SyntaxKind } from "ts-morph";
import type { StateEffect } from "../../ir/product-ir.js";

const reactModule = "react";
const useStateExport = "useState";

export function stateEffectFromCall(
  call: import("ts-morph").CallExpression,
  sourceFile: SourceFile,
): StateEffect | undefined {
  const callee = call.getExpression();
  const args = call.getArguments();
  const argument = args[0];
  if (
    !Node.isIdentifier(callee) ||
    args.length !== 1 ||
    argument === undefined
  ) {
    return undefined;
  }

  const target = stateTarget(callee, sourceFile);
  if (target === undefined) {
    return undefined;
  }

  const effect: StateEffect = { kind: "state", target };
  const literal = literalValue(argument);
  if (literal !== undefined) {
    effect.value = literal.value;
  }
  return effect;
}

function stateTarget(
  setter: Identifier,
  sourceFile: SourceFile,
): string | undefined {
  const declaration = singleDeclaration(setter, sourceFile);
  if (declaration === undefined || !Node.isBindingElement(declaration)) {
    return undefined;
  }

  const pattern = declaration.getParent();
  if (!Node.isArrayBindingPattern(pattern)) {
    return undefined;
  }
  const variable = pattern.getParent();
  if (!Node.isVariableDeclaration(variable)) {
    return undefined;
  }
  if (pattern.getElements()[1] !== declaration) {
    return undefined;
  }

  const targetElement = pattern.getElements()[0];
  if (
    targetElement === undefined ||
    !Node.isBindingElement(targetElement) ||
    !Node.isIdentifier(targetElement.getNameNode())
  ) {
    return undefined;
  }

  const initializer = variable.getInitializer();
  if (initializer === undefined || !Node.isCallExpression(initializer)) {
    return undefined;
  }
  const callee = initializer.getExpression();
  if (
    !Node.isIdentifier(callee) ||
    !importedReactNames(sourceFile, useStateExport).has(callee.getText())
  ) {
    return undefined;
  }

  return targetElement.getNameNode().getText();
}

function literalValue(
  node: Node,
): { value: string | number | boolean | null } | undefined {
  if (Node.isStringLiteral(node)) {
    return { value: node.getLiteralText() };
  }
  if (Node.isNumericLiteral(node)) {
    return { value: node.getLiteralValue() };
  }
  if (node.getKind() === SyntaxKind.TrueKeyword) {
    return { value: true };
  }
  if (node.getKind() === SyntaxKind.FalseKeyword) {
    return { value: false };
  }
  if (node.getKind() === SyntaxKind.NullKeyword) {
    return { value: null };
  }
  if (Node.isPrefixUnaryExpression(node)) {
    const operand = node.getOperand();
    if (!Node.isNumericLiteral(operand)) {
      return undefined;
    }
    if (node.getOperatorToken() === SyntaxKind.MinusToken) {
      return { value: -operand.getLiteralValue() };
    }
    if (node.getOperatorToken() === SyntaxKind.PlusToken) {
      return { value: operand.getLiteralValue() };
    }
  }
  return undefined;
}

function importedReactNames(
  sourceFile: SourceFile,
  exportName: string,
): Set<string> {
  const names = new Set<string>();
  for (const declaration of sourceFile.getImportDeclarations()) {
    if (
      declaration.isTypeOnly() ||
      declaration.getModuleSpecifierValue() !== reactModule
    ) {
      continue;
    }
    for (const named of declaration.getNamedImports()) {
      if (named.isTypeOnly() || named.getName() !== exportName) {
        continue;
      }
      names.add(named.getAliasNode()?.getText() ?? named.getName());
    }
  }
  return names;
}

function singleDeclaration(
  identifier: Identifier,
  sourceFile: SourceFile,
): Node | undefined {
  const declarations = identifier.getSymbol()?.getDeclarations() ?? [];
  if (declarations.length !== 1) {
    return undefined;
  }
  const declaration = declarations[0];
  if (declaration === undefined || declaration.getSourceFile() !== sourceFile) {
    return undefined;
  }
  return declaration;
}
