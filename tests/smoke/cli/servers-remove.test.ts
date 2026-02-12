/**
 * CLI Servers Remove Command Smoke Tests
 *
 * Tests for goblin servers remove command
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "bun:test";
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

describe("CLI Servers Remove Command", () => {
  const testDir = join(tmpdir(), `goblin-cli-test-${Date.now()}`);
  const configPath = join(testDir, "config.json");

  beforeAll(() => {
    if (!existsSync(testDir)) {
      require("node:fs").mkdirSync(testDir, { recursive: true });
    }
  });

  beforeEach(() => {
    writeFileSync(
      configPath,
      JSON.stringify({
        servers: [
          {
            name: "test-server",
            transport: "stdio",
            mode: "stateful",
            enabled: true,
            command: "echo",
            args: ["hello"],
          },
          {
            name: "keep-server",
            transport: "http",
            mode: "stateful",
            enabled: true,
            url: "https://mcp.example.com",
          },
        ],
      }),
      "utf-8",
    );
  });

  afterAll(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe("Remove Server", () => {
    it("should remove a server", async () => {
      const result = await runCli([
        "servers",
        "remove",
        "test-server",
        "--yes",
        "--config",
        configPath,
      ]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("removed successfully");
      expect(result.stdout).toContain("test-server");
    });

    it("should show error for non-existent server", async () => {
      const result = await runCli([
        "servers",
        "remove",
        "non-existent",
        "--yes",
        "--config",
        configPath,
      ]);

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain("not found");
    });

    it("should show server details before removal", async () => {
      const result = await runCli([
        "servers",
        "remove",
        "keep-server",
        "--yes",
        "--config",
        configPath,
      ]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("Name: keep-server");
      expect(result.stdout).toContain("Transport: http");
    });

    it("should require confirmation without --yes", async () => {
      const result = await runCli(["servers", "remove", "test-server", "--config", configPath]);

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain("Confirmation required");
    });
  });

  describe("Help", () => {
    it("should show help for remove command", async () => {
      const result = await runCli(["servers", "remove", "--help"]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("Remove a server");
      expect(result.stdout).toContain("--yes");
    });
  });
});
