/**
 * CLI Start Command Smoke Tests
 *
 * Tests for goblin start command
 */

import { afterAll, beforeAll, describe, expect, it } from "bun:test";
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

    const childProcess = spawn("node", ["dist/cli/index.js", ...args], {
      env: { ...process.env, NO_COLOR: "1", GOBLIN_LOG_LEVEL: "error" },
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

async function waitForHealth(port: number, maxAttempts: number = 20): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await new Promise<void>((resolve, reject) => {
        const req = request(
          {
            hostname: "localhost",
            port,
            path: "/health",
            method: "GET",
            timeout: 1000,
          },
          (res) => {
            res.on("data", () => {
              // Consume data
            });
            res.on("end", () => {
              resolve();
            });
          },
        );
        req.on("error", reject);
        req.on("timeout", () => {
          req.destroy();
          reject(new Error("Timeout"));
        });
        req.end();
      });
      return true;
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  return false;
}

describe("CLI Start Command", () => {
  describe("Start Command Execution", () => {
    it("should fail with invalid config", async () => {
      // Create invalid config
      const result = await runCli(["start", "--config", "/nonexistent/path/config.json"]);

      expect(result.exitCode).not.toBe(0);
      expect(result.stderr.length).toBeGreaterThan(0);
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
});
