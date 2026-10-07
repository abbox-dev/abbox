import type {
  Effect,
  Interaction,
  InteractionLabelFrom,
  ProductIr,
} from "../../src/ir/product-ir.js";

export type InteractionBody = Omit<Interaction, "id" | "source"> & {
  source: { file: string; line?: number };
};

export function stripInteractionIds(
  interactions: readonly Interaction[],
): InteractionBody[] {
  return interactions.map(({ id: _, ...rest }) => rest);
}

export type ProductIrForExpect = Omit<ProductIr, "interactions" | "content"> & {
  interactions: InteractionBody[];
};

export function stripInteractionIdsFromProduct(
  product: ProductIr,
): ProductIrForExpect {
  const { content: _, interactions, ...rest } = product;
  return {
    ...rest,
    interactions: interactions.map(({ id, source, ...rest }) => ({
      ...rest,
      source: { file: source.file },
    })),
  };
}

export function activation(
  route: string,
  file: string,
  label?: string,
  effects: Effect[] = [],
  options?: { tag?: string; labelFrom?: InteractionLabelFrom },
): InteractionBody {
  const tag = options?.tag ?? "button";
  const interaction: InteractionBody = {
    route,
    source: { file },
    trigger: { kind: "activation" },
    evidence: { event: "click", tag },
    effects,
  };
  if (label !== undefined) {
    interaction.labels = {
      static: label,
      from: options?.labelFrom ?? "text",
    };
  }
  return interaction;
}

export function submit(
  route: string,
  file: string,
  label?: string,
  effects: Effect[] = [],
  labelFrom: InteractionLabelFrom = "submit-button",
): InteractionBody {
  const interaction: InteractionBody = {
    route,
    source: { file },
    trigger: { kind: "submit" },
    evidence: { event: "submit", tag: "form" },
    effects,
  };
  if (label !== undefined) {
    interaction.labels = { static: label, from: labelFrom };
  }
  return interaction;
}

export function normalizeInteractionBodies(
  bodies: InteractionBody[],
): InteractionBody[] {
  return bodies.map((body) => ({
    ...body,
    source: { file: body.source.file, line: body.source.line },
  }));
}
