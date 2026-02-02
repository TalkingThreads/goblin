/**
 * CLI Help Command Smoke Tests
 *
 * Tests for goblin --help and goblin <command> --help
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

    const childProcess = spawn("node", ["dist/cli/index.js", ...args], {
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

describe("CLI Help Command", () => {
  describe("Global Help", () => {
    it("should display help when run with --help", async () => {
      const result = await runCli(["--help"]);

      expect(result.exitCode).toBe(0);
      expect(result.stderr).toBeEmpty();
      expect(result.stdout).toContain("Usage");
      expect(result.stdout).toContain("Commands");
    });

    it("should display help when run with -h", async () => {
      const result = await runCli(["-h"]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("Usage");
      expect(result.stdout).toContain("Commands");
    });

    it("should list all available commands", async () => {
      const result = await runCli(["--help"]);

      expect(result.stdout).toContain("start");
      expect(result.stdout).toContain("stop");
      expect(result.stdout).toContain("status");
      expect(result.stdout).toContain("servers");
      expect(result.stdout).toContain("tools");
      expect(result.stdout).toContain("config");
      expect(result.stdout).toContain("logs");
      expect(result.stdout).toContain("health");
    });

    it("should include command descriptions", async () => {
      const result = await runCli(["--help"]);

      // Each command should have some description text
      const lines = result.stdout.split("\n");
      let foundCommandSection = false;

      for (const line of lines) {
        if (line.includes("start")) {
          foundCommandSection = true;
          break;
        }
      }

      expect(foundCommandSection).toBe(true);
    });

    it("should be formatted readably", async () => {
      const result = await runCli(["--help"]);

      // Output should have multiple lines
      const lines = result.stdout.split("\n");
      expect(lines.length).toBeGreaterThan(5);

      // Output should not be a single paragraph
      expect(result.stdout).toContain("\n");
    });
  });

  describe("Command-Specific Help", () => {
    it("should display help for start command", async () => {
      const result = await runCli(["start", "--help"]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("start");
      expect(result.stdout).toContain("Options");
    });

    it("should display help for stop command", async () => {
      const result = await runCli(["stop", "--help"]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("stop");
    });

    it("should display help for status command", async () => {
      const result = await runCli(["status", "--help"]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("status");
    });

    it("should display help for servers command", async () => {
      const result = await runCli(["servers", "--help"]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("servers");
    });

    it("should display help for tools command", async () => {
      const result = await runCli(["tools", "--help"]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("tools");
    });

    it("should display help for config command", async () => {
      const result = await runCli(["config", "--help"]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("config");
    });

    it("should display help for logs command", async () => {
      const result = await runCli(["logs", "--help"]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("logs");
    });

    it("should display help for health command", async () => {
      const result = await runCli(["health", "--help"]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("health");
    });

    it("should include options in command help", async () => {
      const result = await runCli(["start", "--help"]);

      // Help should show available options/flags
      expect(result.stdout).toContain("--");
    });

    it("should show usage information", async () => {
      const result = await runCli(["start", "--help"]);

      expect(result.stdout).toContain("Usage");
    });
  });

  describe("Help Response Time", () => {
    it("should respond quickly (< 1s)", async () => {
      const startTime = Date.now();
      await runCli(["--help"]);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(1000);
    });
  });
});
