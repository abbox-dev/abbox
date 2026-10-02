import type { SourceFile } from "ts-morph";

const tanstackRouterModule = "@tanstack/react-router";

export function importedLocalNames(
  sourceFile: SourceFile,
  exportName: string,
): Set<string> {
  const names = new Set<string>();
  for (const declaration of sourceFile.getImportDeclarations()) {
    if (
      declaration.isTypeOnly() ||
      declaration.getModuleSpecifierValue() !== tanstackRouterModule
    ) {
      continue;
    }

    for (const named of declaration.getNamedImports()) {
      if (named.isTypeOnly() || named.getName() !== exportName) {
        continue;
      }
      names.add(named.getAliasNode()?.getText() ?? named.getName());
    }
  }
  return names;
}
