import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { spawn } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const GOBLIN_CLI = join(__dirname, "..", "..", "..", "dist", "cli", "index.js");

interface LogEntry {
  time: string;
  level: number;
  component: string;
  msg: string;
}

function createLogFile(path: string, entries: LogEntry[]): void {
  const lines = entries.map((e) => JSON.stringify(e));
  writeFileSync(path, lines.join("\n"), "utf-8");
}

async function runGoblinLogs(
  args: string[],
  logPath: string,
): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const proc = spawn("bun", [GOBLIN_CLI, "logs", "--path", logPath, ...args], {
      cwd: join(__dirname, "..", "..", ".."),
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    proc.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    proc.on("close", (code) => {
      resolve({ exitCode: code ?? 0, stdout, stderr });
    });

    proc.on("error", (err) => {
      stderr += err.message;
      resolve({ exitCode: 1, stdout, stderr });
    });

    setTimeout(() => {
      proc.kill("SIGKILL");
      resolve({ exitCode: 1, stdout, stderr: "Timeout" });
    }, 5000);
  });
}

describe("CLI Logs Level Filtering", () => {
  const tempDir = join(tmpdir(), "goblin-logs-test");
  const logPath = join(tempDir, "app.log");

  beforeAll(() => {
    mkdirSync(tempDir, { recursive: true });
  });

  afterAll(() => {
    try {
      rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe("log level filtering", () => {
    it("should show all logs when no level specified", async () => {
      createLogFile(logPath, [
        { time: new Date().toISOString(), level: 10, component: "test", msg: "trace message" },
        { time: new Date().toISOString(), level: 20, component: "test", msg: "debug message" },
        { time: new Date().toISOString(), level: 30, component: "test", msg: "info message" },
        { time: new Date().toISOString(), level: 40, component: "test", msg: "warn message" },
        { time: new Date().toISOString(), level: 50, component: "test", msg: "error message" },
      ]);

      const result = await runGoblinLogs([], logPath);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("trace message");
      expect(result.stdout).toContain("debug message");
      expect(result.stdout).toContain("info message");
      expect(result.stdout).toContain("warn message");
      expect(result.stdout).toContain("error message");
    });

    it("should filter to error level and above", async () => {
      createLogFile(logPath, [
        { time: new Date().toISOString(), level: 10, component: "test", msg: "trace message" },
        { time: new Date().toISOString(), level: 20, component: "test", msg: "debug message" },
        { time: new Date().toISOString(), level: 30, component: "test", msg: "info message" },
        { time: new Date().toISOString(), level: 40, component: "test", msg: "warn message" },
        { time: new Date().toISOString(), level: 50, component: "test", msg: "error message" },
      ]);

      const result = await runGoblinLogs(["--level", "error"], logPath);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).not.toContain("trace message");
      expect(result.stdout).not.toContain("debug message");
      expect(result.stdout).not.toContain("info message");
      expect(result.stdout).not.toContain("warn message");
      expect(result.stdout).toContain("error message");
    });

    it("should filter to warn level and above", async () => {
      createLogFile(logPath, [
        { time: new Date().toISOString(), level: 10, component: "test", msg: "trace message" },
        { time: new Date().toISOString(), level: 20, component: "test", msg: "debug message" },
        { time: new Date().toISOString(), level: 30, component: "test", msg: "info message" },
        { time: new Date().toISOString(), level: 40, component: "test", msg: "warn message" },
        { time: new Date().toISOString(), level: 50, component: "test", msg: "error message" },
      ]);

      const result = await runGoblinLogs(["--level", "warn"], logPath);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).not.toContain("trace message");
      expect(result.stdout).not.toContain("debug message");
      expect(result.stdout).not.toContain("info message");
      expect(result.stdout).toContain("warn message");
      expect(result.stdout).toContain("error message");
    });

    it("should filter to info level and above", async () => {
      createLogFile(logPath, [
        { time: new Date().toISOString(), level: 10, component: "test", msg: "trace message" },
        { time: new Date().toISOString(), level: 20, component: "test", msg: "debug message" },
        { time: new Date().toISOString(), level: 30, component: "test", msg: "info message" },
        { time: new Date().toISOString(), level: 40, component: "test", msg: "warn message" },
        { time: new Date().toISOString(), level: 50, component: "test", msg: "error message" },
      ]);

      const result = await runGoblinLogs(["--level", "info"], logPath);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).not.toContain("trace message");
      expect(result.stdout).not.toContain("debug message");
      expect(result.stdout).toContain("info message");
      expect(result.stdout).toContain("warn message");
      expect(result.stdout).toContain("error message");
    });

    it("should filter to debug level and above", async () => {
      createLogFile(logPath, [
        { time: new Date().toISOString(), level: 10, component: "test", msg: "trace message" },
        { time: new Date().toISOString(), level: 20, component: "test", msg: "debug message" },
        { time: new Date().toISOString(), level: 30, component: "test", msg: "info message" },
        { time: new Date().toISOString(), level: 40, component: "test", msg: "warn message" },
        { time: new Date().toISOString(), level: 50, component: "test", msg: "error message" },
      ]);

      const result = await runGoblinLogs(["--level", "debug"], logPath);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).not.toContain("trace message");
      expect(result.stdout).toContain("debug message");
      expect(result.stdout).toContain("info message");
      expect(result.stdout).toContain("warn message");
      expect(result.stdout).toContain("error message");
    });
  });

  describe("log level case insensitivity", () => {
    it("should handle uppercase level names", async () => {
      createLogFile(logPath, [
        { time: new Date().toISOString(), level: 30, component: "test", msg: "info message" },
        { time: new Date().toISOString(), level: 50, component: "test", msg: "error message" },
      ]);

      const result = await runGoblinLogs(["--level", "ERROR"], logPath);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).not.toContain("info message");
      expect(result.stdout).toContain("error message");
    });

    it("should handle mixed case level names", async () => {
      createLogFile(logPath, [
        { time: new Date().toISOString(), level: 30, component: "test", msg: "info message" },
        { time: new Date().toISOString(), level: 50, component: "test", msg: "error message" },
      ]);

      const result = await runGoblinLogs(["--level", "ErRoR"], logPath);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).not.toContain("info message");
      expect(result.stdout).toContain("error message");
    });
  });

  describe("help text", () => {
    it("should show --level option in help", async () => {
      const result = await runGoblinLogs(["--help"], logPath);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("--level");
      expect(result.stdout).toContain("debug");
      expect(result.stdout).toContain("info");
      expect(result.stdout).toContain("warn");
      expect(result.stdout).toContain("error");
    });
  });
});
