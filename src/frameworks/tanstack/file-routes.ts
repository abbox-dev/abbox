import { Node, Project, type SourceFile, SyntaxKind } from "ts-morph";
import { importedLocalNames } from "./named-import.js";

const createFileRouteName = "createFileRoute";

interface FileRouteHit {
  route: string;
  filePath: string;
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
  return hits;
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
