import { Project } from "ts-morph";
import { toProjectRelativePath } from "../../compiler/discover-source-files.js";
import type { GlobalLink, Link, Navigation } from "../../ir/product-ir.js";
import {
  type ScopedProductLinkHit,
  staticAnchorsInComponentBody,
} from "../tanstack/anchor-elements.js";
import {
  directComponentImportsInFile,
  jsxDirectComponentLocalNames,
} from "./direct-component-imports.js";
import { literalPropsForComponentUsage } from "./jsx-literal-props.js";

export function collectComponentAttributedAnchorNavigation(
  projectRoot: string,
  screenFilePaths: readonly string[],
  screensByFile: Map<string, string[]>,
  knownRoutes: ReadonlySet<string>,
): Navigation[] {
  const componentLinks = collectComponentAttributedProductLinkHits(
    projectRoot,
    screenFilePaths,
    screensByFile,
    knownRoutes,
  );
  const edges = new Map<string, Navigation>();

  for (const {
    routeFilePath,
    destinations,
  } of componentLinks.navigationGroups) {
    const routesInFile = screensByFile.get(routeFilePath);
    if (routesInFile === undefined || routesInFile.length !== 1) {
      continue;
    }
    const from = routesInFile[0];
    if (from === undefined) {
      continue;
    }
    for (const to of destinations) {
      if (!knownRoutes.has(to)) {
        continue;
      }
      const key = `${from}\0${to}`;
      if (!edges.has(key)) {
        edges.set(key, { from, to });
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

export function collectComponentAttributedProductLinkHits(
  projectRoot: string,
  screenFilePaths: readonly string[],
  screensByFile: Map<string, string[]>,
  knownRoutes: ReadonlySet<string>,
): {
  navigationGroups: { routeFilePath: string; destinations: string[] }[];
  productLinkHits: Array<ScopedProductLinkHit & { routeFilePath: string }>;
} {
  if (screenFilePaths.length === 0) {
    return { navigationGroups: [], productLinkHits: [] };
  }

  const project = new Project({
    skipAddingFilesFromTsConfig: true,
  });
  const navigationGroups: {
    routeFilePath: string;
    destinations: string[];
  }[] = [];
  const productLinkHits: Array<
    ScopedProductLinkHit & { routeFilePath: string }
  > = [];

  for (const filePath of screenFilePaths) {
    const routesInFile = screensByFile.get(filePath);
    if (routesInFile === undefined || routesInFile.length !== 1) {
      continue;
    }

    const sourceFile = project.addSourceFileAtPath(filePath);
    const directImports = directComponentImportsInFile(
      projectRoot,
      sourceFile,
      project,
    );
    const usedLocals = jsxDirectComponentLocalNames(sourceFile, directImports);

    const destinations = new Set<string>();
    const hits: Array<ScopedProductLinkHit & { routeFilePath: string }> = [];

    for (const localName of usedLocals) {
      const entry = directImports.find((item) => item.localName === localName);
      if (entry === undefined) {
        continue;
      }

      const literalProps = literalPropsForComponentUsage(sourceFile, entry);
      const componentFile = project.addSourceFileAtPath(entry.resolvedFilePath);
      const extracted = staticAnchorsInComponentBody(
        componentFile,
        entry.exportName,
        knownRoutes,
        literalProps,
      );
      for (const to of extracted.navigationDestinations) {
        destinations.add(to);
      }
      for (const hit of extracted.productLinkHits) {
        hits.push({ ...hit, routeFilePath: filePath });
      }
    }

    if (destinations.size > 0) {
      navigationGroups.push({
        routeFilePath: filePath,
        destinations: [...destinations],
      });
    }
    productLinkHits.push(...hits);
  }

  return { navigationGroups, productLinkHits };
}

export function productLinkHitsToLinks(
  projectRoot: string,
  screensByFile: Map<string, string[]>,
  hits: readonly (ScopedProductLinkHit & { routeFilePath?: string })[],
): Link[] {
  const links: Link[] = [];

  for (const hit of hits) {
    const filePath = hit.routeFilePath ?? hit.filePath;
    const routesInFile = screensByFile.get(filePath);
    if (routesInFile === undefined || routesInFile.length !== 1) {
      continue;
    }
    const route = routesInFile[0];
    if (route === undefined) {
      continue;
    }

    const source = {
      file: toProjectRelativePath(projectRoot, filePath),
    };
    const base = { route, label: hit.label, source };
    const c = hit.classification;

    if (c.kind === "anchor") {
      links.push({ ...base, kind: "anchor", hash: c.hash });
    } else if (c.kind === "external") {
      links.push({ ...base, kind: "external", url: c.url });
    } else if (c.kind === "resource") {
      const link: Link = { ...base, kind: "resource", path: c.path };
      if (hit.download === true) {
        link.download = true;
      }
      links.push(link);
    } else if (c.kind === "protocol") {
      links.push({ ...base, kind: "protocol", url: c.url });
    }
  }

  return dedupeAndSortLinks(links);
}

export function dedupeAndSortLinks(links: readonly Link[]): Link[] {
  const seen = new Map<string, Link>();
  for (const link of links) {
    const key = linkDedupeKey(link);
    if (!seen.has(key)) {
      seen.set(key, link);
    }
  }
  return [...seen.values()].sort(compareLinks);
}

function linkDedupeKey(link: Link): string {
  const label = link.label ?? "";
  const download =
    link.kind === "resource" && link.download === true ? "1" : "0";
  const target =
    link.kind === "anchor"
      ? link.hash
      : link.kind === "resource"
        ? link.path
        : link.url;
  return `${link.route}\0${link.kind}\0${target}\0${label}\0${link.source.file}\0${download}`;
}

function compareLinks(left: Link, right: Link): number {
  const byRoute = left.route.localeCompare(right.route);
  if (byRoute !== 0) {
    return byRoute;
  }
  const byKind = left.kind.localeCompare(right.kind);
  if (byKind !== 0) {
    return byKind;
  }
  const leftTarget = targetOf(left);
  const rightTarget = targetOf(right);
  const byTarget = leftTarget.localeCompare(rightTarget);
  if (byTarget !== 0) {
    return byTarget;
  }
  const byLabel = (left.label ?? "").localeCompare(right.label ?? "");
  if (byLabel !== 0) {
    return byLabel;
  }
  return left.source.file.localeCompare(right.source.file);
}

function targetOf(link: Link): string {
  if (link.kind === "anchor") {
    return link.hash;
  }
  if (link.kind === "resource") {
    return link.path;
  }
  return link.url;
}

export function productLinkHitsToGlobalLinks(
  projectRoot: string,
  chromeModulePath: string,
  hits: readonly ScopedProductLinkHit[],
): GlobalLink[] {
  const links: GlobalLink[] = [];
  const source = {
    file: toProjectRelativePath(projectRoot, chromeModulePath),
  };

  for (const hit of hits) {
    const base = { label: hit.label, source };
    const c = hit.classification;

    if (c.kind === "anchor") {
      links.push({ ...base, kind: "anchor", hash: c.hash });
    } else if (c.kind === "external") {
      links.push({ ...base, kind: "external", url: c.url });
    } else if (c.kind === "resource") {
      const link: GlobalLink = { ...base, kind: "resource", path: c.path };
      if (hit.download === true) {
        link.download = true;
      }
      links.push(link);
    } else if (c.kind === "protocol") {
      links.push({ ...base, kind: "protocol", url: c.url });
    }
  }

  return dedupeAndSortGlobalLinks(links);
}

export function dedupeAndSortGlobalLinks(
  links: readonly GlobalLink[],
): GlobalLink[] {
  const seen = new Map<string, GlobalLink>();
  for (const link of links) {
    const key = globalLinkDedupeKey(link);
    if (!seen.has(key)) {
      seen.set(key, link);
    }
  }
  return [...seen.values()].sort(compareGlobalLinks);
}

function globalLinkDedupeKey(link: GlobalLink): string {
  const label = link.label ?? "";
  const download =
    link.kind === "resource" && link.download === true ? "1" : "0";
  const target =
    link.kind === "anchor"
      ? link.hash
      : link.kind === "resource"
        ? link.path
        : link.url;
  return `${link.kind}\0${target}\0${label}\0${link.source.file}\0${download}`;
}

function compareGlobalLinks(left: GlobalLink, right: GlobalLink): number {
  const byKind = left.kind.localeCompare(right.kind);
  if (byKind !== 0) {
    return byKind;
  }
  const leftTarget = globalTargetOf(left);
  const rightTarget = globalTargetOf(right);
  const byTarget = leftTarget.localeCompare(rightTarget);
  if (byTarget !== 0) {
    return byTarget;
  }
  const byLabel = (left.label ?? "").localeCompare(right.label ?? "");
  if (byLabel !== 0) {
    return byLabel;
  }
  return left.source.file.localeCompare(right.source.file);
}

function globalTargetOf(link: GlobalLink): string {
  if (link.kind === "anchor") {
    return link.hash;
  }
  if (link.kind === "resource") {
    return link.path;
  }
  return link.url;
}
