export const productIrSchemaVersion = "1" as const;

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

export interface ActionSource {
  file: string;
}

export interface StateEffect {
  kind: "state";
  target: string;
  value?: string | number | boolean | null;
}

export interface SearchEffect {
  kind: "search";
}

export type Effect = StateEffect | SearchEffect;

export interface Action {
  route: string;
  kind: "invoke" | "submit";
  label?: string;
  source: ActionSource;
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

export interface GlobalNavigation {
  to: string;
  source: GlobalNavigationSource;
}

export interface GlobalNavigationSource {
  file: string;
}

export interface ProductIr {
  schemaVersion: typeof productIrSchemaVersion;
  screens: Screen[];
  navigation: Navigation[];
  globalNavigation: GlobalNavigation[];
  designSystem: DesignSystem;
  actions: Action[];
  entities: Entity[];
}

export const emptyDesignSystem: DesignSystem = { themes: [] };
