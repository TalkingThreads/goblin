/**
 * CLI Tools Command Smoke Tests
 *
 * Tests for goblin tools command (list, invoke, describe)
 */

import { describe, expect, it } from "bun:test";
import { spawn } from "node:child_process";

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

describe("CLI Tools Command", () => {
  it("should display help for tools command", async () => {
    const result = await runCli(["tools", "--help"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("tools");
  });

  it("should show subcommands in tools help", async () => {
    const result = await runCli(["tools", "--help"]);

    expect(result.stdout).toContain("list");
    expect(result.stdout).toContain("invoke");
    expect(result.stdout).toContain("describe");
  });

  it("should respond quickly", async () => {
    const startTime = Date.now();
    await runCli(["tools", "--help"]);
    const duration = Date.now() - startTime;

    expect(duration).toBeLessThan(2000);
  });

  it("should show list subcommand description", async () => {
    const result = await runCli(["tools", "--help"]);

    expect(result.stdout).toContain("List all available tools");
  });

  it("should show invoke subcommand description", async () => {
    const result = await runCli(["tools", "--help"]);

    expect(result.stdout).toContain("invoke");
    expect(result.stdout).toContain("Invoke a tool");
  });

  it("should show describe subcommand description", async () => {
    const result = await runCli(["tools", "--help"]);

    expect(result.stdout).toContain("describe");
    expect(result.stdout).toContain("Describe a tool");
  });
});

describe("CLI Tools List", () => {
  it("should display help for tools list", async () => {
    const result = await runCli(["tools", "list", "--help"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("list");
  });

  it("should support --json flag", async () => {
    const result = await runCli(["tools", "list", "--help"]);

    expect(result.stdout).toContain("--json");
  });

  it("should support --url flag", async () => {
    const result = await runCli(["tools", "list", "--help"]);

    expect(result.stdout).toContain("--url");
  });
});

describe("CLI Tools Invoke", () => {
  it("should display help for tools invoke", async () => {
    const result = await runCli(["tools", "invoke", "--help"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("invoke");
  });

  it("should require tool name argument", async () => {
    const result = await runCli(["tools", "invoke"]);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("missing required argument");
  });

  it("should support --args flag", async () => {
    const result = await runCli(["tools", "invoke", "--help"]);

    expect(result.stdout).toContain("--args");
  });

  it("should support --server flag", async () => {
    const result = await runCli(["tools", "invoke", "--help"]);

    expect(result.stdout).toContain("--server");
  });

  it("should show error for unknown tool", async () => {
    const result = await runCli([
      "tools",
      "invoke",
      "unknown-tool-12345",
      "--url",
      "http://localhost:39999",
    ]);

    expect(result.exitCode).toBe(4);
    expect(result.stderr).toContain("Error");
  });

  it("should show error for invalid JSON args", async () => {
    const result = await runCli(["tools", "invoke", "some-tool", "--args", "not-json"]);

    expect(result.exitCode).toBe(8);
    expect(result.stderr).toContain("Invalid JSON");
  });
});

describe("CLI Tools Describe", () => {
  it("should display help for tools describe", async () => {
    const result = await runCli(["tools", "describe", "--help"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("describe");
  });

  it("should require tool name argument", async () => {
    const result = await runCli(["tools", "describe"]);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("missing required argument");
  });

  it("should support --server flag", async () => {
    const result = await runCli(["tools", "describe", "--help"]);

    expect(result.stdout).toContain("--server");
  });

  it("should show error for unknown tool", async () => {
    const result = await runCli([
      "tools",
      "describe",
      "unknown-tool-12345",
      "--url",
      "http://localhost:39999",
    ]);

    expect(result.exitCode).toBe(4);
    expect(result.stderr).toContain("Error");
  });
});
