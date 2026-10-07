import { Project } from "ts-morph";
import { exportedComponentBody } from "../tanstack/links.js";
import {
  directComponentImportsInFile,
  jsxDirectComponentLocalNames,
} from "./direct-component-imports.js";
import {
  candidatesInExportBody,
  type InteractionCandidate,
} from "./interactions.js";

export function collectComponentAttributedInteractionCandidates(
  projectRoot: string,
  screenFilePaths: readonly string[],
  screensByFile: Map<string, string[]>,
  knownRoutes: ReadonlySet<string>,
): InteractionCandidate[] {
  if (screenFilePaths.length === 0) {
    return [];
  }

  const project = new Project({
    skipAddingFilesFromTsConfig: true,
  });
  const candidates: InteractionCandidate[] = [];

  for (const routeFilePath of screenFilePaths) {
    const routesInFile = screensByFile.get(routeFilePath);
    if (routesInFile === undefined || routesInFile.length !== 1) {
      continue;
    }

    const routeSourceFile = project.addSourceFileAtPath(routeFilePath);
    const directImports = directComponentImportsInFile(
      projectRoot,
      routeSourceFile,
      project,
    );
    const usedLocals = jsxDirectComponentLocalNames(
      routeSourceFile,
      directImports,
    );

    for (const localName of usedLocals) {
      const entry = directImports.find((item) => item.localName === localName);
      if (entry === undefined) {
        continue;
      }

      const componentFile = project.addSourceFileAtPath(entry.resolvedFilePath);
      if (
        exportedComponentBody(componentFile, entry.exportName) === undefined
      ) {
        continue;
      }

      candidates.push(
        ...candidatesInExportBody(
          componentFile,
          entry.exportName,
          routeFilePath,
          knownRoutes,
          localName,
        ),
      );
    }
  }

  return candidates;
}
