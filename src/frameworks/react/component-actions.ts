import { Project } from "ts-morph";
import { exportedComponentBody } from "../tanstack/links.js";
import { type ActionCandidate, candidatesInExportBody } from "./actions.js";
import {
  directComponentImportsInFile,
  jsxDirectComponentLocalNames,
} from "./direct-component-imports.js";

export function collectComponentAttributedActionCandidates(
  projectRoot: string,
  screenFilePaths: readonly string[],
  screensByFile: Map<string, string[]>,
  knownRoutes: ReadonlySet<string>,
  nextIndex: () => number,
): ActionCandidate[] {
  if (screenFilePaths.length === 0) {
    return [];
  }

  const project = new Project({
    skipAddingFilesFromTsConfig: true,
  });
  const candidates: ActionCandidate[] = [];

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

    const attributedForRoute: ActionCandidate[] = [];

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

      attributedForRoute.push(
        ...candidatesInExportBody(
          componentFile,
          entry.exportName,
          routeFilePath,
          knownRoutes,
          nextIndex,
        ),
      );
    }

    candidates.push(...dedupeAttributedForRoute(attributedForRoute));
  }

  return candidates;
}

function dedupeAttributedForRoute(
  candidates: readonly ActionCandidate[],
): ActionCandidate[] {
  const byKey = new Map<string, ActionCandidate>();
  for (const candidate of candidates) {
    const key = `${candidate.kind}\0${candidate.label ?? ""}`;
    const existing = byKey.get(key);
    if (
      existing === undefined ||
      candidate.discoveryIndex < existing.discoveryIndex
    ) {
      byKey.set(key, candidate);
    }
  }
  return [...byKey.values()];
}
