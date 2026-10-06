export type Mixed = {
  id: string;
  [key: string]: string;
  run(): void;
};

export const mixed: Mixed[] = [];
