import { statSync } from "node:fs";
import path from "node:path";
import { extractDesignSystem } from "../frameworks/css/theme-colors.js";
import {
  type ActionCandidate,
  collectActionCandidates,
} from "../frameworks/react/actions.js";
import { collectComponentAttributedActionCandidates } from "../frameworks/react/component-actions.js";
import { collectComponentAttributedNavigation } from "../frameworks/react/component-navigation.js";
import { collectFileRouteScreens } from "../frameworks/tanstack/file-routes.js";
import { collectScopedStaticLinks } from "../frameworks/tanstack/links.js";
import {
  buildGlobalNavigationFromCandidate,
  detectGlobalChromeCandidate,
} from "../frameworks/tanstack/root-chrome.js";
import { collectEntityCandidates } from "../frameworks/typescript/entity-models.js";
import {
  type Action,
  type Entity,
  emptyDesignSystem,
  type Navigation,
  type ProductIr,
  productIrSchemaVersion,
} from "../ir/product-ir.js";
import {
  discoverSourceFiles,
  toProjectRelativePath,
} from "./discover-source-files.js";
import { discoverStylesheetFiles } from "./discover-stylesheet-files.js";

export function compile(projectPath: string): ProductIr {
  let stats: ReturnType<typeof statSync>;
  try {
    stats = statSync(projectPath);
  } catch (error) {
    if (isNotFound(error)) {
      throw new Error(`Project directory not found: ${projectPath}`);
    }
    throw error;
  }

  if (!stats.isDirectory()) {
    throw new Error(`Project path is not a directory: ${projectPath}`);
  }

  const projectRoot = path.resolve(projectPath);
  const files = discoverSourceFiles(projectRoot);
  const routeHits = collectFileRouteScreens(files);
  const linkHits = collectScopedStaticLinks(files);

  const screensByFile = groupRoutesByFile(routeHits);
  const knownRoutes = new Set(routeHits.map((hit) => hit.route));
  const screenRouteFilePaths = new Set(routeHits.map((hit) => hit.filePath));

  const sameFileNavigation = buildSameFileNavigation(
    screensByFile,
    linkHits,
    knownRoutes,
  );
  const componentNavigation = collectComponentAttributedNavigation(
    projectRoot,
    files,
    screensByFile,
    knownRoutes,
  );
  const navigation = mergeNavigation(sameFileNavigation, componentNavigation);

  const chromeCandidate = detectGlobalChromeCandidate(
    projectRoot,
    files,
    screenRouteFilePaths,
  );
  const globalNavigation = buildGlobalNavigationFromCandidate(
    projectRoot,
    chromeCandidate,
    knownRoutes,
  );
  let actionDiscoveryIndex = 0;
  const nextActionDiscoveryIndex = (): number => {
    const index = actionDiscoveryIndex;
    actionDiscoveryIndex += 1;
    return index;
  };
  const sameFileActionCandidates = collectActionCandidates(
    files,
    nextActionDiscoveryIndex,
  );
  const componentActionCandidates = collectComponentAttributedActionCandidates(
    projectRoot,
    files,
    screensByFile,
    nextActionDiscoveryIndex,
  );
  const actionCandidates: ActionCandidate[] = [
    ...sameFileActionCandidates,
    ...componentActionCandidates,
  ];
  const actions = buildActions(projectRoot, screensByFile, actionCandidates);
  const cssFiles = discoverStylesheetFiles(projectRoot);
  const designSystem =
    cssFiles.length === 0
      ? emptyDesignSystem
      : extractDesignSystem(projectRoot, cssFiles);
  const entities = buildEntities(projectRoot, collectEntityCandidates(files));

  return {
    schemaVersion: productIrSchemaVersion,
    screens: routeHits.map((hit) => ({
      route: hit.route,
      source: { file: toProjectRelativePath(projectRoot, hit.filePath) },
    })),
    navigation,
    globalNavigation,
    designSystem,
    actions,
    entities,
  };
}

