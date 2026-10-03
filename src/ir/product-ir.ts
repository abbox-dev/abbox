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

export interface ProductIr {
  schemaVersion: typeof productIrSchemaVersion;
  screens: Screen[];
  navigation: Navigation[];
  designSystem: DesignSystem;
}

export const emptyDesignSystem: DesignSystem = { themes: [] };
