import { spawnSync } from "node:child_process";
import {
  chmodSync,
  cpSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { compile } from "../src/index.js";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));
const cliPath = path.join(repoRoot, "dist/cli.js");
const dashboardFixture = fileURLToPath(
  new URL("./fixtures/tanstack-file-routes/dashboard", import.meta.url),
);

const usage = `Usage: abbox compile [project-directory]

Compile the project and write abbox.json in that directory.
The project directory defaults to the current working directory.
`;

function runCli(args: readonly string[], cwd?: string) {
  return spawnSync(process.execPath, [cliPath, ...args], {
    cwd,
    encoding: "utf8",
  });
}

function withProject(run: (directory: string) => void): void {
  const directory = mkdtempSync(path.join(tmpdir(), "abbox-cli-"));
  cpSync(dashboardFixture, directory, { recursive: true });
  try {
    run(directory);
  } finally {
    chmodSync(directory, 0o755);
    rmSync(directory, { recursive: true, force: true });
  }
}

describe("abbox compile", () => {
  it("starts the built CLI with a node shebang", () => {
    expect(
      readFileSync(cliPath, "utf8").startsWith("#!/usr/bin/env node\n"),
    ).toBe(true);
  });

  it("writes abbox.json that matches compile()", () => {
    withProject((directory) => {
      const result = runCli(["compile", directory]);
      const outputPath = path.join(directory, "abbox.json");
      const text = readFileSync(outputPath, "utf8");

      expect(result.status).toBe(0);
      expect(text.endsWith("\n")).toBe(true);
      expect(text).toBe(`${JSON.stringify(compile(directory), null, 2)}\n`);
      expect(JSON.parse(text)).toEqual(compile(directory));
      expect(result.stdout).toBe(
        `Compiled 1 screen → ${directory}/abbox.json\n`,
      );
    });
  });

  it("writes abbox.json in the current working directory", () => {
    withProject((directory) => {
      const result = runCli(["compile"], directory);
      expect(result.status).toBe(0);
      expect(result.stdout).toBe("Compiled 1 screen → abbox.json\n");
      expect(
        JSON.parse(readFileSync(path.join(directory, "abbox.json"), "utf8")),
      ).toEqual(compile(directory));
    });
  });

  it("overwrites an existing abbox.json", () => {
    withProject((directory) => {
      const outputPath = path.join(directory, "abbox.json");
      writeFileSync(outputPath, '{"schemaVersion":"0"}\n');
      const result = runCli(["compile", directory]);
      expect(result.status).toBe(0);
      expect(JSON.parse(readFileSync(outputPath, "utf8"))).toEqual(
        compile(directory),
      );
    });
  });

  it("does not modify project source files", () => {
    withProject((directory) => {
      const sourcePath = path.join(directory, "routes/dashboard.tsx");
      const before = readFileSync(sourcePath, "utf8");
      const result = runCli(["compile", directory]);
      expect(result.status).toBe(0);
      expect(readFileSync(sourcePath, "utf8")).toBe(before);
    });
  });

  it("rejects a missing directory", () => {
    const missing = path.join(tmpdir(), "abbox-missing-project");
    const result = runCli(["compile", missing]);
    expect(result.status).toBe(1);
    expect(result.stderr).toBe(`Project directory not found: ${missing}\n`);
    expect(result.stderr).not.toMatch(/\n\s+at /);
  });

  it("rejects a file path", () => {
    const file = path.join(dashboardFixture, "routes/dashboard.tsx");
    const result = runCli(["compile", file]);
    expect(result.status).toBe(1);
    expect(result.stderr).toBe(`Project path is not a directory: ${file}\n`);
    expect(result.stderr).not.toMatch(/\n\s+at /);
  });

  it("rejects invalid commands", () => {
    for (const args of [
      [],
      ["nope"],
      ["compile", "a", "b"],
      ["compile", "--flag"],
    ]) {
      const result = runCli(args);
      expect(result.status).toBe(1);
      expect(result.stderr).toBe(usage);
      expect(result.stdout).toBe("");
    }
  });

  it("prints usage for --help and -h", () => {
    for (const flag of ["--help", "-h"]) {
      const result = runCli([flag]);
      expect(result.status).toBe(0);
      expect(result.stdout).toBe(usage);
      expect(result.stderr).toBe("");
    }
  });

  it("reports an unwritable abbox.json", () => {
    withProject((directory) => {
      chmodSync(directory, 0o555);
      const result = runCli(["compile", directory]);
      expect(result.status).toBe(1);
      expect(result.stderr).toContain(
        `Cannot write ${path.resolve(directory, "abbox.json")}`,
      );
    });
  });
});
