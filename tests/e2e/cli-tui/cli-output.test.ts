/**
 * CLI/TUI Tests - Output Formatting
 *
 * Tests CLI output formatting, error messages, and display.
 */

import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { CliTester } from "../shared/cli-tester.js";
import { TestEnvironment } from "../shared/environment.js";

describe("CLI - Output Formatting", () => {
  let cli: CliTester;

  beforeEach(async () => {
    cli = new CliTester({ timeout: 30000 });
  });

  afterEach(async () => {
    await cli.cleanup();
  });

  test("help output contains usage information", async () => {
    const result = await cli.help();

    expect(result.exitCode).toBe(0);
    expect(result.stdout.length).toBeGreaterThan(0);

    // Should contain usage or command info
    const lower = result.stdout.toLowerCase();
    expect(lower.includes("usage") || lower.includes("commands") || lower.includes("options")).toBe(
      true,
    );
  });

  test("help output contains command descriptions", async () => {
    const result = await cli.help();

    // Should describe available commands
    const lower = result.stdout.toLowerCase();
    expect(
      lower.includes("start") ||
        lower.includes("status") ||
        lower.includes("tools") ||
        lower.includes("servers"),
    ).toBe(true);
  });

  test("subcommand help works", async () => {
    const result = await cli.run(["tools", "--help"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("--server");
    expect(result.stdout).toContain("--search");
  });

  test("error messages are not empty", async () => {
    const result = await cli.run(["--invalid-flag-that-does-not-exist"]);

    // Should have non-empty error output
    expect(result.exitCode).not.toBe(0);
    expect(result.stderr.length + result.stdout.length).toBeGreaterThan(0);
  });

  test("version output is parseable", async () => {
    const result = await cli.version();

    expect(result.exitCode).toBe(0);
    expect(result.stdout.length).toBeGreaterThan(0);
  });
});

describe("CLI - JSON Output", () => {
  let cli: CliTester;

  beforeEach(async () => {
    cli = new CliTester({ timeout: 30000 });
  });

  afterEach(async () => {
    await cli.cleanup();
  });

  test("version JSON output is valid", async () => {
    const result = await cli.runJson<{ version: string }>(["--version"]);

    expect(result).toHaveProperty("version");
    expect(typeof result.version).toBe("string");
  });

  test("status help shows JSON option", async () => {
    const result = await cli.run(["status", "--help"]);

    expect(result.stdout).toContain("--json");
  });

  test("health help shows JSON option", async () => {
    const result = await cli.run(["health", "--help"]);

    expect(result.stdout).toContain("--json");
  });

  test("config show --json outputs valid JSON", async () => {
    const env = new TestEnvironment({ name: "json-test", useDocker: false });
    const configPath = await env.createTempFile("config.json", JSON.stringify({ servers: [] }));

    const result = await cli.run(["config", "show", "--config", configPath, "--json"]);

    await env.cleanup();

    expect(result.exitCode).toBe(0);
    expect(() => JSON.parse(result.stdout)).not.toThrow();
  });
});

describe("CLI - Verbose Output", () => {
  let cli: CliTester;

  beforeEach(async () => {
    cli = new CliTester({ timeout: 30000 });
  });

  afterEach(async () => {
    await cli.cleanup();
  });

  test("logs command shows verbose options", async () => {
    const result = await cli.run(["logs", "--help"]);

    expect(result.stdout).toContain("--level");
    expect(result.stdout).toContain("--follow");
    expect(result.stdout).toContain("--json");
    expect(result.stdout).toContain("--verbose");
  });

  test("status command shows verbose option", async () => {
    const result = await cli.run(["status", "--help"]);

    expect(result.stdout).toContain("--verbose");
  });
});

describe("CLI - Error Messages", () => {
  let cli: CliTester;

  beforeEach(async () => {
    cli = new CliTester({ timeout: 30000 });
  });

  afterEach(async () => {
    await cli.cleanup();
  });

  test("invalid subcommand shows error", async () => {
    const result = await cli.run(["invalid-subcommand-name"]);

    expect(result.exitCode).not.toBe(0);
  });

  test("missing required argument shows error", async () => {
    // start requires port
    const result = await cli.run(["start"]);

    // Should show error about missing port or help
    expect(result.exitCode).not.toBe(0);
  });

  test("invalid port number shows error", async () => {
    const result = await cli.run(["start", "--port", "not-a-number"]);

    // Should show validation error
    expect(result.exitCode).not.toBe(0);
  });

  test("non-existent config file shows error", async () => {
    const result = await cli.run(["--config", "/path/that/does/not/exist.json"]);

    expect(result.exitCode).not.toBe(0);
  });
});

describe("CLI - Color and Formatting", () => {
  let cli: CliTester;

  beforeEach(async () => {
    cli = new CliTester({ timeout: 30000 });
  });

  afterEach(async () => {
    await cli.cleanup();
  });

  test("NO_COLOR environment variable is respected", async () => {
    const result = await cli.help();

    // With NO_COLOR set, output should not have ANSI codes
    // The CliTester already sets NO_COLOR=1
    const ansiPattern = new RegExp(String.fromCharCode(27) + "\\[[0-9;]*m");
    const hasAnsiCodes = ansiPattern.test(result.stdout);
    expect(hasAnsiCodes).toBe(false);
  });

  test("help output is properly formatted", async () => {
    const result = await cli.help();

    // Output should have some structure (newlines)
    expect(result.stdout.includes("\n")).toBe(true);
  });
});

describe("CLI - Config Validation", () => {
  let cli: CliTester;
  let env: TestEnvironment;

  beforeEach(async () => {
    cli = new CliTester({ timeout: 30000 });
    env = new TestEnvironment({ name: "config-validate-test", useDocker: false });
  });

  afterEach(async () => {
    await cli.cleanup();
    await env.cleanup();
  });

  test("valid config passes validation", async () => {
    const config = {
      servers: [],
      gateway: { port: 3000, host: "127.0.0.1" },
    };

    const configPath = await env.createTempFile("valid-config.json", JSON.stringify(config));
    const result = await cli.run(["config", "validate", "--config", configPath]);

    // Should not error on valid config
    expect(result.exitCode).toBe(0);
  });

  test("empty config passes validation", async () => {
    const config = { servers: [] };
    const configPath = await env.createTempFile("empty-config.json", JSON.stringify(config));

    const result = await cli.run(["config", "validate", "--config", configPath]);

    expect(result.exitCode).toBe(0);
  });

  test("malformed JSON shows error", async () => {
    const configPath = await env.createTempFile("bad-config.json", "{ invalid json }");

    const result = await cli.run(["config", "validate", "--config", configPath]);

    expect(result.exitCode).not.toBe(0);
  });
});
