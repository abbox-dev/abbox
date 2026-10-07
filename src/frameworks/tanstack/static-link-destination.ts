import {
  Node,
  type SourceFile,
  SyntaxKind,
  VariableDeclarationKind,
} from "ts-morph";
import { fileRouteDestination } from "./file-routes.js";

export function absoluteRouteLiteral(text: string): string | undefined {
  if (text.length === 0 || !text.startsWith("/") || text.startsWith("//")) {
    return undefined;
  }
  return fileRouteDestination(text);
}

export type LiteralPropsMap = ReadonlyMap<string, readonly string[]>;

export interface StaticLinkContext {
  literalProps?: LiteralPropsMap;
  /** Module-level const bindings (route files / component modules). */
  moduleBindings?: ReadonlyMap<string, string>;
  /** Function-body const bindings enclosing the link expression. */
  functionBindings?: ReadonlyMap<string, string>;
  /** Static array literals for .map lowering: name -> array literal node */
  staticArrays?: ReadonlyMap<string, import("ts-morph").ArrayLiteralExpression>;
}

export function resolveLinkToDestinations(
  expression: import("ts-morph").Expression | undefined,
  context: StaticLinkContext,
): string[] {
  if (expression === undefined) {
    return [];
  }

  const raw = resolveToRouteStrings(expression, context);
  const out: string[] = [];
  for (const text of raw) {
    const route = absoluteRouteLiteral(text);
    if (route !== undefined) {
      out.push(route);
    }
  }
  return out;
}

export function resolveStaticStringExpressions(
  expression: import("ts-morph").Expression,
  context: StaticLinkContext,
): string[] {
  return resolveToRouteStrings(expression, context);
}

function resolveToRouteStrings(
  expression: import("ts-morph").Expression,
  context: StaticLinkContext,
): string[] {
  if (Node.isStringLiteral(expression)) {
    return [expression.getLiteralText()];
  }

  if (Node.isParenthesizedExpression(expression)) {
    return resolveToRouteStrings(expression.getExpression(), context);
  }

  if (Node.isAsExpression(expression)) {
    return resolveToRouteStrings(expression.getExpression(), context);
  }

  if (Node.isIdentifier(expression)) {
    const name = expression.getText();
    const destructuredMap = resolveLinkToDestinationsWithDestructuredMapParam(
      expression,
      context,
    );
    if (destructuredMap.length > 0) {
      return destructuredMap;
    }
    const fromProp = context.literalProps?.get(name);
    if (fromProp !== undefined && fromProp.length > 0) {
      return [...fromProp];
    }
    const fromFn = context.functionBindings?.get(name);
    if (fromFn !== undefined) {
      return [fromFn];
    }
    const fromMod = context.moduleBindings?.get(name);
    if (fromMod !== undefined) {
      return [fromMod];
    }
    return [];
  }

  if (Node.isPropertyAccessExpression(expression)) {
    const mapResult = resolveFromMapPropertyAccess(expression, context);
    if (mapResult.length > 0) {
      return mapResult;
    }
    if (
      Node.isIdentifier(expression.getExpression()) &&
      expression.getExpression().getText() === "props"
    ) {
      const propName = expression.getName();
      const fromProp = context.literalProps?.get(propName);
      if (fromProp !== undefined) {
        return [...fromProp];
      }
    }
    return [];
  }

  return [];
}

function resolveFromMapPropertyAccess(
  expression: import("ts-morph").PropertyAccessExpression,
  context: StaticLinkContext,
): string[] {
  const object = expression.getExpression();
  const propertyName = expression.getName();
  if (!Node.isIdentifier(object)) {
    return [];
  }
  const paramName = object.getText();
  const mapCall = findEnclosingArrayMapCall(expression, paramName);
  if (mapCall === undefined) {
    return [];
  }
  const mapExpr = mapCall.getExpression();
  if (
    !Node.isPropertyAccessExpression(mapExpr) ||
    mapExpr.getName() !== "map"
  ) {
    return [];
  }
  const arrayId = mapExpr.getExpression();
  if (!Node.isIdentifier(arrayId)) {
    return [];
  }
  const fromStatic = context.staticArrays?.get(arrayId.getText());
  if (fromStatic === undefined) {
    return [];
  }
  return stringLiteralsFromArrayObjects(fromStatic, propertyName);
}

