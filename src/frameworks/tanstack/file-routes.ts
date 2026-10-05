import { Node, Project, type SourceFile, SyntaxKind } from "ts-morph";
import { importedLocalNames } from "./named-import.js";

const createFileRouteName = "createFileRoute";

interface FileRouteHit {
  route: string;
  filePath: string;
}

/**
 * TanStack file routing writes an index route id as the URL it matches plus a
 * trailing slash, so the id does not collide with its parent. "/" is already
 * the root destination.
 */
export function fileRouteDestination(routeId: string): string {
  if (routeId.length > 1 && routeId.endsWith("/")) {
    return routeId.slice(0, -1);
  }
  return routeId;
}

export function collectFileRouteScreens(
  files: readonly string[],
): FileRouteHit[] {
  if (files.length === 0) {
    return [];
  }

  const project = new Project({
    skipAddingFilesFromTsConfig: true,
  });
  const hits: FileRouteHit[] = [];
  for (const file of files) {
    hits.push(...screensInFile(project.addSourceFileAtPath(file)));
  }
  return lowerFileRouteDestinations(hits);
}

function lowerFileRouteDestinations(
  hits: readonly FileRouteHit[],
): FileRouteHit[] {
  const indexCountByDestination = new Map<string, number>();
  for (const hit of hits) {
    const destination = fileRouteDestination(hit.route);
    if (destination === hit.route) {
      continue;
    }
    indexCountByDestination.set(
      destination,
      (indexCountByDestination.get(destination) ?? 0) + 1,
    );
  }

  const lowered: FileRouteHit[] = [];
  for (const hit of hits) {
    const destination = fileRouteDestination(hit.route);
    const indexCount = indexCountByDestination.get(destination) ?? 0;
    if (indexCount > 1) {
      continue;
    }
    if (indexCount === 1 && destination === hit.route) {
      continue;
    }
    lowered.push({ route: destination, filePath: hit.filePath });
  }
  return lowered;
}

function screensInFile(sourceFile: SourceFile): FileRouteHit[] {
  const names = importedLocalNames(sourceFile, createFileRouteName);
  if (names.size === 0) {
    return [];
  }

  const hits: FileRouteHit[] = [];
  for (const call of sourceFile.getDescendantsOfKind(
    SyntaxKind.CallExpression,
  )) {
    const callee = call.getExpression();
    if (!Node.isIdentifier(callee) || !names.has(callee.getText())) {
      continue;
    }

    const args = call.getArguments();
    const argument = args[0];
    if (
      args.length !== 1 ||
      argument === undefined ||
      !Node.isStringLiteral(argument)
    ) {
      continue;
    }

    hits.push({
      route: argument.getLiteralText(),
      filePath: sourceFile.getFilePath(),
    });
  }
  return hits;
}
