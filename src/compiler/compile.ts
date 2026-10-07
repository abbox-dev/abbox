import { statSync } from "node:fs";
import path from "node:path";
import { extractDesignSystem } from "../frameworks/css/theme-colors.js";
import { collectComponentAttributedContentCandidates } from "../frameworks/react/component-content.js";
import { collectComponentAttributedInteractionCandidates } from "../frameworks/react/component-interactions.js";
import { collectComponentAttributedNavigation } from "../frameworks/react/component-navigation.js";
import {
  collectComponentAttributedAnchorNavigation,
  collectComponentAttributedProductLinkHits,
  dedupeAndSortLinks,
  productLinkHitsToLinks,
} from "../frameworks/react/component-product-links.js";
import {
  type ContentCandidate,
  collectRouteFileContentCandidates,
} from "../frameworks/react/content-candidates.js";
import { collectInteractionCandidates } from "../frameworks/react/interactions.js";
import { collectScopedAnchors } from "../frameworks/tanstack/anchor-elements.js";
import { collectFileRouteScreens } from "../frameworks/tanstack/file-routes.js";
import { collectScopedStaticLinks } from "../frameworks/tanstack/links.js";
import {
  buildGlobalLinksFromCandidates,
  buildGlobalNavigationFromCandidates,
  detectGlobalChromeCandidates,
} from "../frameworks/tanstack/root-chrome.js";
import { collectEntityCandidates } from "../frameworks/typescript/entity-models.js";
import {
  type Entity,
  emptyDesignSystem,
  type Navigation,
  type ProductIr,
  productIrSchemaVersion,
} from "../ir/product-ir.js";
import { buildContent } from "./build-content.js";
import { buildInteractions } from "./build-interactions.js";
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

  const anchorScopeResolved = collectScopedAnchors(files, knownRoutes);
  const anchorNavigationHits = anchorScopeResolved.navigationHits.map(
    (hit) => ({
      filePath: hit.filePath,
      to: hit.to,
    }),
  );

  const sameFileNavigation = buildSameFileNavigation(
    screensByFile,
    [...linkHits, ...anchorNavigationHits],
    knownRoutes,
  );
  const componentNavigation = collectComponentAttributedNavigation(
    projectRoot,
    files,
    screensByFile,
    knownRoutes,
  );
  const componentAnchorNavigation = collectComponentAttributedAnchorNavigation(
    projectRoot,
    files,
    screensByFile,
    knownRoutes,
  );
  const navigation = mergeNavigation(
    sameFileNavigation,
    componentNavigation,
    componentAnchorNavigation,
  );

  const chromeCandidates = detectGlobalChromeCandidates(
    projectRoot,
    files,
    screenRouteFilePaths,
    knownRoutes,
  );
  const globalNavigation = buildGlobalNavigationFromCandidates(
    projectRoot,
    chromeCandidates,
    knownRoutes,
  );
  const globalLinks = buildGlobalLinksFromCandidates(
    projectRoot,
    chromeCandidates,
  );

  const screenRouteProductLinkHits = anchorScopeResolved.productLinkHits.filter(
    (hit) => screenRouteFilePaths.has(hit.filePath),
  );
  const componentProductLinks = collectComponentAttributedProductLinkHits(
    projectRoot,
    files,
    screensByFile,
    knownRoutes,
  );
  const links = dedupeAndSortLinks(
    productLinkHitsToLinks(projectRoot, screensByFile, [
      ...screenRouteProductLinkHits,
      ...componentProductLinks.productLinkHits,
    ]),
  );
  const sameFileInteractionCandidates = collectInteractionCandidates(
    files,
    knownRoutes,
  );
  const componentInteractionCandidates =
    collectComponentAttributedInteractionCandidates(
      projectRoot,
      files,
      screensByFile,
      knownRoutes,
    );
  const interactionCandidates = [
    ...sameFileInteractionCandidates,
    ...componentInteractionCandidates,
  ];
  const interactions = buildInteractions(
    projectRoot,
    screensByFile,
    interactionCandidates,
  );

  const contentCandidates = collectContentCandidates(
    screensByFile,
    projectRoot,
    files,
  );
  const content = buildContent(projectRoot, screensByFile, contentCandidates);

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
    links,
    globalLinks,
    designSystem,
    interactions,
    content,
    entities,
  };
}

function collectContentCandidates(
  screensByFile: Map<string, string[]>,
  projectRoot: string,
  screenFilePaths: readonly string[],
): ContentCandidate[] {
  const candidates: ContentCandidate[] = [];

  for (const [filePath, routes] of screensByFile) {
    if (routes.length !== 1) {
      continue;
    }
    candidates.push(...collectRouteFileContentCandidates(filePath));
  }

  candidates.push(
    ...collectComponentAttributedContentCandidates(
      projectRoot,
      screenFilePaths,
      screensByFile,
    ),
  );

  return candidates;
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
