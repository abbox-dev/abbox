import { readFileSync } from "node:fs";
import type { AtRule, Rule } from "postcss";
import postcss from "postcss";
import { toProjectRelativePath } from "../../compiler/discover-source-files.js";
import {
  canonicalHexFromCssColor,
  isStaticCssColor,
} from "../../design/color-canonical.js";
import type {
  DesignSystem,
  DesignSystemColorToken,
  DesignSystemTheme,
} from "../../ir/product-ir.js";

type RuntimeThemeName = "default" | "dark";

interface PhysicalDeclaration {
  varName: string;
  valueText: string;
  file: string;
}

interface SemanticDeclaration {
  semanticName: string;
  valueText: string;
  file: string;
}

interface RawToken {
  theme: RuntimeThemeName;
  name: string;
  value: string;
  file: string;
}

const singleVarPattern = /^var\(\s*(--[A-Za-z0-9_-]+)\s*\)$/;

export function extractDesignSystem(
  projectRoot: string,
  cssFiles: readonly string[],
): DesignSystem {
  const semanticDeclarations: SemanticDeclaration[] = [];
  const physicalByTheme: Record<RuntimeThemeName, PhysicalDeclaration[]> = {
    default: [],
    dark: [],
  };
  let hasDefault = false;
  let hasDark = false;

  for (const filePath of cssFiles) {
    const relativeFile = toProjectRelativePath(projectRoot, filePath);
    const root = postcss.parse(readFileSync(filePath, "utf8"), {
      from: filePath,
    });

    root.walkAtRules("theme", (atRule) => {
      collectSemanticDeclarations(atRule, relativeFile, semanticDeclarations);
    });

    root.walkRules((rule) => {
      const theme = themeNameForSelector(rule);
      if (theme === undefined) {
        return;
      }
      if (theme === "default") {
        hasDefault = true;
      } else {
        hasDark = true;
      }
      collectPhysicalDeclarations(rule, relativeFile, physicalByTheme[theme]);
    });
  }

  const runtimeThemes = orderedRuntimeThemes(hasDefault, hasDark);
  if (runtimeThemes.length === 0) {
    return { themes: [] };
  }

  const candidates: RawToken[] = [];

  for (const theme of runtimeThemes) {
    const semanticNames = new Set<string>();

    for (const semantic of semanticDeclarations) {
      const token = resolveSemanticToken(
        semantic,
        theme,
        physicalByTheme[theme],
      );
      candidates.push(token);
      semanticNames.add(semantic.semanticName);
    }

    for (const physical of physicalByTheme[theme]) {
      const name = physicalNameFromVar(physical.varName);
      if (semanticNames.has(name)) {
        continue;
      }
      if (!isColorLikePhysicalValue(physical.valueText)) {
        continue;
      }
      candidates.push({
        theme,
        name,
        value: physical.valueText,
        file: physical.file,
      });
    }
  }

  const themes: DesignSystemTheme[] = runtimeThemes.map((themeName) => ({
    name: themeName,
    colors: finalizeTokens(candidates.filter((c) => c.theme === themeName)),
  }));

  return { themes };
}

function orderedRuntimeThemes(
  hasDefault: boolean,
  hasDark: boolean,
): RuntimeThemeName[] {
  const themes: RuntimeThemeName[] = [];
  if (hasDefault) {
    themes.push("default");
  }
  if (hasDark) {
    themes.push("dark");
  }
  return themes;
}

function themeNameForSelector(rule: Rule): RuntimeThemeName | undefined {
  const selector = rule.selector.trim();
  if (selector === ":root") {
    return "default";
  }
  if (selector === ".dark") {
    return "dark";
  }
  return undefined;
}

function collectSemanticDeclarations(
  atRule: AtRule,
  file: string,
  out: SemanticDeclaration[],
): void {
  atRule.walkDecls((decl) => {
    const semanticName = semanticNameFromProperty(decl.prop);
    if (semanticName === undefined) {
      return;
    }
    out.push({
      semanticName,
      valueText: decl.value,
      file,
    });
  });
}

