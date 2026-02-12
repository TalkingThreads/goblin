import { describe, expect, it } from "bun:test";
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const GOBLIN_CLI = join(__dirname, "..", "..", "..", "dist", "index.js");

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

describe("CLI Error Suggestions", () => {
  describe("Basic Typos", () => {
    it("should suggest 'status' for 'statuz'", async () => {
      const result = await runGoblin(["statuz"]);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain("Did you mean");
      expect(result.stderr).toContain("status");
    });

    it("should suggest 'tools' for 'toolss'", async () => {
      const result = await runGoblin(["toolss"]);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain("Did you mean");
      expect(result.stderr).toContain("tools");
    });

    it("should suggest 'servers' for 'serverss'", async () => {
      const result = await runGoblin(["serverss"]);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain("Did you mean");
      expect(result.stderr).toContain("servers");
    });

    it("should suggest 'health' for 'healp'", async () => {
      const result = await runGoblin(["healp"]);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain("Did you mean");
      expect(result.stderr).toContain("health");
    });

    it("should suggest 'config' for 'confg'", async () => {
      const result = await runGoblin(["confg"]);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain("Did you mean");
      expect(result.stderr).toContain("config");
    });

    it("should suggest 'logs' for 'logz'", async () => {
      const result = await runGoblin(["logz"]);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain("Did you mean");
      expect(result.stderr).toContain("logs");
    });
  });

  describe("Multiple Suggestions", () => {
    it("should show suggestions for 'srvers'", async () => {
      const result = await runGoblin(["srvers"]);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain("Did you mean");
      expect(result.stderr).toContain("servers");
    });

    it("should show suggestions for 'srvrs'", async () => {
      const result = await runGoblin(["srvrs"]);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain("Did you mean");
    });
  });

  describe("No Suggestions", () => {
    it("should not show suggestions for completely unrelated command 'xyzabc'", async () => {
      const result = await runGoblin(["xyzabc"]);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain("error: unknown command 'xyzabc'");
    });

    it("should show help message for unrecognized commands", async () => {
      const result = await runGoblin(["xyzabc"]);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain("Run 'goblin --help' to see available commands");
    });
  });

  describe("Error Message Format", () => {
    it("should show error format with unknown command", async () => {
      const result = await runGoblin(["statuz"]);
      expect(result.stderr).toContain("error: unknown command 'statuz'");
    });

    it("should show suggestions in error output", async () => {
      const result = await runGoblin(["statuz"]);
      expect(result.stderr).toContain("Did you mean");
    });

    it("should show bullet list format for suggestions", async () => {
      const result = await runGoblin(["statuz"]);
      expect(result.stderr).toContain("  - goblin status");
    });

    it("should show help message for unrecognized commands", async () => {
      const result = await runGoblin(["statuz"]);
      expect(result.stderr).toContain("Run 'goblin --help' to see available commands");
    });
  });

  describe("Valid Commands", () => {
    it("should exit successfully for 'version' command", async () => {
      const result = await runGoblin(["version"]);
      expect(result.exitCode).toBe(0);
    });

    it("should exit successfully for '--help' command", async () => {
      const result = await runGoblin(["--help"]);
      expect(result.exitCode).toBe(0);
    });

    it("should exit successfully for 'status --help'", async () => {
      const result = await runGoblin(["status", "--help"]);
      expect(result.exitCode).toBe(0);
    });
  });

  describe("Help Integration", () => {
    it("should suggest help for unrecognized commands", async () => {
      const result = await runGoblin(["unknowncommand"]);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain("goblin --help");
    });
  });
});
