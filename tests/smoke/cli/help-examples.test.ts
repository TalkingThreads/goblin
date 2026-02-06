import { describe, expect, it } from "bun:test";
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const GOBLIN_CLI = join(__dirname, "..", "..", "..", "dist", "cli", "index.js");

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

describe("CLI Help Examples", () => {
  describe("start command", () => {
    it("should show examples in help", async () => {
      const result = await runGoblin(["start", "--help"]);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("goblin start");
      expect(result.stdout).toContain("--port 8080");
      expect(result.stdout).toContain("--tui");
    });
  });

  describe("stdio command", () => {
    it("should show examples in help", async () => {
      const result = await runGoblin(["stdio", "--help"]);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("goblin stdio");
      expect(result.stdout).toContain("--config");
    });
  });

  describe("status command", () => {
    it("should show examples in help", async () => {
      const result = await runGoblin(["status", "--help"]);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("goblin status");
      expect(result.stdout).toContain("--json");
    });
  });

  describe("servers command", () => {
    it("should show examples for add subcommand", async () => {
      const result = await runGoblin(["servers", "add", "--help"]);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("goblin servers add my-server stdio");
      expect(result.stdout).toContain("goblin servers add remote-server http");
    });

    it("should show examples for remove subcommand", async () => {
      const result = await runGoblin(["servers", "remove", "--help"]);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("goblin servers remove my-server");
    });

    it("should show examples for enable subcommand", async () => {
      const result = await runGoblin(["servers", "enable", "--help"]);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("goblin servers enable my-server");
      expect(result.stdout).toContain("--yes");
    });

    it("should show examples for disable subcommand", async () => {
      const result = await runGoblin(["servers", "disable", "--help"]);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("goblin servers disable my-server");
      expect(result.stdout).toContain("--yes");
    });
  });

  describe("tools command", () => {
    it("should show examples for list subcommand", async () => {
      const result = await runGoblin(["tools", "list", "--help"]);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("goblin tools list");
      expect(result.stdout).toContain("--json");
    });

    it("should show examples for invoke subcommand", async () => {
      const result = await runGoblin(["tools", "invoke", "--help"]);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("goblin tools invoke get_time");
      expect(result.stdout).toContain("goblin tools invoke search --server my-server");
    });

    it("should show examples for describe subcommand", async () => {
      const result = await runGoblin(["tools", "describe", "--help"]);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("goblin tools describe read_file");
      expect(result.stdout).toContain("--server my-server");
    });
  });

  describe("config command", () => {
    it("should show examples for validate subcommand", async () => {
      const result = await runGoblin(["config", "validate", "--help"]);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("goblin config validate");
      expect(result.stdout).toContain("--json");
    });

    it("should show examples for show subcommand", async () => {
      const result = await runGoblin(["config", "show", "--help"]);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("goblin config show");
      expect(result.stdout).toContain("--json");
    });
  });

  describe("logs command", () => {
    it("should show examples in help", async () => {
      const result = await runGoblin(["logs", "--help"]);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("goblin logs");
      expect(result.stdout).toContain("--follow");
      expect(result.stdout).toContain("--level error");
      expect(result.stdout).toContain("--json");
    });
  });

  describe("health command", () => {
    it("should show examples in help", async () => {
      const result = await runGoblin(["health", "--help"]);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("goblin health");
      expect(result.stdout).toContain("--json");
    });
  });

  describe("stop command", () => {
    it("should show examples in help", async () => {
      const result = await runGoblin(["stop", "--help"]);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("goblin stop");
      expect(result.stdout).toContain("--url");
    });
  });
});
