/**
 * CLI Servers Add Interactive Command Smoke Tests
 *
 * Tests for goblin servers add --interactive command
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

describe("CLI Servers Add Interactive Command", () => {
  const testDir = join(tmpdir(), `goblin-cli-test-${Date.now()}`);
  const configPath = join(testDir, "config.json");

  beforeAll(() => {
    if (!existsSync(testDir)) {
      require("node:fs").mkdirSync(testDir, { recursive: true });
    }
    writeFileSync(configPath, '{"servers":[]}', "utf-8");
  });

  afterAll(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe("Non-Interactive Mode Detection", () => {
    it("should exit with error when --interactive used without TTY", async () => {
      const result = await runCli(["servers", "add", "--interactive", "--config", configPath]);

      expect(result.exitCode).toBe(2);
      expect(result.stderr).toContain("Interactive mode requires a terminal");
    });

    it("should exit with error when positional args used with --interactive", async () => {
      const result = await runCli([
        "servers",
        "add",
        "some-server",
        "stdio",
        "--interactive",
        "--config",
        configPath,
      ]);

      expect(result.exitCode).toBe(2);
      expect(result.stderr).toContain("Cannot use positional arguments with --interactive");
    });
  });

  describe("Help Output", () => {
    it("should show --interactive option in help", async () => {
      const result = await runCli(["servers", "add", "--help"]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("--interactive");
      expect(result.stdout).toContain("interactive mode");
    });

    it("should show interactive mode example in help", async () => {
      const result = await runCli(["servers", "add", "--help"]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("--interactive");
    });
  });

  describe("Missing Arguments", () => {
    it("should show error when name and transport missing without --interactive", async () => {
      const result = await runCli(["servers", "add", "--config", configPath]);

      expect(result.exitCode).toBe(2);
      expect(result.stderr).toContain("Missing required arguments");
    });
  });
});
