/**
 * CLI Root Help Smoke Tests
 *
 * Tests for goblin (no arguments) displaying root help overview
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

describe("CLI Root Help", () => {
  describe("Root Help Display", () => {
    it("should display root help when run with no arguments", async () => {
      const result = await runCli([]);

      expect(result.exitCode).toBe(0);
      expect(result.stderr).toBeEmpty();
      expect(result.stdout).toContain("Goblin MCP Gateway");
    });

    it("should display root help when run with --help", async () => {
      const result = await runCli(["--help"]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("Goblin MCP Gateway");
    });

    it("should display usage information", async () => {
      const result = await runCli([]);

      expect(result.stdout).toContain("Usage:");
      expect(result.stdout).toContain("goblin <command>");
    });
  });

  describe("Common Commands Section", () => {
    it("should show Common Commands section", async () => {
      const result = await runCli([]);

      expect(result.stdout).toContain("Common Commands");
    });

    it("should list stdio command", async () => {
      const result = await runCli([]);

      expect(result.stdout).toContain("goblin stdio");
      expect(result.stdout).toContain("STDIO mode");
    });

    it("should list start command", async () => {
      const result = await runCli([]);

      expect(result.stdout).toContain("goblin start");
      expect(result.stdout).toContain("HTTP gateway");
    });

    it("should list servers command", async () => {
      const result = await runCli([]);

      expect(result.stdout).toContain("goblin servers");
    });

    it("should list tools command", async () => {
      const result = await runCli([]);

      expect(result.stdout).toContain("goblin tools");
    });

    it("should list tui command", async () => {
      const result = await runCli([]);

      expect(result.stdout).toContain("goblin tui");
    });
  });

  describe("Global Flags Section", () => {
    it("should show Global Flags section", async () => {
      const result = await runCli([]);

      expect(result.stdout).toContain("Global Flags");
    });

    it("should document help flag", async () => {
      const result = await runCli([]);

      expect(result.stdout).toContain("-h, --help");
      expect(result.stdout).toContain("Show this help message");
    });

    it("should document verbose flag", async () => {
      const result = await runCli([]);

      expect(result.stdout).toContain("-v, --verbose");
      expect(result.stdout).toContain("Enable verbose logging");
    });

    it("should document version flag", async () => {
      const result = await runCli([]);

      expect(result.stdout).toContain("--version");
      expect(result.stdout).toContain("Show version information");
    });
  });

  describe("Documentation Link", () => {
    it("should show documentation link", async () => {
      const result = await runCli([]);

      expect(result.stdout).toContain("Documentation");
      expect(result.stdout).toContain("https://");
    });
  });

  describe("Output Format", () => {
    it("should have multiple sections", async () => {
      const result = await runCli([]);

      const lines = result.stdout.split("\n");
      expect(lines.length).toBeGreaterThan(10);
    });

    it("should not be empty", async () => {
      const result = await runCli([]);

      expect(result.stdout.length).toBeGreaterThan(100);
    });
  });

  describe("Response Time", () => {
    it("should respond quickly (< 1s)", async () => {
      const startTime = Date.now();
      await runCli([]);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(1000);
    });
  });
});
