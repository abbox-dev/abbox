import {
  type ArrowFunction,
  type CallExpression,
  type Expression,
  type FunctionDeclaration,
  type FunctionExpression,
  type Identifier,
  Node,
  type SourceFile,
} from "ts-morph";
import type { Effect } from "../../ir/product-ir.js";
import { navigationEffectFromCall } from "../tanstack/navigation-effect.js";
import { searchEffectFromCall } from "../tanstack/search-effect.js";
import { stateEffectFromCall } from "./state-effect.js";

type AnalyzedFunction =
  | ArrowFunction
  | FunctionExpression
  | FunctionDeclaration;

export function effectsFromHandler(
  sourceFile: SourceFile,
  handler: Expression,
  knownRoutes: ReadonlySet<string> = new Set(),
): Effect[] {
  const analyzed = analyzedFunction(handler, sourceFile);
  if (analyzed === undefined) {
    return [];
  }

  const effects: Effect[] = [];
  for (const call of directCalls(analyzed)) {
    const state = stateEffectFromCall(call, sourceFile);
    if (state !== undefined) {
      effects.push(state);
      continue;
    }
    const search = searchEffectFromCall(call, sourceFile);
    if (search !== undefined) {
      effects.push(search);
      continue;
    }
    const navigation = navigationEffectFromCall(call, sourceFile, knownRoutes);
    if (navigation !== undefined) {
      effects.push(navigation);
    }
  }
  return effects;
}

function analyzedFunction(
  handler: Expression,
  sourceFile: SourceFile,
): AnalyzedFunction | undefined {
  if (Node.isArrowFunction(handler) || Node.isFunctionExpression(handler)) {
    return handler;
  }
  if (!Node.isIdentifier(handler)) {
    return undefined;
  }
  return sameFileFunction(handler, sourceFile);
}

function sameFileFunction(
  identifier: Identifier,
  sourceFile: SourceFile,
): AnalyzedFunction | undefined {
  const declarations = identifier.getSymbol()?.getDeclarations() ?? [];
  if (declarations.length !== 1) {
    return undefined;
  }
  const declaration = declarations[0];
  if (declaration === undefined || declaration.getSourceFile() !== sourceFile) {
    return undefined;
  }
  if (Node.isFunctionDeclaration(declaration)) {
    return declaration;
  }
  if (!Node.isVariableDeclaration(declaration)) {
    return undefined;
  }
  const initializer = declaration.getInitializer();
  if (
    initializer !== undefined &&
    (Node.isArrowFunction(initializer) ||
      Node.isFunctionExpression(initializer))
  ) {
    return initializer;
  }
  return undefined;
}

function directCalls(fn: AnalyzedFunction): CallExpression[] {
  if (Node.isArrowFunction(fn)) {
    const body = fn.getBody();
    if (!Node.isBlock(body)) {
      if (!Node.isExpression(body)) {
        return [];
      }
      const expression = unwrapParentheses(body);
      return Node.isCallExpression(expression) ? [expression] : [];
    }
  }

  const body = fn.getBody();
  if (body === undefined || !Node.isBlock(body)) {
    return [];
  }

  const calls: CallExpression[] = [];
  for (const statement of body.getStatements()) {
    if (!Node.isExpressionStatement(statement)) {
      continue;
    }
    const expression = unwrapParentheses(statement.getExpression());
    if (Node.isCallExpression(expression)) {
      calls.push(expression);
    }
  }
  return calls;
}

function unwrapParentheses(expression: Expression): Expression {
  let current = expression;
  while (Node.isParenthesizedExpression(current)) {
    current = current.getExpression();
  }
  return current;
}
