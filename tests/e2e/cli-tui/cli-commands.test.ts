/**
 * CLI Commands E2E Tests
 *
 * Tests CLI command execution, output formatting, and error display.
 */

import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { CliTester } from "../shared/cli-tester.js";
import { TestEnvironment } from "../shared/environment.js";

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
    expect(result.stdout).toMatch(/\d+\.\d+\.\d+/);
  });
});
