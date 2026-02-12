/**
 * CLI Version Command Smoke Tests
 *
 * Tests for goblin --version
 */

import { describe, expect, it } from "bun:test";
import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

interface CliResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  duration: number;
}

async function runCli(args: string[], timeout: number = 10000): Promise<CliResult> {
  const start = Date.now();

  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`Command timed out after ${timeout}ms`));
    }, timeout);

    const childProcess = spawn("bun", ["dist/index.js", ...args], {
      env: { ...process.env, NO_COLOR: "1" },
    });

    let stdout = "";
    let stderr = "";

    childProcess.stdout?.on("data", (data) => {
      stdout += data.toString();
    });

    childProcess.stderr?.on("data", (data) => {
      stderr += data.toString();
    });

    childProcess.on("error", (error) => {
      clearTimeout(timeoutId);
      reject(error);
    });

    childProcess.on("exit", (code) => {
      clearTimeout(timeoutId);
      resolve({
        exitCode: code ?? 0,
        stdout,
        stderr,
        duration: Date.now() - start,
      });
    });
  });
}

async function getPackageVersion(): Promise<string> {
  const packageJsonPath = join(process.cwd(), "package.json");
  const content = await readFile(packageJsonPath, "utf-8");
  const packageJson = JSON.parse(content);
  return packageJson.version;
}

describe("CLI Version Command", () => {
  it("should display version when run with --version", async () => {
    const result = await runCli(["--version"]);

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBeEmpty();
    expect(result.stdout.length).toBeGreaterThan(0);
  });

  it("should display version when run with -v", async () => {
    const result = await runCli(["-v"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout.length).toBeGreaterThan(0);
  });

  it("should match package.json version", async () => {
    const result = await runCli(["--version"]);
    const packageVersion = await getPackageVersion();

    expect(result.stdout.trim()).toContain(packageVersion);
  });

  it("should respond quickly (< 1s)", async () => {
    const startTime = Date.now();
    await runCli(["--version"]);
    const duration = Date.now() - startTime;

    expect(duration).toBeLessThan(1000);
  });

  it("should output version in parseable format", async () => {
    const result = await runCli(["--version"]);
    const versionOutput = result.stdout.trim();

    // Version should be semantic version compatible (e.g., "0.1.0" or "v0.1.0")
    expect(
      versionOutput.match(/^v?\d+\.\d+\.\d+/) !== null ||
        versionOutput.match(/^\d+\.\d+\.\d+/) !== null,
    ).toBe(true);
  });

  it("should not produce errors on version command", async () => {
    const result = await runCli(["--version"]);

    expect(result.stderr.length).toBe(0);
  });
});
