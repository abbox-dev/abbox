declare module "culori" {
  export function parse(color: string): { alpha?: number } | undefined;
  export function formatHex(color: object): string | undefined;
  export function formatHex8(color: object): string | undefined;
}
