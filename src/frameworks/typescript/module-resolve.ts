import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const extensionCandidates = [".tsx", ".ts", "/index.tsx", "/index.ts"] as const;

export function resolveImportSpecifier(
  projectRoot: string,
  fromFilePath: string,
  moduleSpecifier: string,
): string | undefined {
  if (moduleSpecifier.startsWith(".")) {
    return resolveRelativeImport(fromFilePath, moduleSpecifier);
  }

  const aliasBase = pathAliasBaseDirectory(projectRoot, moduleSpecifier);
  if (aliasBase !== undefined) {
    const prefixLength = aliasBase.prefix.length + 1;
    const subpath = moduleSpecifier.slice(prefixLength);
    return resolveRelativeImportFromDirectory(
      path.join(projectRoot, aliasBase.baseDir),
      subpath,
    );
  }

  return undefined;
}

interface PathAliasBase {
  prefix: string;
  baseDir: string;
}

function pathAliasBaseDirectory(
  projectRoot: string,
  moduleSpecifier: string,
): PathAliasBase | undefined {
  const paths = readTsconfigPaths(projectRoot);
  if (paths === undefined) {
    return undefined;
  }

  const entries = Object.entries(paths).sort(
    ([left], [right]) => right.length - left.length,
  );

  for (const [pattern, targets] of entries) {
    if (!pattern.endsWith("/*") || targets.length === 0) {
      continue;
    }
    const prefix = pattern.slice(0, -2);
    if (prefix.length === 0 || !moduleSpecifier.startsWith(`${prefix}/`)) {
      continue;
    }
    const target = targets[0];
    if (target === undefined) {
      continue;
    }
    const normalized = target.replace(/\*$/, "").replace(/^\.\//, "");
    const baseDir = normalized.endsWith("/")
      ? normalized.slice(0, -1)
      : normalized;
    if (baseDir.length === 0) {
      continue;
    }
    return { prefix, baseDir };
  }

  return undefined;
}

function readTsconfigPaths(
  projectRoot: string,
): Record<string, string[]> | undefined {
  const configPath = path.join(projectRoot, "tsconfig.json");
  if (!existsSync(configPath)) {
    return undefined;
  }
  try {
    const raw = readFileSync(configPath, "utf8");
    const parsed = JSON.parse(raw) as {
      compilerOptions?: { paths?: Record<string, string[]> };
    };
    return parsed.compilerOptions?.paths;
  } catch {
    return undefined;
  }
}

function resolveRelativeImport(
  fromFilePath: string,
  moduleSpecifier: string,
): string | undefined {
  return resolveRelativeImportFromDirectory(
    path.dirname(fromFilePath),
    moduleSpecifier.startsWith("./") || moduleSpecifier.startsWith("../")
      ? moduleSpecifier
      : `./${moduleSpecifier}`,
  );
}

function resolveRelativeImportFromDirectory(
  baseDir: string,
  moduleSpecifier: string,
): string | undefined {
  const joined = path.normalize(path.join(baseDir, moduleSpecifier));
  if (existsSync(joined)) {
    if (statSync(joined).isDirectory()) {
      for (const indexName of ["index.tsx", "index.ts"] as const) {
        const indexPath = path.join(joined, indexName);
        if (existsSync(indexPath)) {
          return indexPath;
        }
      }
      return undefined;
    }
    return joined;
  }
  for (const suffix of extensionCandidates) {
    const candidate = joined + suffix;
    if (existsSync(candidate)) {
      return candidate;
    }
  }
  return undefined;
}
