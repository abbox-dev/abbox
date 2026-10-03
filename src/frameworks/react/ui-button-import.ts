import type { SourceFile } from "ts-morph";

export function isUiButtonModuleSpecifier(specifier: string): boolean {
  if (specifier === "@/components/ui/button") {
    return true;
  }
  if (specifier.endsWith("/components/ui/button")) {
    return true;
  }
  if (specifier.endsWith("/ui/button")) {
    return true;
  }
  return false;
}

export function importedUiButtonLocalNames(
  sourceFile: SourceFile,
): Set<string> {
  const names = new Set<string>();
  for (const declaration of sourceFile.getImportDeclarations()) {
    if (declaration.isTypeOnly()) {
      continue;
    }
    if (!isUiButtonModuleSpecifier(declaration.getModuleSpecifierValue())) {
      continue;
    }
    for (const named of declaration.getNamedImports()) {
      if (named.isTypeOnly() || named.getName() !== "Button") {
        continue;
      }
      names.add(named.getAliasNode()?.getText() ?? named.getName());
    }
  }
  return names;
}
