import { Node, type SourceFile, SyntaxKind } from "ts-morph";

export function isBarrelReexportModule(sourceFile: SourceFile): boolean {
  let hasReexport = false;
  let hasOther = false;
  for (const statement of sourceFile.getStatements()) {
    const kind = statement.getKind();
    if (kind === SyntaxKind.ExportDeclaration) {
      if (Node.isExportDeclaration(statement)) {
        if (statement.getModuleSpecifier() !== undefined) {
          hasReexport = true;
          continue;
        }
      }
    }
    if (
      kind === SyntaxKind.FunctionDeclaration ||
      kind === SyntaxKind.VariableStatement ||
      kind === SyntaxKind.ClassDeclaration ||
      kind === SyntaxKind.InterfaceDeclaration ||
      kind === SyntaxKind.TypeAliasDeclaration ||
      kind === SyntaxKind.EnumDeclaration
    ) {
      hasOther = true;
    }
  }
  return hasReexport && !hasOther;
}
