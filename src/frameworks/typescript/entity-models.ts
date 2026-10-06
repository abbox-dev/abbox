import {
  type InterfaceDeclaration,
  Node,
  Project,
  type SourceFile,
} from "ts-morph";

export interface EntityFieldCandidate {
  name: string;
  optional?: true;
}

export interface EntityCandidate {
  name: string;
  filePath: string;
  fields: EntityFieldCandidate[];
}

export function collectEntityCandidates(
  files: readonly string[],
): EntityCandidate[] {
  if (files.length === 0) {
    return [];
  }

  const project = new Project({
    skipAddingFilesFromTsConfig: true,
  });

  const perFile: EntityCandidate[] = [];
  for (const file of files) {
    perFile.push(...candidatesInFile(project.addSourceFileAtPath(file)));
  }

  return omitAmbiguousNames(perFile);
}

function candidatesInFile(sourceFile: SourceFile): EntityCandidate[] {
  const filePath = sourceFile.getFilePath();
  const arrayNames = exportedArrayEntityNames(sourceFile);
  if (arrayNames.size === 0) {
    return [];
  }

  const candidates: EntityCandidate[] = [];
  for (const declaration of sourceFile.getInterfaces()) {
    if (!declaration.isExported()) {
      continue;
    }
    if (declaration.getTypeParameters().length > 0) {
      continue;
    }
    const name = declaration.getName();
    if (!arrayNames.has(name)) {
      continue;
    }
    const fields = fieldsFromInterface(declaration);
    if (fields.length === 0) {
      continue;
    }
    candidates.push({ name, filePath, fields });
  }

  for (const declaration of sourceFile.getTypeAliases()) {
    if (!declaration.isExported()) {
      continue;
    }
    if (declaration.getTypeParameters().length > 0) {
      continue;
    }
    const typeNode = declaration.getTypeNode();
    if (typeNode === undefined || !Node.isTypeLiteral(typeNode)) {
      continue;
    }
    const name = declaration.getName();
    if (!arrayNames.has(name)) {
      continue;
    }
    const fields = fieldsFromTypeLiteral(typeNode);
    if (fields.length === 0) {
      continue;
    }
    candidates.push({ name, filePath, fields });
  }

  return candidates;
}

function exportedArrayEntityNames(sourceFile: SourceFile): Set<string> {
  const names = new Set<string>();
  for (const statement of sourceFile.getVariableStatements()) {
    if (!statement.isExported()) {
      continue;
    }
    for (const declaration of statement.getDeclarations()) {
      const entityName = arrayElementTypeName(declaration.getTypeNode());
      if (entityName !== undefined) {
        names.add(entityName);
      }
    }
  }
  return names;
}

function arrayElementTypeName(
  typeNode: import("ts-morph").TypeNode | undefined,
): string | undefined {
  if (typeNode === undefined) {
    return undefined;
  }
  if (Node.isArrayTypeNode(typeNode)) {
    return typeReferenceName(typeNode.getElementTypeNode());
  }
  if (Node.isTypeReference(typeNode)) {
    const typeName = typeNode.getTypeName();
    if (
      Node.isIdentifier(typeName) &&
      typeName.getText() === "Array" &&
      typeNode.getTypeArguments().length === 1
    ) {
      const argument = typeNode.getTypeArguments()[0];
      if (argument !== undefined) {
        return typeReferenceName(argument);
      }
    }
  }
  return undefined;
}

function typeReferenceName(
  node: import("ts-morph").TypeNode,
): string | undefined {
  if (Node.isTypeReference(node)) {
    const nameNode = node.getTypeName();
    if (Node.isIdentifier(nameNode)) {
      return nameNode.getText();
    }
  }
  return undefined;
}

function fieldsFromInterface(
  declaration: InterfaceDeclaration,
): EntityFieldCandidate[] {
  return fieldsFromMembers(declaration.getMembers());
}

function fieldsFromTypeLiteral(
  typeLiteral: import("ts-morph").TypeLiteralNode,
): EntityFieldCandidate[] {
  return fieldsFromMembers(typeLiteral.getMembers());
}

function fieldsFromMembers(
  members: readonly import("ts-morph").TypeElementTypes[],
): EntityFieldCandidate[] {
  const fields: EntityFieldCandidate[] = [];
  for (const member of members) {
    if (!Node.isPropertySignature(member)) {
      continue;
    }
    const nameNode = member.getNameNode();
    if (!Node.isIdentifier(nameNode)) {
      continue;
    }
    const field: EntityFieldCandidate = { name: nameNode.getText() };
    if (member.hasQuestionToken()) {
      field.optional = true;
    }
    fields.push(field);
  }
  return sortFields(fields);
}

function sortFields(fields: EntityFieldCandidate[]): EntityFieldCandidate[] {
  return [...fields].sort((left, right) => left.name.localeCompare(right.name));
}

function omitAmbiguousNames(candidates: EntityCandidate[]): EntityCandidate[] {
  const filesByName = new Map<string, Set<string>>();
  for (const candidate of candidates) {
    let files = filesByName.get(candidate.name);
    if (files === undefined) {
      files = new Set<string>();
      filesByName.set(candidate.name, files);
    }
    files.add(candidate.filePath);
  }

  const ambiguous = new Set<string>();
  for (const [name, files] of filesByName) {
    if (files.size > 1) {
      ambiguous.add(name);
    }
  }

  return candidates.filter((candidate) => !ambiguous.has(candidate.name));
}
