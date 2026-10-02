#!/usr/bin/env node
import { writeFileSync } from "node:fs";
import path from "node:path";
import { compile } from "./compiler/compile.js";

const usage = `Usage: abbox compile [project-directory]

Compile the project and write abbox.json in that directory.
The project directory defaults to the current working directory.
`;

interface CompileTarget {
  projectPath: string;
  destination: string;
}

function main(): void {
  const args = process.argv.slice(2);
  const command = args[0];
  if (args.length === 1 && (command === "--help" || command === "-h")) {
    process.stdout.write(usage);
    return;
  }

  const target = parseCompileTarget(args);
  if (target === undefined) {
    process.stderr.write(usage);
    process.exitCode = 1;
    return;
  }

  let ir: ReturnType<typeof compile>;
  try {
    ir = compile(target.projectPath);
  } catch (error) {
    process.stderr.write(`${messageOf(error)}\n`);
    process.exitCode = 1;
    return;
  }

  const outputPath = path.resolve(target.projectPath, "abbox.json");
  try {
    writeFileSync(outputPath, `${JSON.stringify(ir, null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`Cannot write ${outputPath}: ${messageOf(error)}\n`);
    process.exitCode = 1;
    return;
  }

  const count = ir.screens.length;
  const noun = count === 1 ? "screen" : "screens";
  process.stdout.write(`Compiled ${count} ${noun} → ${target.destination}\n`);
}

function parseCompileTarget(
  args: readonly string[],
): CompileTarget | undefined {
  if (args[0] !== "compile" || args.length > 2) {
    return undefined;
  }

  const explicitPath = args[1];
  if (explicitPath?.startsWith("-")) {
    return undefined;
  }
  if (explicitPath === undefined) {
    return { projectPath: process.cwd(), destination: "abbox.json" };
  }
  return {
    projectPath: explicitPath,
    destination: `${explicitPath}/abbox.json`,
  };
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

main();
