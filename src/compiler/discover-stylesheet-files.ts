import { readdirSync } from "node:fs";
import path from "node:path";
import { toProjectRelativePath } from "./discover-source-files.js";

const skippedDirectories = new Set([
  "node_modules",
  "dist",
  "build",
  "coverage",
  ".git",
]);

export function discoverStylesheetFiles(projectRoot: string): string[] {
  const files: string[] = [];
  walk(projectRoot, files);
  files.sort((left, right) =>
    toProjectRelativePath(projectRoot, left).localeCompare(
      toProjectRelativePath(projectRoot, right),
    ),
  );
  return files;
}

function walk(directory: string, files: string[]): void {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) {
      continue;
    }

    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (skippedDirectories.has(entry.name)) {
        continue;
      }
      walk(fullPath, files);
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".css")) {
      files.push(fullPath);
    }
  }
}
