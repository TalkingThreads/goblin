/**
 * Test Configuration for Smoke Tests
 *
 * Configuration utilities for smoke test setup and environment.
 */

import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export interface SmokeTestConfig {
  binaryPath: string;
  workingDir: string;
  gatewayPort: number;
  gatewayHost: string;
  startupTimeout: number;
  shutdownTimeout: number;
  healthCheckInterval: number;
  testTimeout: number;
  suiteTimeout: number;
}

export interface TestEnvironment {
  tempDir: string;
  configPath: string;
  logsPath: string;
}

/**
 * Default smoke test configuration
 */
export const DEFAULT_CONFIG: SmokeTestConfig = {
  binaryPath: "node dist/cli/index.js",
  workingDir: "",
  gatewayPort: 0, // Random available port
  gatewayHost: "127.0.0.1",
  startupTimeout: 10000,
  shutdownTimeout: 5000,
  healthCheckInterval: 100,
  testTimeout: 5000,
  suiteTimeout: 60000,
};

/**
 * Create test environment with temp directories
 */
export function createTestEnvironment(prefix: string = "goblin-smoke-"): TestEnvironment {
  const tempDir = mkdtempSync(join(tmpdir(), prefix));
  const configPath = join(tempDir, "config.json");
  const logsPath = join(tempDir, "logs");

  return {
    tempDir,
    configPath,
    logsPath,
  };
}

/**
 * Clean up test environment
 */
export function cleanupTestEnvironment(env: TestEnvironment): void {
  try {
    rmSync(env.tempDir, { recursive: true, force: true });
  } catch {
    // Ignore cleanup errors
  }
}

/**
 * Create minimal test config
 */
export function createTestConfig(
  servers: Array<{
    name: string;
    transport: string;
    command?: string;
    args?: string[];
  }> = [],
): string {
  const config = {
    $schema: "./config.schema.json",
    servers: servers.map((server) => ({
      name: server.name,
      transport: server.transport,
      command: server.command,
      args: server.args,
      enabled: true,
    })),
    gateway: {
      port: 3000,
      host: "127.0.0.1",
    },
    auth: {
      mode: "dev",
    },
    policies: {
      outputSizeLimit: 65536,
      defaultTimeout: 30000,
    },
  };

  return JSON.stringify(config, null, 2);
}

/**
 * Create test config file
 */
export function writeTestConfig(
  env: TestEnvironment,
  servers: Array<{
    name: string;
    transport: string;
    command?: string;
    args?: string[];
  }> = [],
): string {
  const configContent = createTestConfig(servers);
  writeFileSync(env.configPath, configContent);
  return env.configPath;
}

/**
 * Get default test servers for smoke tests
 */
export function getTestServers(): Array<{
  name: string;
  transport: string;
  command?: string;
  args?: string[];
}> {
  return [
    {
      name: "test-echo",
      transport: "stdio",
      command: "echo",
      args: ["test"],
    },
  ];
}

/**
 * Test suite context
 */
export interface SmokeTestSuiteContext {
  config: SmokeTestConfig;
  env: TestEnvironment;
  binaryPath: string;
  baseUrl: string | null;
}

/**
 * Create smoke test suite context
 */
export function createSuiteContext(
  overrides: Partial<SmokeTestConfig> = {},
): SmokeTestSuiteContext {
  const config = { ...DEFAULT_CONFIG, ...overrides };
  const env = createTestEnvironment();

  return {
    config,
    env,
    binaryPath: config.binaryPath,
    baseUrl: null,
  };
}

/**
 * Cleanup smoke test suite context
 */
export function cleanupSuiteContext(context: SmokeTestSuiteContext): void {
  cleanupTestEnvironment(context.env);
}

/**
 * Assertion helpers for common test assertions
 */
export const assertions = {
  /**
   * Assert value is defined and not null
   */
  defined<T>(value: T | null | undefined, message?: string): T {
    if (value === null || value === undefined) {
      throw new Error(message ?? "Expected value to be defined");
    }
    return value;
  },

  /**
   * Assert value is truthy
   */
  truthy(value: unknown, message?: string): void {
    if (!value) {
      throw new Error(message ?? `Expected truthy value but got: ${value}`);
    }
  },

  /**
   * Assert value is falsy
   */
  falsy(value: unknown, message?: string): void {
    if (value) {
      throw new Error(message ?? `Expected falsy value but got: ${value}`);
    }
  },

  /**
   * Assert values are equal
   */
  equal<T>(actual: T, expected: T, message?: string): void {
    if (actual !== expected) {
      throw new Error(message ?? `Expected ${expected} but got ${actual}`);
    }
  },

  /**
   * Assert values are not equal
   */
  notEqual<T>(actual: T, expected: T, message?: string): void {
    if (actual === expected) {
      throw new Error(message ?? `Expected values to be different`);
    }
  },

  /**
   * Assert array is not empty
   */
  notEmpty<T>(array: T[], message?: string): T[] {
    if (array.length === 0) {
      throw new Error(message ?? "Expected non-empty array");
    }
    return array;
  },

  /**
   * Assert string contains substring
   */
  contains(actual: string, expected: string, message?: string): void {
    if (!actual.includes(expected)) {
      throw new Error(message ?? `Expected "${actual}" to contain "${expected}"`);
    }
  },

  /**
   * Assert string matches regex
   */
  matches(actual: string, regex: RegExp, message?: string): void {
    if (!regex.test(actual)) {
      throw new Error(message ?? `Expected "${actual}" to match ${regex}`);
    }
  },

  /**
   * Assert number is within range
   */
  inRange(actual: number, min: number, max: number, message?: string): void {
    if (actual < min || actual > max) {
      throw new Error(message ?? `Expected ${actual} to be between ${min} and ${max}`);
    }
  },

  /**
   * Assert throws error
   */
  throws(fn: () => void, message?: string): void {
    try {
      fn();
      throw new Error(message ?? "Expected function to throw");
    } catch (error) {
      if (error instanceof Error && error.message === (message ?? "Expected function to throw")) {
        throw error;
      }
      // Function threw as expected
    }
  },

  /**
   * Assert does not throw
   */
  notThrows(fn: () => void, message?: string): void {
    try {
      fn();
    } catch (error) {
      throw new Error(
        message ?? `Expected function not to throw but got: ${(error as Error).message}`,
      );
    }
  },
};

/**
 * Timing utilities for tests
 */
export const timing = {
  /**
   * Measure execution time of a function
   */
  async measure<T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> {
    const start = Date.now();
    const result = await fn();
    const duration = Date.now() - start;
    return { result, duration };
  },

  /**
   * Sleep for specified duration
   */
  sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  },

  /**
   * Retry a function until it succeeds or times out
   */
  async retry<T>(fn: () => Promise<T>, maxAttempts: number, interval: number): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        if (attempt < maxAttempts - 1) {
          await timing.sleep(interval);
        }
      }
    }

    throw lastError;
  },
};

/**
 * Skip test decorator
 */
export function skipIf(condition: boolean): void {
  if (condition) {
    throw new Error("SKIP");
  }
}
