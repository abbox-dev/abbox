import { Project } from "ts-morph";
import { exportedComponentBody } from "../tanstack/links.js";
import {
  type ContentCandidate,
  collectContentInExportBody,
} from "./content-candidates.js";
import {
  directComponentImportsInFile,
  jsxDirectComponentLocalNames,
} from "./direct-component-imports.js";

export function collectComponentAttributedContentCandidates(
  projectRoot: string,
  screenFilePaths: readonly string[],
  screensByFile: Map<string, string[]>,
): ContentCandidate[] {
  if (screenFilePaths.length === 0) {
    return [];
  }

  const project = new Project({
    skipAddingFilesFromTsConfig: true,
  });
  const candidates: ContentCandidate[] = [];

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
        ...collectContentInExportBody(
          componentFile,
          entry.exportName,
          routeFilePath,
          localName,
        ),
      );
    }
  }

  return candidates;
}
