/**
 * CLI Start Command Smoke Tests
 *
 * Tests for goblin start command
 */

import { describe, expect, it } from "bun:test";
import { spawn } from "node:child_process";
import { request } from "node:http";

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
      env: { ...process.env, NO_COLOR: "1", LOG_LEVEL: "error", GOBLIN_LOG_LEVEL: "error" },
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

describe("CLI Start Command", () => {
  describe("Start Command Execution", () => {
    it("should fail with invalid config", async () => {
      // Create invalid config
      const result = await runCli(["start", "--config", "/nonexistent/path/config.json"]);

      expect(result.exitCode).not.toBe(0);
      expect(result.stdout + result.stderr).toMatch(/error|failed/i);
    });
  });

  describe("Start Response Time", () => {
    it("should respond quickly to help command", async () => {
      const startTime = Date.now();
      await runCli(["start", "--help"]);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(2000);
    });
  });

  describe("Start Command Output", () => {
    it("should log the correct MCP endpoint", async () => {
      return new Promise<void>((resolve, reject) => {
        const child = spawn("bun", ["dist/cli/index.js", "start"], {
          env: { ...process.env, NO_COLOR: "1" },
          stdio: ["ignore", "pipe", "pipe"],
        });

        let stdout = "";
        let found = false;

        child.stdout.on("data", (data) => {
          stdout += data.toString();
          if (stdout.includes("http://127.0.0.1:3000/mcp")) {
            found = true;
            child.kill();
          }
        });

        const timeout = setTimeout(() => {
          child.kill();
          if (!found) {
            reject(new Error(`Timeout waiting for startup log. Got: ${stdout}`));
          }
        }, 5000);

        child.on("exit", () => {
          clearTimeout(timeout);
          if (found) {
            expect(stdout).toContain("/sse");
            resolve();
          } else {
            // reject(new Error("Startup log not found"));
          }
        });
      });
    });
  });
});
