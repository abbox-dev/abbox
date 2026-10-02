import { statSync } from "node:fs";
import path from "node:path";
import { collectFileRouteScreens } from "../frameworks/tanstack/file-routes.js";
import { collectStaticLinks } from "../frameworks/tanstack/links.js";
import {
  type Navigation,
  type ProductIr,
  productIrSchemaVersion,
} from "../ir/product-ir.js";
import {
  discoverSourceFiles,
  toProjectRelativePath,
} from "./discover-source-files.js";

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
  const linkHits = collectStaticLinks(files);

  const screensByFile = groupRoutesByFile(routeHits);
  const knownRoutes = new Set(routeHits.map((hit) => hit.route));

  const navigation = buildNavigation(screensByFile, linkHits, knownRoutes);

  return {
    schemaVersion: productIrSchemaVersion,
    screens: routeHits.map((hit) => ({
      route: hit.route,
      source: { file: toProjectRelativePath(projectRoot, hit.filePath) },
    })),
    navigation,
  };
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

function buildNavigation(
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

function isNotFound(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ENOENT"
  );
}
