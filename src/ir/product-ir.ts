export const productIrSchemaVersion = "2" as const;

export interface ScreenSource {
  file: string;
}

export interface Screen {
  route: string;
  source: ScreenSource;
}

export interface Navigation {
  from: string;
  to: string;
}

export interface ColorTokenSource {
  file: string;
}

export interface DesignSystemColorToken {
  name: string;
  value: string;
  hex?: string;
  source: ColorTokenSource;
}

export interface DesignSystemTheme {
  name: string;
  colors: DesignSystemColorToken[];
}

export interface DesignSystem {
  themes: DesignSystemTheme[];
}

export interface InteractionSource {
  file: string;
  line: number;
}

export type InteractionTriggerKind = "activation" | "submit";

export interface InteractionTrigger {
  kind: InteractionTriggerKind;
}

export type InteractionLabelFrom =
  | "aria-label"
  | "title"
  | "text"
  | "submit-button";

export interface InteractionLabels {
  static: string;
  from: InteractionLabelFrom;
}

export type InteractionEvent = "click" | "submit";

export interface InteractionEvidence {
  event: InteractionEvent;
  tag: string;
}

export interface StateEffect {
  kind: "state";
  target: string;
  value?: string | number | boolean | null;
}

export interface SearchEffect {
  kind: "search";
}

export interface NavigationEffect {
  kind: "navigation";
  to: string;
}

export type Effect = StateEffect | SearchEffect | NavigationEffect;

export interface Interaction {
  id: string;
  route: string;
  source: InteractionSource;
  trigger: InteractionTrigger;
  labels?: InteractionLabels;
  evidence: InteractionEvidence;
  effects: Effect[];
}

export interface EntitySource {
  file: string;
}

export interface EntityField {
  name: string;
  optional?: boolean;
}

export interface Entity {
  name: string;
  fields: EntityField[];
  source: EntitySource;
}

export type ContentValue = { text: string } | { alternatives: string[] };

export interface ContentSource {
  file: string;
  line: number;
}

export interface ContentDefinition {
  file: string;
}

export interface ContentStructure {
  element: string;
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
}

export interface Content {
  id: string;
  route: string;
  source: ContentSource;
  definition: ContentDefinition;
  kind: "text" | "alt" | "placeholder";
  value: ContentValue;
  structure: ContentStructure;
}

export interface GlobalNavigation {
  to: string;
  source: GlobalNavigationSource;
}

export interface GlobalNavigationSource {
  file: string;
}

export interface LinkSource {
  file: string;
}

export type Link =
  | {
      route: string;
      kind: "anchor";
      hash: string;
      label?: string;
      source: LinkSource;
    }
  | {
      route: string;
      kind: "external";
      url: string;
      label?: string;
      source: LinkSource;
    }
  | {
      route: string;
      kind: "resource";
      path: string;
      label?: string;
      download?: boolean;
      source: LinkSource;
    }
  | {
      route: string;
      kind: "protocol";
      url: string;
      label?: string;
      source: LinkSource;
    };

export type GlobalLink =
  | {
      kind: "anchor";
      hash: string;
      label?: string;
      source: LinkSource;
    }
  | {
      kind: "external";
      url: string;
      label?: string;
      source: LinkSource;
    }
  | {
      kind: "resource";
      path: string;
      label?: string;
      download?: boolean;
      source: LinkSource;
    }
  | {
      kind: "protocol";
      url: string;
      label?: string;
      source: LinkSource;
    };

export interface ProductIr {
  schemaVersion: typeof productIrSchemaVersion;
  screens: Screen[];
  navigation: Navigation[];
  globalNavigation: GlobalNavigation[];
  links: Link[];
  globalLinks: GlobalLink[];
  designSystem: DesignSystem;
  interactions: Interaction[];
  content: Content[];
  entities: Entity[];
}

export const emptyDesignSystem: DesignSystem = { themes: [] };
