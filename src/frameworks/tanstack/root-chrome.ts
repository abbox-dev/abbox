import { Node, Project, type SourceFile, SyntaxKind } from "ts-morph";
import { toProjectRelativePath } from "../../compiler/discover-source-files.js";
import type { GlobalNavigation } from "../../ir/product-ir.js";
import {
  type DirectComponentImport,
  directComponentImportsInFile,
} from "../react/direct-component-imports.js";
import { literalPropsForComponentUsage } from "../react/jsx-literal-props.js";
import { staticLinksInComponentBody } from "./links.js";
import { importedLocalNames } from "./named-import.js";

const createRootRouteNames = ["createRootRoute", "createRootRouteWithContext"];
const outletExportName = "Outlet";

export interface GlobalNavigationCandidate {
  chromeModulePath: string;
  chromeExportName: string;
  destinations: string[];
}

export function detectGlobalChromeCandidates(
  projectRoot: string,
  files: readonly string[],
  screenRouteFilePaths: ReadonlySet<string>,
): GlobalNavigationCandidate[] {
  if (files.length === 0) {
    return [];
  }

  const project = new Project({
    skipAddingFilesFromTsConfig: true,
  });

  const merged = new Map<string, GlobalNavigationCandidate>();

  for (const filePath of files) {
    const sourceFile = project.addSourceFileAtPath(filePath);
    const rootComponentName = primaryRootRouteComponentName(sourceFile);
    if (rootComponentName === undefined) {
      continue;
    }

    const rootFunction = findFunctionByName(sourceFile, rootComponentName);
    if (rootFunction === undefined) {
      continue;
    }

    const directImports = directComponentImportsInFile(
      projectRoot,
      sourceFile,
      project,
    );
    const importByLocal = new Map(
      directImports.map((entry) => [entry.localName, entry]),
    );

    const wrapper = chromeWrapperAroundOutlet(rootFunction, importByLocal);
    if (wrapper !== undefined) {
      addChromeCandidate(
        projectRoot,
        project,
        wrapper,
        sourceFile,
        screenRouteFilePaths,
        merged,
      );
    }

    for (const sibling of siblingChromeAroundOutlet(
      rootFunction,
      importByLocal,
    )) {
      addChromeCandidate(
        projectRoot,
        project,
        sibling,
        sourceFile,
        screenRouteFilePaths,
        merged,
      );
    }
  }

  return [...merged.values()].sort((left, right) => {
    const byPath = left.chromeModulePath.localeCompare(right.chromeModulePath);
    if (byPath !== 0) {
      return byPath;
    }
    return left.chromeExportName.localeCompare(right.chromeExportName);
  });
}

/** @deprecated internal alias for single-candidate callers during migration */
export function detectGlobalChromeCandidate(
  projectRoot: string,
  files: readonly string[],
  screenRouteFilePaths: ReadonlySet<string>,
): GlobalNavigationCandidate | undefined {
  const candidates = detectGlobalChromeCandidates(
    projectRoot,
    files,
    screenRouteFilePaths,
  );
  if (candidates.length !== 1) {
    return candidates.length === 0 ? undefined : candidates[0];
  }
  return candidates[0];
}

function addChromeCandidate(
  projectRoot: string,
  project: Project,
  importEntry: DirectComponentImport,
  rootSourceFile: SourceFile,
  screenRouteFilePaths: ReadonlySet<string>,
  merged: Map<string, GlobalNavigationCandidate>,
): void {
  if (
    chromeModuleImportedByScreenRoute(
      importEntry,
      screenRouteFilePaths,
      projectRoot,
      project,
    )
  ) {
    return;
  }

  const literalProps = literalPropsForComponentUsage(
    rootSourceFile,
    importEntry,
  );
  const componentFile = project.addSourceFileAtPath(
    importEntry.resolvedFilePath,
  );
  const destinations = staticLinksInComponentBody(
    componentFile,
    importEntry.exportName,
    literalProps,
  );
  if (destinations.length === 0) {
    return;
  }

  const key = `${importEntry.resolvedFilePath}\0${importEntry.exportName}`;
  const existing = merged.get(key);
  if (existing === undefined) {
    merged.set(key, {
      chromeModulePath: importEntry.resolvedFilePath,
      chromeExportName: importEntry.exportName,
      destinations: [...new Set(destinations)],
    });
  } else {
    const combined = new Set([...existing.destinations, ...destinations]);
    existing.destinations = [...combined];
  }
}

