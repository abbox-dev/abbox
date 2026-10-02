export const productIrSchemaVersion = "1" as const;

export interface ScreenSource {
  file: string;
}

export interface Screen {
  route: string;
  source: ScreenSource;
}

export interface ProductIr {
  schemaVersion: typeof productIrSchemaVersion;
  screens: Screen[];
}
