import { Node, Project, type SourceFile, SyntaxKind } from "ts-morph";
import { toProjectRelativePath } from "../../compiler/discover-source-files.js";
import type { GlobalNavigation } from "../../ir/product-ir.js";
import {
  type DirectComponentImport,
  directComponentImportsInFile,
} from "../react/direct-component-imports.js";
import { staticLinksInComponentBody } from "./links.js";
import { importedLocalNames } from "./named-import.js";

const createRootRouteNames = ["createRootRoute", "createRootRouteWithContext"];
const outletExportName = "Outlet";

export interface GlobalNavigationCandidate {
  chromeModulePath: string;
  chromeExportName: string;
  destinations: string[];
}

export function detectGlobalChromeCandidate(
  projectRoot: string,
  files: readonly string[],
  screenRouteFilePaths: ReadonlySet<string>,
): GlobalNavigationCandidate | undefined {
  if (files.length === 0) {
    return undefined;
  }

  const project = new Project({
    skipAddingFilesFromTsConfig: true,
  });

  const candidates: GlobalNavigationCandidate[] = [];

  for (const filePath of files) {
    const sourceFile = project.addSourceFileAtPath(filePath);
    const rootComponentName = primaryRootRouteComponentName(sourceFile);
    if (rootComponentName === undefined) {
      continue;
    }

    const wrapper = chromeWrapperAroundOutlet(
      projectRoot,
      sourceFile,
      rootComponentName,
      project,
    );
    if (wrapper === undefined) {
      continue;
    }

    if (
      chromeModuleImportedByScreenRoute(
        wrapper,
        screenRouteFilePaths,
        projectRoot,
        project,
      )
    ) {
      continue;
    }

    const componentFile = project.addSourceFileAtPath(wrapper.resolvedFilePath);
    const destinations = staticLinksInComponentBody(
      componentFile,
      wrapper.exportName,
    );
    if (destinations.length === 0) {
      continue;
    }

    candidates.push({
      chromeModulePath: wrapper.resolvedFilePath,
      chromeExportName: wrapper.exportName,
      destinations,
    });
  }

  if (candidates.length !== 1) {
    return undefined;
  }
  return candidates[0];
}

export function buildGlobalNavigationFromCandidate(
  projectRoot: string,
  candidate: GlobalNavigationCandidate | undefined,
  knownRoutes: ReadonlySet<string>,
): GlobalNavigation[] {
  if (candidate === undefined) {
    return [];
  }

  const byDestination = new Map<string, GlobalNavigation>();
  const relativeFile = toProjectRelativePath(
    projectRoot,
    candidate.chromeModulePath,
  );

  for (const to of candidate.destinations) {
    if (!knownRoutes.has(to)) {
      continue;
    }
    if (!byDestination.has(to)) {
      byDestination.set(to, {
        to,
        source: { file: relativeFile },
      });
    }
  }

  return [...byDestination.values()].sort((left, right) =>
    left.to.localeCompare(right.to),
  );
}

function chromeModuleImportedByScreenRoute(
  wrapper: DirectComponentImport,
  screenRouteFilePaths: ReadonlySet<string>,
  projectRoot: string,
  project: Project,
): boolean {
  for (const screenPath of screenRouteFilePaths) {
    const sourceFile = project.addSourceFileAtPath(screenPath);
    const imports = directComponentImportsInFile(
      projectRoot,
      sourceFile,
      project,
    );
    if (
      imports.some(
        (entry) => entry.resolvedFilePath === wrapper.resolvedFilePath,
      )
    ) {
      return true;
    }
  }
  return false;
}

function primaryRootRouteComponentName(
  sourceFile: SourceFile,
): string | undefined {
  const rootFactoryNames = importedRootRouteFactoryNames(sourceFile);
  if (rootFactoryNames.size === 0) {
    return undefined;
  }

  for (const statement of sourceFile.getVariableStatements()) {
    for (const declaration of statement.getDeclarations()) {
      const componentName = componentFromRootRouteInitializer(
        declaration.getInitializer(),
        rootFactoryNames,
      );
      if (componentName !== undefined) {
        return componentName;
      }
    }
  }
  return undefined;
}

function importedRootRouteFactoryNames(sourceFile: SourceFile): Set<string> {
  const names = new Set<string>();
  for (const declaration of sourceFile.getImportDeclarations()) {
    if (
      declaration.isTypeOnly() ||
      declaration.getModuleSpecifierValue() !== "@tanstack/react-router"
    ) {
      continue;
    }
    for (const named of declaration.getNamedImports()) {
      if (named.isTypeOnly()) {
        continue;
      }
      if (createRootRouteNames.includes(named.getName())) {
        names.add(named.getAliasNode()?.getText() ?? named.getName());
      }
    }
  }
  return names;
}

