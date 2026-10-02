import { statSync } from "node:fs";
import path from "node:path";
import { collectFileRouteScreens } from "../frameworks/tanstack/file-routes.js";
import { type ProductIr, productIrSchemaVersion } from "../ir/product-ir.js";
import {
  discoverSourceFiles,
  toProjectRelativePath,
} from "./discover-source-files.js";

export function compile(projectPath: string): ProductIr {
  let stats: ReturnType<typeof statSync>;
  try {
    stats = statSync(projectPath);
  } catch (error) {
    if (isNotFound(error)) {
      throw new Error(`Project directory not found: ${projectPath}`);
    }
    throw error;
  }

  if (!stats.isDirectory()) {
    throw new Error(`Project path is not a directory: ${projectPath}`);
  }

  const projectRoot = path.resolve(projectPath);
  const hits = collectFileRouteScreens(discoverSourceFiles(projectRoot));
  return {
    schemaVersion: productIrSchemaVersion,
    screens: hits.map((hit) => ({
      route: hit.route,
      source: { file: toProjectRelativePath(projectRoot, hit.filePath) },
    })),
  };
}

function isNotFound(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ENOENT"
  );
}
