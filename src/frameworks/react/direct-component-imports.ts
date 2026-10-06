import { Node, type Project, type SourceFile, SyntaxKind } from "ts-morph";
import { isBarrelReexportModule } from "../typescript/barrel-module.js";
import { resolveImportSpecifier } from "../typescript/module-resolve.js";

export interface DirectComponentImport {
  localName: string;
  resolvedFilePath: string;
  exportName: string;
}

export function directComponentImportsInFile(
  projectRoot: string,
  sourceFile: SourceFile,
  project: Project,
): DirectComponentImport[] {
  const imports: DirectComponentImport[] = [];

  for (const declaration of sourceFile.getImportDeclarations()) {
    if (declaration.isTypeOnly()) {
      continue;
    }

    const specifier = declaration.getModuleSpecifierValue();
    const resolved = resolveImportSpecifier(
      projectRoot,
      sourceFile.getFilePath(),
      specifier,
    );
    if (resolved === undefined) {
      continue;
    }

    const targetFile = project.addSourceFileAtPath(resolved);
    if (isBarrelReexportModule(targetFile)) {
      continue;
    }

    const defaultImport = declaration.getDefaultImport();
    if (defaultImport !== undefined && Node.isIdentifier(defaultImport)) {
      imports.push({
        localName: defaultImport.getText(),
        resolvedFilePath: resolved,
        exportName: "default",
      });
    }

    for (const named of declaration.getNamedImports()) {
      if (named.isTypeOnly()) {
        continue;
      }
      const exportName = named.getName();
      const localName = named.getAliasNode()?.getText() ?? exportName;
      imports.push({
        localName,
        resolvedFilePath: resolved,
        exportName,
      });
    }
  }

  return imports;
}

export function jsxDirectComponentLocalNames(
  sourceFile: SourceFile,
  directImports: readonly DirectComponentImport[],
): Set<string> {
  const importByLocal = new Map(
    directImports.map((entry) => [entry.localName, entry]),
  );
  const used = new Set<string>();

  for (const element of sourceFile.getDescendantsOfKind(
    SyntaxKind.JsxSelfClosingElement,
  )) {
    const tag = element.getTagNameNode();
    if (Node.isIdentifier(tag) && importByLocal.has(tag.getText())) {
      used.add(tag.getText());
    }
  }
  for (const element of sourceFile.getDescendantsOfKind(
    SyntaxKind.JsxOpeningElement,
  )) {
    const tag = element.getTagNameNode();
    if (Node.isIdentifier(tag) && importByLocal.has(tag.getText())) {
      used.add(tag.getText());
    }
  }

  return used;
}
