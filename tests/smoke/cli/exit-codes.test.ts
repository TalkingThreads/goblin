import { describe, expect, it } from "bun:test";
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const GOBLIN_CLI = join(__dirname, "..", "..", "..", "dist", "index.js");

const ExitCode = {
  SUCCESS: 0,
  GENERAL_ERROR: 1,
  INVALID_ARGUMENTS: 2,
  CONFIG_ERROR: 3,
  CONNECTION_ERROR: 4,
  PERMISSION_DENIED: 5,
  TIMEOUT: 6,
  NOT_FOUND: 7,
  VALIDATION_ERROR: 8,
} as const;

async function runGoblin(
  args: string[],
): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const proc = spawn("bun", [GOBLIN_CLI, ...args], {
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

describe("CLI Exit Codes", () => {
  describe("ExitCode.SUCCESS (0)", () => {
    it("should exit with 0 on successful version command", async () => {
      const result = await runGoblin(["version"]);
      expect(result.exitCode).toBe(0);
    });

    it("should exit with 0 on help command", async () => {
      const result = await runGoblin(["--help"]);
      expect(result.exitCode).toBe(0);
    });

    it("should exit with 0 when gateway is not running for status command", async () => {
      const result = await runGoblin(["status", "--url", "http://localhost:39999"]);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("Gateway is not running");
    });

    it("should exit with 0 when gateway is not running for stop command", async () => {
      const result = await runGoblin(["stop", "--url", "http://localhost:39999"]);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("Gateway is not running");
    });
  });

  describe("ExitCode.CONNECTION_ERROR (4)", () => {
    it("should exit with 4 on connection refused for health command", async () => {
      const result = await runGoblin(["health", "--url", "http://localhost:39999"]);
      expect(result.exitCode).toBe(4);
    });

    it("should exit with 4 on connection refused for tools list", async () => {
      const result = await runGoblin(["tools", "list", "--url", "http://localhost:39999"]);
      expect(result.exitCode).toBe(4);
    });

    it("should exit with 4 on connection refused for tools invoke", async () => {
      const result = await runGoblin([
        "tools",
        "invoke",
        "some-tool",
        "--url",
        "http://localhost:39999",
      ]);
      expect(result.exitCode).toBe(4);
    });

    it("should exit with 4 on connection refused for tools describe", async () => {
      const result = await runGoblin([
        "tools",
        "describe",
        "some-tool",
        "--url",
        "http://localhost:39999",
      ]);
      expect(result.exitCode).toBe(4);
    });

    it("should exit with 4 on connection refused for servers list", async () => {
      const result = await runGoblin(["servers", "--url", "http://localhost:39999"]);
      expect(result.exitCode).toBe(4);
    });
  });

  describe("ExitCode.INVALID_ARGUMENTS (2)", () => {
    it("should exit with 2 on invalid transport type for servers add", async () => {
      const result = await runGoblin(["servers", "add", "test", "invalid-transport"]);
      expect(result.exitCode).toBe(2);
      expect(result.stderr).toContain("Invalid transport type");
    });

    it("should exit with 2 when stdio transport missing --command", async () => {
      const result = await runGoblin(["servers", "add", "test", "stdio"]);
      expect(result.exitCode).toBe(2);
      expect(result.stderr).toContain("requires --command");
    });

    it("should exit with 2 when http transport missing --url", async () => {
      const result = await runGoblin(["servers", "add", "test", "http"]);
      expect(result.exitCode).toBe(2);
      expect(result.stderr).toContain("requires --url");
    });

    it("should exit with 2 when header format is invalid", async () => {
      const result = await runGoblin([
        "servers",
        "add",
        "test",
        "http",
        "--url",
        "http://localhost",
        "--header",
        "InvalidHeader",
      ]);
      expect(result.exitCode).toBe(2);
      expect(result.stderr).toContain("Invalid header format");
    });
  });

  describe("ExitCode.GENERAL_ERROR (1)", () => {
    it("should exit with 1 when unknown command is used", async () => {
      const result = await runGoblin(["unknown-command"]);
      expect(result.exitCode).toBe(1);
    });
  });

  describe("ExitCode constants", () => {
    it("should have correct exit code values", () => {
      expect(ExitCode.SUCCESS).toBe(0);
      expect(ExitCode.GENERAL_ERROR).toBe(1);
      expect(ExitCode.INVALID_ARGUMENTS).toBe(2);
      expect(ExitCode.CONFIG_ERROR).toBe(3);
      expect(ExitCode.CONNECTION_ERROR).toBe(4);
      expect(ExitCode.PERMISSION_DENIED).toBe(5);
      expect(ExitCode.TIMEOUT).toBe(6);
      expect(ExitCode.NOT_FOUND).toBe(7);
      expect(ExitCode.VALIDATION_ERROR).toBe(8);
    });
  });
});