function buildEntities(
  projectRoot: string,
  candidates: ReturnType<typeof collectEntityCandidates>,
): Entity[] {
  const entities: Entity[] = candidates.map((candidate) => ({
    name: candidate.name,
    fields: candidate.fields.map((field) => {
      const mapped: Entity["fields"][number] = { name: field.name };
      if (field.optional === true) {
        mapped.optional = true;
      }
      return mapped;
    }),
    source: {
      file: toProjectRelativePath(projectRoot, candidate.filePath),
    },
  }));

  entities.sort((left, right) => {
    const byName = left.name.localeCompare(right.name);
    if (byName !== 0) {
      return byName;
    }
    return left.source.file.localeCompare(right.source.file);
  });

  return entities;
}

function buildActions(
  projectRoot: string,
  screensByFile: Map<string, string[]>,
  candidates: readonly ActionCandidate[],
): Action[] {
  const actions: Array<Action & { discoveryIndex: number }> = [];

  for (const candidate of candidates) {
    const routesInFile = screensByFile.get(candidate.filePath);
    if (routesInFile === undefined || routesInFile.length !== 1) {
      continue;
    }

    const route = routesInFile[0];
    if (route === undefined) {
      continue;
    }

    const action: Action & { discoveryIndex: number } = {
      route,
      kind: candidate.kind,
      source: {
        file: toProjectRelativePath(projectRoot, candidate.filePath),
      },
      effects: candidate.effects,
      discoveryIndex: candidate.discoveryIndex,
    };
    if (candidate.label !== undefined) {
      action.label = candidate.label;
    }
    actions.push(action);
  }

  const labelSortKey = (label: string | undefined): string => label ?? "";

  actions.sort((left, right) => {
    const byRoute = left.route.localeCompare(right.route);
    if (byRoute !== 0) {
      return byRoute;
    }
    const byKind = left.kind.localeCompare(right.kind);
    if (byKind !== 0) {
      return byKind;
    }
    const byLabel = labelSortKey(left.label).localeCompare(
      labelSortKey(right.label),
    );
    if (byLabel !== 0) {
      return byLabel;
    }
    const byFile = left.source.file.localeCompare(right.source.file);
    if (byFile !== 0) {
      return byFile;
    }
    return left.discoveryIndex - right.discoveryIndex;
  });

  return actions.map(({ discoveryIndex: _, ...action }) => action);
}

function groupRoutesByFile(
  hits: readonly { route: string; filePath: string }[],
): Map<string, string[]> {
  const byFile = new Map<string, string[]>();
  for (const hit of hits) {
    const routes = byFile.get(hit.filePath);
    if (routes === undefined) {
      byFile.set(hit.filePath, [hit.route]);
    } else {
      routes.push(hit.route);
    }
  }
  return byFile;
}

function buildSameFileNavigation(
  screensByFile: Map<string, string[]>,
  linkHits: readonly { filePath: string; to: string }[],
  knownRoutes: ReadonlySet<string>,
): Navigation[] {
  const edges = new Map<string, Navigation>();

  for (const link of linkHits) {
    if (!knownRoutes.has(link.to)) {
      continue;
    }

    const routesInFile = screensByFile.get(link.filePath);
    if (routesInFile === undefined || routesInFile.length !== 1) {
      continue;
    }

    const from = routesInFile[0];
    if (from === undefined) {
      continue;
    }

    const key = `${from}\0${link.to}`;
    if (!edges.has(key)) {
      edges.set(key, { from, to: link.to });
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

function mergeNavigation(...groups: readonly Navigation[][]): Navigation[] {
  const edges = new Map<string, Navigation>();
  for (const group of groups) {
    for (const edge of group) {
      const key = `${edge.from}\0${edge.to}`;
      if (!edges.has(key)) {
        edges.set(key, edge);
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

function isNotFound(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ENOENT"
  );
}