function collectPhysicalDeclarations(
  rule: Rule,
  file: string,
  out: PhysicalDeclaration[],
): void {
  rule.walkDecls((decl) => {
    if (!decl.prop.startsWith("--")) {
      return;
    }
    out.push({
      varName: decl.prop,
      valueText: decl.value,
      file,
    });
  });
}

function semanticNameFromProperty(prop: string): string | undefined {
  if (!prop.startsWith("--color-")) {
    return undefined;
  }
  const name = prop.slice("--color-".length);
  return name.length > 0 ? name : undefined;
}

function physicalNameFromVar(varName: string): string {
  return varName.startsWith("--") ? varName.slice(2) : varName;
}

function parseSingleVarReference(
  valueText: string,
): { varName: string } | undefined {
  const match = singleVarPattern.exec(valueText.trim());
  if (match === null) {
    return undefined;
  }
  const varName = match[1];
  if (varName === undefined) {
    return undefined;
  }
  return { varName };
}

function resolveSemanticToken(
  semantic: SemanticDeclaration,
  theme: RuntimeThemeName,
  physical: PhysicalDeclaration[],
): RawToken {
  const alias = parseSingleVarReference(semantic.valueText);
  if (alias !== undefined) {
    const resolved = resolvePhysicalColor(alias.varName, physical);
    if (resolved !== undefined) {
      return {
        theme,
        name: semantic.semanticName,
        value: resolved.value,
        file: resolved.file,
      };
    }
    return {
      theme,
      name: semantic.semanticName,
      value: semantic.valueText,
      file: semantic.file,
    };
  }

  if (isStaticCssColor(semantic.valueText)) {
    return {
      theme,
      name: semantic.semanticName,
      value: semantic.valueText,
      file: semantic.file,
    };
  }

  return {
    theme,
    name: semantic.semanticName,
    value: semantic.valueText,
    file: semantic.file,
  };
}

function resolvePhysicalColor(
  varName: string,
  physical: PhysicalDeclaration[],
): { value: string; file: string } | undefined {
  const matches = physical.filter((entry) => entry.varName === varName);
  if (matches.length === 0) {
    return undefined;
  }

  const values = [...new Set(matches.map((entry) => entry.valueText))];
  if (values.length !== 1) {
    return undefined;
  }

  const valueText = values[0];
  if (valueText === undefined) {
    return undefined;
  }

  if (parseSingleVarReference(valueText) !== undefined) {
    return undefined;
  }

  if (!isStaticCssColor(valueText)) {
    return undefined;
  }

  const file = matches
    .map((entry) => entry.file)
    .sort((left, right) => left.localeCompare(right))[0];
  if (file === undefined) {
    return undefined;
  }

  return { value: valueText, file };
}

function isColorLikePhysicalValue(valueText: string): boolean {
  const trimmed = valueText.trim();
  if (parseSingleVarReference(trimmed) !== undefined) {
    return true;
  }
  return isStaticCssColor(trimmed);
}

function finalizeTokens(raw: RawToken[]): DesignSystemColorToken[] {
  const deduped = new Map<string, DesignSystemColorToken>();

  for (const entry of raw) {
    const key = `${entry.theme}\0${entry.name}\0${entry.value}\0${entry.file}`;
    if (deduped.has(key)) {
      continue;
    }
    const token: DesignSystemColorToken = {
      name: entry.name,
      value: entry.value,
      source: { file: entry.file },
    };
    const hex = canonicalHexFromCssColor(entry.value);
    if (hex !== undefined) {
      token.hex = hex;
    }
    deduped.set(key, token);
  }

  return [...deduped.values()].sort((left, right) => {
    const byName = left.name.localeCompare(right.name);
    if (byName !== 0) {
      return byName;
    }
    const byFile = left.source.file.localeCompare(right.source.file);
    if (byFile !== 0) {
      return byFile;
    }
    return left.value.localeCompare(right.value);
  });
}
