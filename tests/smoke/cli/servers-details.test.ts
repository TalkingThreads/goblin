import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { spawn } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const GOBLIN_CLI = join(__dirname, "..", "..", "..", "dist", "cli", "index.js");

async function runCli(
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

function createConfig(tempDir: string, config: object): string {
  const configPath = join(tempDir, "config.json");
  writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");
  return configPath;
}

describe("CLI Servers Details Command", () => {
  const tempDir = join(tmpdir(), "goblin-servers-details-test");

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

  describe("servers details command", () => {
    it("should show details for existing server", async () => {
      const configPath = createConfig(tempDir, {
        servers: [
          {
            name: "test-server",
            transport: "stdio",
            mode: "stateful",
            enabled: true,
            command: "npx",
            args: ["@modelcontextprotocol/server-filesystem", "./data"],
          },
        ],
      });

      const result = await runCli(["servers", "details", "test-server", "--config", configPath]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("Server Details: test-server");
      expect(result.stdout).toContain("Transport: stdio");
      expect(result.stdout).toContain("Enabled: Yes");
      expect(result.stdout).toContain("Command: npx");
    });

    it("should show error for non-existent server", async () => {
      const configPath = createConfig(tempDir, {
        servers: [],
      });

      const result = await runCli(["servers", "details", "non-existent", "--config", configPath]);

      expect(result.exitCode).toBe(7);
      expect(result.stderr).toContain("not found");
    });

    it("should show HTTP server details", async () => {
      const configPath = createConfig(tempDir, {
        servers: [
          {
            name: "http-server",
            transport: "http",
            mode: "stateful",
            enabled: true,
            url: "https://api.example.com/mcp",
          },
        ],
      });

      const result = await runCli(["servers", "details", "http-server", "--config", configPath]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("Transport: http");
      expect(result.stdout).toContain("URL: https://api.example.com/mcp");
    });

    it("should show SSE server details", async () => {
      const configPath = createConfig(tempDir, {
        servers: [
          {
            name: "sse-server",
            transport: "sse",
            mode: "stateful",
            enabled: false,
            url: "https://events.example.com/stream",
            headers: {
              Authorization: "Bearer token123",
            },
          },
        ],
      });

      const result = await runCli(["servers", "details", "sse-server", "--config", configPath]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("Transport: sse");
      expect(result.stdout).toContain("Enabled: No");
      expect(result.stdout).toContain("Headers:");
    });

    it("should show disabled server details", async () => {
      const configPath = createConfig(tempDir, {
        servers: [
          {
            name: "disabled-server",
            transport: "http",
            mode: "stateful",
            enabled: false,
            url: "https://disabled.example.com/mcp",
          },
        ],
      });

      const result = await runCli([
        "servers",
        "details",
        "disabled-server",
        "--config",
        configPath,
      ]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("Enabled: No");
    });

    it("should show server mode", async () => {
      const configPath = createConfig(tempDir, {
        servers: [
          {
            name: "mode-server",
            transport: "stdio",
            mode: "stateless",
            enabled: true,
            command: "python",
            args: ["server.py"],
          },
        ],
      });

      const result = await runCli(["servers", "details", "mode-server", "--config", configPath]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("Mode: stateless");
    });

    it("should show examples in help", async () => {
      const result = await runCli(["servers", "details", "--help"]);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("goblin servers details my-server");
    });
  });
});
