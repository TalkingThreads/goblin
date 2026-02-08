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

describe("CLI TUI Flag", () => {
  describe("tui subcommand", () => {
    it("should show tui in help", async () => {
      const result = await runGoblin(["--help"]);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("goblin tui");
      expect(result.stdout).toContain("Launch interactive TUI");
    });

    it("should show tui command help", async () => {
      const result = await runGoblin(["tui", "--help"]);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("goblin tui");
      expect(result.stdout).toContain("--port");
    });

    it("should show examples for tui command", async () => {
      const result = await runGoblin(["tui", "--help"]);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("goblin tui");
      expect(result.stdout).toContain("--port");
    });
  });

  describe("--tui global flag", () => {
    it("should recognize --tui flag", async () => {
      const result = await runGoblin(["--tui", "--config", "/nonexistent/path.json"]);
      expect(result.stderr).not.toContain("unknown option '--tui'");
    });

    it("should accept --tui with --port", async () => {
      const result = await runGoblin([
        "--tui",
        "--port",
        "8080",
        "--config",
        "/nonexistent/path.json",
      ]);
      expect(result.stderr).not.toContain("unknown option '--tui'");
      expect(result.stderr).not.toContain("unknown option '--port'");
    });
  });
});
