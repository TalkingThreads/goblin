/**
 * CLI Stop Command Smoke Tests
 *
 * Tests for goblin stop command
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

describe("CLI Stop Command", () => {
  it("should handle stop when no gateway is running", async () => {
    const result = await runCli(["stop"]);

    // Should not error when no gateway is running
    expect(result.exitCode).toBe(0);
  });

  it("should display help for stop command", async () => {
    const result = await runCli(["stop", "--help"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("stop");
  });

  it("should respond quickly", async () => {
    const startTime = Date.now();
    await runCli(["stop"]);
    const duration = Date.now() - startTime;

    expect(duration).toBeLessThan(2000);
  });
});
