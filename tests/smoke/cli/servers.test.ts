/**
 * CLI Servers Command Smoke Tests
 *
 * Tests for goblin servers command
 */

import { describe, expect, it } from "bun:test";
import { spawn } from "node:child_process";

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

    const childProcess = spawn("bun", ["dist/cli/index.js", ...args], {
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

describe("CLI Servers Command", () => {
  it("should display help for servers command", async () => {
    const result = await runCli(["servers", "--help"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("servers");
  });

  it("should respond quickly", async () => {
    const startTime = Date.now();
    await runCli(["servers", "--help"]);
    const duration = Date.now() - startTime;

    expect(duration).toBeLessThan(2000);
  });

  it("should show options in help", async () => {
    const result = await runCli(["servers", "--help"]);

    expect(result.stdout).toContain("--json");
    expect(result.stdout).toContain("--url");
    expect(result.stdout).toContain("--status");
  });
});