function findEnclosingArrayMapCall(
  start: import("ts-morph").Node,
  paramName: string,
): import("ts-morph").CallExpression | undefined {
  let current: import("ts-morph").Node | undefined = start.getParent();
  while (current !== undefined) {
    if (Node.isCallExpression(current)) {
      const expr = current.getExpression();
      if (Node.isPropertyAccessExpression(expr) && expr.getName() === "map") {
        const callback = current.getArguments()[0];
        if (
          callback !== undefined &&
          mapCallbackBindsParam(callback, paramName)
        ) {
          return current;
        }
      }
    }
    current = current.getParent();
  }
  return undefined;
}

function mapCallbackBindsParam(
  callback: import("ts-morph").Node,
  paramName: string,
): boolean {
  if (!Node.isArrowFunction(callback)) {
    return false;
  }
  const params = callback.getParameters();
  if (params.length !== 1) {
    return false;
  }
  const param = params[0];
  if (param === undefined) {
    return false;
  }
  const paramNameNode = param.getNameNode();
  if (Node.isIdentifier(paramNameNode)) {
    return paramNameNode.getText() === paramName;
  }
  if (Node.isObjectBindingPattern(paramNameNode)) {
    for (const element of paramNameNode.getElements()) {
      const nameNode = element.getNameNode();
      if (Node.isIdentifier(nameNode) && nameNode.getText() === paramName) {
        return true;
      }
    }
  }
  return false;
}

function stringLiteralsFromArrayObjects(
  arrayLiteral: import("ts-morph").ArrayLiteralExpression,
  propertyName: string,
): string[] {
  const values: string[] = [];
  for (const element of arrayLiteral.getElements()) {
    if (!Node.isObjectLiteralExpression(element)) {
      continue;
    }
    const prop = element.getProperty(propertyName);
    if (prop === undefined || !Node.isPropertyAssignment(prop)) {
      continue;
    }
    const init = prop.getInitializer();
    if (init === undefined || !Node.isStringLiteral(init)) {
      continue;
    }
    values.push(init.getLiteralText());
  }
  return values;
}

/** Destructuring map: `.map(({ slug }) => <Link to={slug} />)` */
export function resolveLinkToDestinationsWithDestructuredMapParam(
  expression: import("ts-morph").Expression,
  context: StaticLinkContext,
): string[] {
  if (!Node.isIdentifier(expression)) {
    return [];
  }
  const paramName = expression.getText();
  const mapCall = findEnclosingArrayMapCall(expression, paramName);
  if (mapCall === undefined) {
    return [];
  }
  const mapExpr = mapCall.getExpression();
  if (
    !Node.isPropertyAccessExpression(mapExpr) ||
    mapExpr.getName() !== "map"
  ) {
    return [];
  }
  const arrayId = mapExpr.getExpression();
  if (!Node.isIdentifier(arrayId)) {
    return [];
  }
  const fromStatic = context.staticArrays?.get(arrayId.getText());
  if (fromStatic === undefined) {
    return [];
  }
  const callback = mapCall.getArguments()[0];
  if (callback === undefined || !Node.isArrowFunction(callback)) {
    return [];
  }
  const params = callback.getParameters();
  if (params.length !== 1) {
    return [];
  }
  const firstParam = params[0];
  if (firstParam === undefined) {
    return [];
  }
  const pattern = firstParam.getNameNode();
  if (!Node.isObjectBindingPattern(pattern)) {
    return [];
  }
  const binding = findBindingPropertyForIdentifier(pattern, paramName);
  if (binding === undefined) {
    return [];
  }
  return stringLiteralsFromArrayObjects(fromStatic, binding);
}

function findBindingPropertyForIdentifier(
  pattern: import("ts-morph").ObjectBindingPattern,
  identifierName: string,
): string | undefined {
  for (const element of pattern.getElements()) {
    const nameNode = element.getNameNode();
    if (!Node.isIdentifier(nameNode) || nameNode.getText() !== identifierName) {
      continue;
    }
    const propertyName = element.getPropertyNameNode();
    if (propertyName === undefined) {
      return identifierName;
    }
    if (Node.isIdentifier(propertyName)) {
      return propertyName.getText();
    }
  }
  return undefined;
}

export function literalFromJsxAttributeInitializer(
  initializer: import("ts-morph").Node | undefined,
): string | undefined {
  if (initializer === undefined) {
    return undefined;
  }
  if (Node.isStringLiteral(initializer)) {
    return initializer.getLiteralText();
  }
  if (
    Node.isJsxExpression(initializer) &&
    initializer.getExpression() !== undefined
  ) {
    const expression = initializer.getExpression();
    if (expression !== undefined && Node.isStringLiteral(expression)) {
      return expression.getLiteralText();
    }
  }
  return undefined;
}

