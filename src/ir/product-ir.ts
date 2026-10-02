export interface ScreenSource {
  file: string;
}

export interface Screen {
  route: string;
  source: ScreenSource;
}

export interface ProductIr {
  screens: Screen[];
}
