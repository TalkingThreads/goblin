/**
 * CLI Servers Enable/Disable Command Smoke Tests
 *
 * Tests for goblin servers enable and disable commands
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

describe("CLI Servers Enable Command", () => {
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
      JSON.stringify(
        {
          servers: [
            {
              name: "disabled-server",
              transport: "stdio",
              mode: "stateful",
              enabled: false,
              command: "echo",
              args: ["hello"],
            },
            {
              name: "enabled-server",
              transport: "http",
              mode: "stateful",
              enabled: true,
              url: "https://mcp.example.com",
            },
          ],
        },
        null,
        2,
      ),
      "utf-8",
    );
  });

  afterAll(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe("Enable Server", () => {
    it("should enable a disabled server", async () => {
      const result = await runCli([
        "servers",
        "enable",
        "disabled-server",
        "--yes",
        "--config",
        configPath,
      ]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("enabled successfully");
      expect(result.stdout).toContain("disabled-server");
    });

    it("should show error for non-existent server", async () => {
      const result = await runCli([
        "servers",
        "enable",
        "non-existent",
        "--yes",
        "--config",
        configPath,
      ]);

      expect(result.exitCode).toBe(7);
      expect(result.stderr).toContain("not found");
    });

    it("should show error for already enabled server", async () => {
      const result = await runCli([
        "servers",
        "enable",
        "enabled-server",
        "--yes",
        "--config",
        configPath,
      ]);

      expect(result.exitCode).toBe(2);
      expect(result.stderr).toContain("already enabled");
    });

    it("should show server details before enabling", async () => {
      const result = await runCli([
        "servers",
        "enable",
        "disabled-server",
        "--yes",
        "--config",
        configPath,
      ]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("Name: disabled-server");
      expect(result.stdout).toContain("Transport: stdio");
      expect(result.stdout).toContain("disabled");
    });

    it("should require confirmation without --yes", async () => {
      const result = await runCli(["servers", "enable", "disabled-server", "--config", configPath]);

      expect(result.exitCode).toBe(2);
      expect(result.stderr).toContain("Confirmation required");
    });
  });

  describe("Help", () => {
    it("should show help for enable command", async () => {
      const result = await runCli(["servers", "enable", "--help"]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("Enable a disabled server");
      expect(result.stdout).toContain("--yes");
      expect(result.stdout).toContain("--config");
    });
  });
});

describe("CLI Servers Disable Command", () => {
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
      JSON.stringify(
        {
          servers: [
            {
              name: "disabled-server",
              transport: "stdio",
              mode: "stateful",
              enabled: false,
              command: "echo",
              args: ["hello"],
            },
            {
              name: "enabled-server",
              transport: "http",
              mode: "stateful",
              enabled: true,
              url: "https://mcp.example.com",
            },
          ],
        },
        null,
        2,
      ),
      "utf-8",
    );
  });

  afterAll(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe("Disable Server", () => {
    it("should disable an enabled server", async () => {
      const result = await runCli([
        "servers",
        "disable",
        "enabled-server",
        "--yes",
        "--config",
        configPath,
      ]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("disabled successfully");
      expect(result.stdout).toContain("enabled-server");
    });

    it("should show error for non-existent server", async () => {
      const result = await runCli([
        "servers",
        "disable",
        "non-existent",
        "--yes",
        "--config",
        configPath,
      ]);

      expect(result.exitCode).toBe(7);
      expect(result.stderr).toContain("not found");
    });

    it("should show error for already disabled server", async () => {
      const result = await runCli([
        "servers",
        "disable",
        "disabled-server",
        "--yes",
        "--config",
        configPath,
      ]);

      expect(result.exitCode).toBe(2);
      expect(result.stderr).toContain("already disabled");
    });

    it("should show server details before disabling", async () => {
      const result = await runCli([
        "servers",
        "disable",
        "enabled-server",
        "--yes",
        "--config",
        configPath,
      ]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("Name: enabled-server");
      expect(result.stdout).toContain("Transport: http");
      expect(result.stdout).toContain("enabled");
    });

    it("should require confirmation without --yes", async () => {
      const result = await runCli(["servers", "disable", "enabled-server", "--config", configPath]);

      expect(result.exitCode).toBe(2);
      expect(result.stderr).toContain("Confirmation required");
    });
  });

  describe("Help", () => {
    it("should show help for disable command", async () => {
      const result = await runCli(["servers", "disable", "--help"]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("Disable an enabled server");
      expect(result.stdout).toContain("--yes");
      expect(result.stdout).toContain("--config");
    });
  });
});
