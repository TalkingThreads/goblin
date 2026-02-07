/**
 * CLI Tools Search Command Smoke Tests
 *
 * Tests for goblin tools search command
 */

import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { spawn } from "node:child_process";
import { existsSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

interface CliResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  duration: number;
}

function runCli(args: string[], timeout: number = 10000): Promise<CliResult> {
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

describe("CLI Tools Search Command", () => {
  describe("Help", () => {
    it("should display help for search command", async () => {
      const result = await runCli(["tools", "search", "--help"]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("search");
      expect(result.stdout).toContain("Search for tools");
    });

    it("should show --server option in help", async () => {
      const result = await runCli(["tools", "search", "--help"]);

      expect(result.stdout).toContain("--server");
    });

    it("should show --json option in help", async () => {
      const result = await runCli(["tools", "search", "--help"]);

      expect(result.stdout).toContain("--json");
    });

    it("should show examples in help", async () => {
      const result = await runCli(["tools", "search", "--help"]);

      expect(result.stdout).toContain("goblin tools search");
    });
  });

  describe("Error Handling", () => {
    it("should show error when gateway is not running", async () => {
      const result = await runCli(["tools", "search", "file", "--url", "http://localhost:39999"]);

      expect(result.exitCode).toBe(4);
      expect(result.stderr).toContain("Error");
    });
  });
});