export function buildModuleStaticIndex(sourceFile: SourceFile): {
  moduleBindings: Map<string, string>;
  staticArrays: Map<string, import("ts-morph").ArrayLiteralExpression>;
} {
  const moduleBindings = new Map<string, string>();
  const staticArrays = new Map<
    string,
    import("ts-morph").ArrayLiteralExpression
  >();

  for (const statement of sourceFile.getVariableStatements()) {
    if (statement.getDeclarationKind() !== VariableDeclarationKind.Const) {
      continue;
    }
    for (const declaration of statement.getDeclarations()) {
      if (!Node.isIdentifier(declaration.getNameNode())) {
        continue;
      }
      const id = declaration.getNameNode().getText();
      const initializer = declaration.getInitializer();
      if (initializer === undefined) {
        continue;
      }
      if (Node.isStringLiteral(initializer)) {
        moduleBindings.set(id, initializer.getLiteralText());
      } else if (Node.isArrayLiteralExpression(initializer)) {
        staticArrays.set(id, initializer);
      }
    }
  }
  return { moduleBindings, staticArrays };
}

export function buildFunctionConstBindings(
  functionBody: import("ts-morph").Node,
): Map<string, string> {
  const bindings = new Map<string, string>();
  collectConstBindingsInScope(functionBody, bindings, new Map());
  return bindings;
}

export function buildFunctionStaticArrays(
  functionBody: import("ts-morph").Node,
): Map<string, import("ts-morph").ArrayLiteralExpression> {
  const arrays = new Map<string, import("ts-morph").ArrayLiteralExpression>();
  collectConstBindingsInScope(functionBody, new Map(), arrays);
  return arrays;
}

function enclosingConstVariableStatement(
  declaration: import("ts-morph").VariableDeclaration,
): import("ts-morph").VariableStatement | undefined {
  let current: import("ts-morph").Node | undefined = declaration.getParent();
  while (current !== undefined) {
    if (Node.isVariableStatement(current)) {
      if (current.getDeclarationKind() === VariableDeclarationKind.Const) {
        return current;
      }
      return undefined;
    }
    current = current.getParent();
  }
  return undefined;
}

function collectConstBindingsInScope(
  scope: import("ts-morph").Node,
  stringBindings: Map<string, string>,
  arrayBindings: Map<string, import("ts-morph").ArrayLiteralExpression>,
): void {
  for (const statement of scope.getDescendantsOfKind(
    SyntaxKind.VariableDeclaration,
  )) {
    const variableStatement = enclosingConstVariableStatement(statement);
    if (variableStatement === undefined) {
      continue;
    }
    if (!Node.isIdentifier(statement.getNameNode())) {
      continue;
    }
    const id = statement.getNameNode().getText();
    const initializer = statement.getInitializer();
    if (initializer === undefined) {
      continue;
    }
    if (Node.isStringLiteral(initializer)) {
      stringBindings.set(id, initializer.getLiteralText());
    } else if (Node.isArrayLiteralExpression(initializer)) {
      arrayBindings.set(id, initializer);
    }
  }
}

export function mergeStaticLinkContext(
  base: StaticLinkContext,
  overrides: Partial<StaticLinkContext>,
): StaticLinkContext {
  return {
    literalProps: overrides.literalProps ?? base.literalProps,
    moduleBindings: overrides.moduleBindings ?? base.moduleBindings,
    functionBindings: overrides.functionBindings ?? base.functionBindings,
    staticArrays: overrides.staticArrays ?? base.staticArrays,
  };
}

export function contextForLinkNode(
  linkNode: import("ts-morph").Node,
  sourceFile: SourceFile,
  literalProps?: LiteralPropsMap,
): StaticLinkContext {
  const { moduleBindings, staticArrays: moduleArrays } =
    buildModuleStaticIndex(sourceFile);
  const staticArrays = new Map(moduleArrays);
  let functionBindings = new Map<string, string>();
  let current: import("ts-morph").Node | undefined = linkNode;
  while (current !== undefined && current !== sourceFile) {
    if (
      Node.isFunctionDeclaration(current) ||
      Node.isArrowFunction(current) ||
      Node.isFunctionExpression(current)
    ) {
      functionBindings = buildFunctionConstBindings(current);
      for (const [key, value] of buildFunctionStaticArrays(current)) {
        staticArrays.set(key, value);
      }
      break;
    }
    current = current.getParent();
  }
  return {
    literalProps,
    moduleBindings,
    functionBindings,
    staticArrays,
  };
}
