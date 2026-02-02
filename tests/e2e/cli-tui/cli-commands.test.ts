/**
 * CLI Commands E2E Tests
 *
 * Tests CLI command execution, output formatting, and error display.
 */

import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { CliTester } from "../shared/cli-tester.js";
import { TestEnvironment } from "../shared/environment.js";
import { createSampleProject, getSampleProject } from "../shared/fixtures.js";

describe("CLI - Command Execution", () => {
  let cli: CliTester;
  let env: TestEnvironment;

  beforeEach(async () => {
    cli = new CliTester({ timeout: 30000 });
    env = new TestEnvironment({ name: "cli-test", useDocker: false });
  });

  afterEach(async () => {
    await cli.cleanup();
    await env.cleanup();
  });

  test("help command executes successfully", async () => {
    const result = await cli.help();

    expect(result.exitCode).toBe(0);
    expect(result.stdout.length).toBeGreaterThan(0);
  });

  test("version command executes successfully", async () => {
    const result = await cli.version();

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("goblin");
  });

  test("unknown command shows error", async () => {
    const result = await cli.run(["unknown-command"]);

    expect(result.exitCode).toBeGreaterThan(0);
    expect(result.stderr.length).toBeGreaterThan(0);
  });

  test("help output contains all commands", async () => {
    const result = await cli.help();

    expect(result.stdout).toContain("start");
    expect(result.stdout).toContain("status");
    expect(result.stdout).toContain("tools");
    expect(result.stdout).toContain("servers");
  });
});

describe("CLI - Output Formatting", () => {
  let cli: CliTester;

  beforeEach(async () => {
    cli = new CliTester({ timeout: 30000 });
  });

  afterEach(async () => {
    await cli.cleanup();
  });

  test("JSON output is valid JSON", async () => {
    const result = await cli.runJson(["--version"]);

    expect(typeof result).toBe("object");
    expect(result).toHaveProperty("version");
  });

  test("error output contains helpful message", async () => {
    const result = await cli.run(["invalid-option"]);

    expect(result.exitCode).toBeGreaterThan(0);
    // Error should contain some indication of what went wrong
    expect(result.stderr.length).toBeGreaterThan(0);
  });

  test("NO_COLOR disables colors", async () => {
    const result = await cli.help();

    // When NO_COLOR is set, output should not contain ANSI escape codes
    const ansiPattern = new RegExp(String.fromCharCode(27) + "\\[[0-9;]*m");
    expect(result.stdout).not.toMatch(ansiPattern);
  });
});

describe("CLI - Server Management", () => {
  let cli: CliTester;
  let env: TestEnvironment;

  beforeEach(async () => {
    cli = new CliTester({ timeout: 30000 });
    env = new TestEnvironment({ name: "cli-server-test", useDocker: false });
  });

  afterEach(async () => {
    await cli.cleanup();
    await env.cleanup();
  });

  test("servers command help is available", async () => {
    // This would require a running gateway - just verify the command exists
    const result = await cli.run(["--help"]);

    expect(result.stdout).toContain("servers");
  });

  test("tools command shows help", async () => {
    const result = await cli.run(["tools", "--help"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("--server");
    expect(result.stdout).toContain("--search");
  });

  test("status command shows help", async () => {
    const result = await cli.run(["status", "--help"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("--url");
    expect(result.stdout).toContain("--json");
  });

  test("health command shows help", async () => {
    const result = await cli.run(["health", "--help"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("--url");
    expect(result.stdout).toContain("--json");
  });
});

describe("CLI - Configuration", () => {
  let cli: CliTester;
  let env: TestEnvironment;

  beforeEach(async () => {
    cli = new CliTester({ timeout: 30000 });
    env = new TestEnvironment({ name: "cli-config-test", useDocker: false });
  });

  afterEach(async () => {
    await cli.cleanup();
    await env.cleanup();
  });

  test("config validate with valid config", async () => {
    const config = {
      servers: [],
      gateway: { port: 3000, host: "127.0.0.1" },
    };

    // Create a valid config file
    const configPath = await env.createTempFile("config.json", JSON.stringify(config));

    const result = await cli.run(["config", "validate", "--config", configPath]);

    // Should not error on valid config
    expect(result.exitCode).toBe(0);
  });

  test("config show outputs JSON", async () => {
    const configPath = await env.createTempFile(
      "config.json",
      JSON.stringify({ servers: [], gateway: { port: 3000 } }),
    );

    const result = await cli.run(["config", "show", "--config", configPath, "--json"]);

    expect(result.exitCode).toBe(0);
    expect(() => JSON.parse(result.stdout)).not.toThrow();
  });

  test("logs command shows help", async () => {
    const result = await cli.run(["logs", "--help"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("--level");
    expect(result.stdout).toContain("--follow");
    expect(result.stdout).toContain("--json");
  });
});

describe("CLI - Integration with Sample Projects", () => {
  let cli: CliTester;
  let env: TestEnvironment;
  let projectDir: string;

  beforeEach(async () => {
    cli = new CliTester({ timeout: 30000 });
    env = new TestEnvironment({ name: "cli-project-test", useDocker: false });
    projectDir = await env.createTempDirectory("project-");

    const project = getSampleProject("simple-node");
    if (project) {
      await createSampleProject(projectDir, project);
    }
  });

  afterEach(async () => {
    await cli.cleanup();
    await env.cleanup();
  });

  test("can read project files", async () => {
    const packageJsonPath = `${projectDir}/package.json`;
    const fs = await import("node:fs");
    const content = fs.readFileSync(packageJsonPath, "utf-8");

    expect(content).toContain("simple-node");
  });

  test("project structure is correct", async () => {
    const fs = await import("node:fs");
    const files = fs.readdirSync(projectDir);

    expect(files).toContain("package.json");
    expect(files).toContain("index.js");
    expect(files).toContain("README.md");
  });
});
