import { Project } from "ts-morph";
import type { Navigation } from "../../ir/product-ir.js";
import { staticLinksInComponentBody } from "../tanstack/links.js";
import {
  directComponentImportsInFile,
  jsxDirectComponentLocalNames,
} from "./direct-component-imports.js";

export function collectComponentAttributedNavigation(
  projectRoot: string,
  screenFilePaths: readonly string[],
  screensByFile: Map<string, string[]>,
  knownRoutes: ReadonlySet<string>,
): Navigation[] {
  if (screenFilePaths.length === 0) {
    return [];
  }

  const project = new Project({
    skipAddingFilesFromTsConfig: true,
  });
  const edges = new Map<string, Navigation>();

  for (const filePath of screenFilePaths) {
    const routesInFile = screensByFile.get(filePath);
    if (routesInFile === undefined || routesInFile.length !== 1) {
      continue;
    }
    const from = routesInFile[0];
    if (from === undefined) {
      continue;
    }

    const sourceFile = project.addSourceFileAtPath(filePath);
    const directImports = directComponentImportsInFile(
      projectRoot,
      sourceFile,
      project,
    );
    const usedLocals = jsxDirectComponentLocalNames(sourceFile, directImports);

    for (const localName of usedLocals) {
      const entry = directImports.find((item) => item.localName === localName);
      if (entry === undefined) {
        continue;
      }

      const componentFile = project.addSourceFileAtPath(entry.resolvedFilePath);
      for (const to of staticLinksInComponentBody(
        componentFile,
        entry.exportName,
      )) {
        if (!knownRoutes.has(to)) {
          continue;
        }
        const key = `${from}\0${to}`;
        if (!edges.has(key)) {
          edges.set(key, { from, to });
        }
      }
    }
  }

  return [...edges.values()].sort((left, right) => {
    const byFrom = left.from.localeCompare(right.from);
    if (byFrom !== 0) {
      return byFrom;
    }
    return left.to.localeCompare(right.to);
  });
}