function componentFromRootRouteInitializer(
  initializer: import("ts-morph").Expression | undefined,
  rootFactoryNames: Set<string>,
): string | undefined {
  if (initializer === undefined || !Node.isCallExpression(initializer)) {
    return undefined;
  }

  const config = rootRouteConfigObject(initializer, rootFactoryNames);
  if (config === undefined) {
    return undefined;
  }

  const componentProp = config.getProperty("component");
  if (
    componentProp === undefined ||
    !Node.isPropertyAssignment(componentProp)
  ) {
    return undefined;
  }

  const componentInit = componentProp.getInitializer();
  if (componentInit === undefined || !Node.isIdentifier(componentInit)) {
    return undefined;
  }

  return componentInit.getText();
}

function rootRouteConfigObject(
  call: import("ts-morph").CallExpression,
  rootFactoryNames: Set<string>,
): import("ts-morph").ObjectLiteralExpression | undefined {
  const args = call.getArguments();
  const firstArg = args[0];
  if (firstArg !== undefined && Node.isObjectLiteralExpression(firstArg)) {
    if (callExpressionUsesRootFactory(call, rootFactoryNames)) {
      return firstArg;
    }
  }

  const callee = call.getExpression();
  if (Node.isCallExpression(callee)) {
    return rootRouteConfigObject(callee, rootFactoryNames);
  }

  return undefined;
}

function callExpressionUsesRootFactory(
  call: import("ts-morph").CallExpression,
  rootFactoryNames: Set<string>,
): boolean {
  let current: import("ts-morph").Expression = call;
  while (Node.isCallExpression(current)) {
    if (isRootFactoryCall(current, rootFactoryNames)) {
      return true;
    }
    current = current.getExpression();
  }
  return Node.isIdentifier(current) && rootFactoryNames.has(current.getText());
}

function isRootFactoryCall(
  call: import("ts-morph").CallExpression,
  rootFactoryNames: Set<string>,
): boolean {
  const expression = call.getExpression();
  if (Node.isIdentifier(expression)) {
    return rootFactoryNames.has(expression.getText());
  }
  if (Node.isCallExpression(expression)) {
    const inner = expression.getExpression();
    if (Node.isIdentifier(inner)) {
      return rootFactoryNames.has(inner.getText());
    }
  }
  return false;
}

function chromeWrapperAroundOutlet(
  projectRoot: string,
  sourceFile: SourceFile,
  rootComponentName: string,
  project: Project,
): DirectComponentImport | undefined {
  const rootFunction = findFunctionByName(sourceFile, rootComponentName);
  if (rootFunction === undefined) {
    return undefined;
  }

  const outletNames = importedLocalNames(sourceFile, outletExportName);
  if (outletNames.size === 0) {
    return undefined;
  }

  const directImports = directComponentImportsInFile(
    projectRoot,
    sourceFile,
    project,
  );
  const importByLocal = new Map(
    directImports.map((entry) => [entry.localName, entry]),
  );

  const wrappers: DirectComponentImport[] = [];

  for (const outlet of rootFunction.getDescendantsOfKind(
    SyntaxKind.JsxSelfClosingElement,
  )) {
    const tag = outlet.getTagNameNode();
    if (!Node.isIdentifier(tag) || !outletNames.has(tag.getText())) {
      continue;
    }
    const wrapper = innermostImportedWrapper(
      outlet,
      importByLocal,
      rootFunction,
    );
    if (wrapper !== undefined) {
      wrappers.push(wrapper);
    }
  }

  const unique = dedupeImports(wrappers);
  if (unique.length !== 1) {
    return undefined;
  }
  return unique[0];
}

function innermostImportedWrapper(
  outletNode: import("ts-morph").Node,
  importByLocal: Map<string, DirectComponentImport>,
  rootFunction: import("ts-morph").Node,
): DirectComponentImport | undefined {
  let current: import("ts-morph").Node | undefined = outletNode.getParent();
  while (current !== undefined && current !== rootFunction) {
    if (Node.isJsxElement(current)) {
      const tag = current.getOpeningElement().getTagNameNode();
      if (Node.isIdentifier(tag)) {
        const entry = importByLocal.get(tag.getText());
        if (entry !== undefined) {
          return entry;
        }
      }
    }
    current = current.getParent();
  }
  return undefined;
}

function dedupeImports(
  imports: DirectComponentImport[],
): DirectComponentImport[] {
  const seen = new Map<string, DirectComponentImport>();
  for (const entry of imports) {
    const key = `${entry.resolvedFilePath}\0${entry.exportName}`;
    if (!seen.has(key)) {
      seen.set(key, entry);
    }
  }
  return [...seen.values()];
}

function findFunctionByName(
  sourceFile: SourceFile,
  name: string,
):
  | import("ts-morph").FunctionDeclaration
  | import("ts-morph").ArrowFunction
  | import("ts-morph").FunctionExpression
  | undefined {
  for (const declaration of sourceFile.getFunctions()) {
    if (declaration.getName() === name) {
      return declaration;
    }
  }
  for (const statement of sourceFile.getVariableStatements()) {
    for (const declaration of statement.getDeclarations()) {
      if (declaration.getName() !== name) {
        continue;
      }
      const initializer = declaration.getInitializer();
      if (
        initializer !== undefined &&
        (Node.isArrowFunction(initializer) ||
          Node.isFunctionExpression(initializer))
      ) {
        return initializer;
      }
    }
  }
  return undefined;
}