export function buildGlobalNavigationFromCandidates(
  projectRoot: string,
  candidates: readonly GlobalNavigationCandidate[],
  knownRoutes: ReadonlySet<string>,
): GlobalNavigation[] {
  const byDestination = new Map<string, GlobalNavigation>();

  for (const candidate of candidates) {
    const relativeFile = toProjectRelativePath(
      projectRoot,
      candidate.chromeModulePath,
    );
    for (const to of candidate.destinations) {
      if (!knownRoutes.has(to)) {
        continue;
      }
      const existing = byDestination.get(to);
      if (existing === undefined) {
        byDestination.set(to, {
          to,
          source: { file: relativeFile },
        });
      } else {
        const existingFile = existing.source.file;
        if (relativeFile.localeCompare(existingFile) < 0) {
          byDestination.set(to, {
            to,
            source: { file: relativeFile },
          });
        }
      }
    }
  }

  return [...byDestination.values()].sort((left, right) => {
    const byTo = left.to.localeCompare(right.to);
    if (byTo !== 0) {
      return byTo;
    }
    return left.source.file.localeCompare(right.source.file);
  });
}

export function buildGlobalNavigationFromCandidate(
  projectRoot: string,
  candidate: GlobalNavigationCandidate | undefined,
  knownRoutes: ReadonlySet<string>,
): GlobalNavigation[] {
  if (candidate === undefined) {
    return [];
  }
  return buildGlobalNavigationFromCandidates(
    projectRoot,
    [candidate],
    knownRoutes,
  );
}

function siblingChromeAroundOutlet(
  rootFunction: import("ts-morph").Node,
  importByLocal: Map<string, DirectComponentImport>,
): DirectComponentImport[] {
  const tanstackOutletNames = importedLocalNames(
    rootFunction.getSourceFile(),
    outletExportName,
  );
  const realOutlets = rootFunction
    .getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement)
    .filter((outlet) => {
      const tag = outlet.getTagNameNode();
      return Node.isIdentifier(tag) && tanstackOutletNames.has(tag.getText());
    });

  if (realOutlets.length !== 1) {
    return [];
  }

  const outlet = realOutlets[0];
  if (outlet === undefined) {
    return [];
  }
  const contentSlot = innermostJsxContainer(outlet, rootFunction);
  if (contentSlot === undefined) {
    return [];
  }

  const siblings: DirectComponentImport[] = [];
  for (const element of rootFunction.getDescendantsOfKind(
    SyntaxKind.JsxSelfClosingElement,
  )) {
    const tag = element.getTagNameNode();
    if (!Node.isIdentifier(tag)) {
      continue;
    }
    const entry = importByLocal.get(tag.getText());
    if (entry === undefined) {
      continue;
    }
    if (
      isDescendantOf(element, contentSlot) ||
      isDescendantOf(contentSlot, element)
    ) {
      continue;
    }
    siblings.push(entry);
  }
  for (const element of rootFunction.getDescendantsOfKind(
    SyntaxKind.JsxOpeningElement,
  )) {
    const tag = element.getTagNameNode();
    if (!Node.isIdentifier(tag)) {
      continue;
    }
    const entry = importByLocal.get(tag.getText());
    if (entry === undefined) {
      continue;
    }
    const jsxElement = element.getParent();
    if (jsxElement === undefined || !Node.isJsxElement(jsxElement)) {
      continue;
    }
    if (
      isDescendantOf(jsxElement, contentSlot) ||
      isDescendantOf(contentSlot, jsxElement)
    ) {
      continue;
    }
    siblings.push(entry);
  }

  return dedupeImports(siblings);
}

function innermostJsxContainer(
  outletNode: import("ts-morph").Node,
  rootFunction: import("ts-morph").Node,
):
  | import("ts-morph").JsxElement
  | import("ts-morph").JsxSelfClosingElement
  | undefined {
  let current: import("ts-morph").Node | undefined = outletNode.getParent();
  while (current !== undefined && current !== rootFunction) {
    if (Node.isJsxElement(current) || Node.isJsxSelfClosingElement(current)) {
      return current;
    }
    current = current.getParent();
  }
  return undefined;
}

function isDescendantOf(
  node: import("ts-morph").Node,
  ancestor: import("ts-morph").Node,
): boolean {
  let current: import("ts-morph").Node | undefined = node;
  while (current !== undefined) {
    if (current === ancestor) {
      return true;
    }
    current = current.getParent();
  }
  return false;
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
  rootFunction: import("ts-morph").Node,
  importByLocal: Map<string, DirectComponentImport>,
): DirectComponentImport | undefined {
  const outletNames = importedLocalNames(
    rootFunction.getSourceFile(),
    outletExportName,
  );
  if (outletNames.size === 0) {
    return undefined;
  }

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
