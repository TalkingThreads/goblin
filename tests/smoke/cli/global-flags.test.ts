/**
 * CLI Global Flags Smoke Tests
 *
 * Tests for global flags: --port, --host, --verbose, --json, --config
 */

import { describe, expect, it } from "bun:test";
import { spawn } from "node:child_process";

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

describe("CLI Global Flags", () => {
  describe("--port flag", () => {
    it("should show --port in help", async () => {
      const result = await runCli(["--help"]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("--port");
    });

    it("should show error when connecting to wrong port", async () => {
      const result = await runCli(["--port", "39999", "status"]);

      expect(result.exitCode).toBe(0); // Status returns 0 even when offline
      // Output can be JSON log or human-readable depending on verbose flag
      const hasError =
        result.stdout.includes("not running") ||
        result.stdout.includes("Failed to fetch") ||
        result.stdout.includes("Could not connect");
      expect(hasError).toBe(true);
    });
  });

  describe("--host flag", () => {
    it("should show --host in help", async () => {
      const result = await runCli(["--help"]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("--host");
    });
  });

  describe("--verbose flag", () => {
    it("should show --verbose in help", async () => {
      const result = await runCli(["--help"]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("--verbose");
    });

    it("should accept --verbose flag", async () => {
      const result = await runCli(["--verbose", "--help"]);

      expect(result.exitCode).toBe(0);
    });
  });

  describe("--json flag", () => {
    it("should show --json in help", async () => {
      const result = await runCli(["--help"]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("--json");
    });

    it("should output JSON with --json status", async () => {
      const result = await runCli(["--json", "status"]);

      expect(result.exitCode).toBe(0);
      // Should be valid JSON
      const output = result.stdout.trim();
      expect(() => JSON.parse(output)).not.toThrow();
    });
  });

  describe("--config flag", () => {
    it("should show --config in help", async () => {
      const result = await runCli(["--help"]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("--config");
    });
  });

  describe("Combined global flags", () => {
    it("should accept multiple global flags", async () => {
      const result = await runCli(["--port", "8080", "--json", "status"]);

      expect(result.exitCode).toBe(0);
      // Should be valid JSON
      const output = result.stdout.trim();
      expect(() => JSON.parse(output)).not.toThrow();
    });

    it("should accept all global flags together", async () => {
      const result = await runCli([
        "--port",
        "8080",
        "--host",
        "127.0.0.1",
        "--verbose",
        "--json",
        "status",
      ]);

      expect(result.exitCode).toBe(0);
    });
  });

  describe("Backward compatibility", () => {
    it("should still accept command-specific flags", async () => {
      const result = await runCli(["status", "--port", "8080"]);

      expect(result.exitCode).toBe(0);
    });

    it("should work with global and command flags", async () => {
      const result = await runCli(["--json", "status", "--port", "8080"]);

      expect(result.exitCode).toBe(0);
      // Should be valid JSON
      const output = result.stdout.trim();
      expect(() => JSON.parse(output)).not.toThrow();
    });
  });
});
