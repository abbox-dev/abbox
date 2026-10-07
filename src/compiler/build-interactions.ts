import type { InteractionIdentityMaterial } from "../frameworks/react/interaction-id.js";
import {
  interactionCandidateDedupeKey,
  interactionIdFromMaterial,
} from "../frameworks/react/interaction-id.js";
import type { InteractionCandidate } from "../frameworks/react/interactions.js";
import type { Interaction } from "../ir/product-ir.js";
import { toProjectRelativePath } from "./discover-source-files.js";

export function buildInteractions(
  projectRoot: string,
  screensByFile: Map<string, string[]>,
  candidates: readonly InteractionCandidate[],
): Interaction[] {
  const deduped = dedupeInteractionCandidates(candidates);
  const interactions: Interaction[] = [];

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

    const material: InteractionIdentityMaterial = {
      route,
      attributionFile,
      definitionFile,
      triggerKind: candidate.triggerKind,
      event: candidate.event,
      tag: candidate.tag,
      handlerRef: candidate.handlerRef,
      jsxOrdinal: candidate.jsxOrdinal,
      usageLocal: candidate.usageLocal,
    };

    const interaction: Interaction = {
      id: interactionIdFromMaterial(material),
      route,
      source: {
        file: attributionFile,
        line: candidate.line,
      },
      trigger: { kind: candidate.triggerKind },
      evidence: {
        event: candidate.event,
        tag: candidate.tag,
      },
      effects: candidate.effects,
    };
    if (candidate.labels !== undefined) {
      interaction.labels = candidate.labels;
    }
    interactions.push(interaction);
  }

  interactions.sort((left, right) => {
    const byRoute = left.route.localeCompare(right.route);
    if (byRoute !== 0) {
      return byRoute;
    }
    const byTrigger = left.trigger.kind.localeCompare(right.trigger.kind);
    if (byTrigger !== 0) {
      return byTrigger;
    }
    return left.id.localeCompare(right.id);
  });

  return interactions;
}

function dedupeInteractionCandidates(
  candidates: readonly InteractionCandidate[],
): InteractionCandidate[] {
  const byKey = new Map<string, InteractionCandidate>();
  for (const candidate of candidates) {
    const key = interactionCandidateDedupeKey(candidate);
    if (!byKey.has(key)) {
      byKey.set(key, candidate);
    }
  }
  return [...byKey.values()];
}
