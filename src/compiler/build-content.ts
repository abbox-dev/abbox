import type { ContentCandidate } from "../frameworks/react/content-candidates.js";
import {
  type ContentIdentityMaterial,
  contentCandidateDedupeKey,
  contentIdFromMaterial,
} from "../frameworks/react/content-id.js";
import { headingLevelFromTag } from "../frameworks/react/static-text.js";
import type { Content } from "../ir/product-ir.js";
import { toProjectRelativePath } from "./discover-source-files.js";

export function buildContent(
  projectRoot: string,
  screensByFile: Map<string, string[]>,
  candidates: readonly ContentCandidate[],
): Content[] {
  const deduped = dedupeContentCandidates(candidates);
  const content: Content[] = [];

  for (const candidate of deduped) {
    const routesInFile = screensByFile.get(candidate.attributionFilePath);
    if (routesInFile === undefined || routesInFile.length !== 1) {
      continue;
    }

    const route = routesInFile[0];
    if (route === undefined) {
      continue;
    }

    const attributionFile = toProjectRelativePath(
      projectRoot,
      candidate.attributionFilePath,
    );
    const definitionFile = toProjectRelativePath(
      projectRoot,
      candidate.definitionFilePath,
    );

    const material: ContentIdentityMaterial = {
      route,
      attributionFile,
      definitionFile,
      usageLocal: candidate.usageLocal,
      kind: candidate.kind,
      element: candidate.element,
      structPath: candidate.structPath,
    };

    const structure: Content["structure"] = {
      element: candidate.element,
    };
    const headingLevel = headingLevelFromTag(candidate.element);
    if (headingLevel !== undefined) {
      structure.headingLevel = headingLevel;
    }

    const entry: Content = {
      id: contentIdFromMaterial(material),
      route,
      source: {
        file: attributionFile,
        line: candidate.line,
      },
      definition: { file: definitionFile },
      kind: candidate.kind,
      value: candidate.value,
      structure,
    };
    content.push(entry);
  }

  content.sort((left, right) => {
    const byRoute = left.route.localeCompare(right.route);
    if (byRoute !== 0) {
      return byRoute;
    }
    const byLine = left.source.line - right.source.line;
    if (byLine !== 0) {
      return byLine;
    }
    return left.id.localeCompare(right.id);
  });

  return content;
}

function dedupeContentCandidates(
  candidates: readonly ContentCandidate[],
): ContentCandidate[] {
  const byKey = new Map<string, ContentCandidate>();
  for (const candidate of candidates) {
    const key = contentCandidateDedupeKey(candidate);
    if (!byKey.has(key)) {
      byKey.set(key, candidate);
    }
  }
  return [...byKey.values()];
}
