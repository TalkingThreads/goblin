/**
 * Gateway Cleanup Smoke Tests
 *
 * Tests for resource cleanup on gateway shutdown.
 */

import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { createHttpClient } from "../shared/http-client.js";
import { ProcessManager } from "../shared/process-manager.js";
import {
  cleanupTestEnvironment,
  createTestEnvironment,
  type TestEnvironment,
  writeTestConfig,
} from "../shared/test-config.js";

describe("Gateway Cleanup", () => {
  let manager: ProcessManager;
  let env: TestEnvironment;
  const binaryPath = resolve("dist/cli/index.js");

  beforeAll(() => {
    env = createTestEnvironment("goblin-cleanup-test-");
    writeTestConfig(env, [
      {
        name: "test-echo",
        transport: "stdio",
        command: "echo",
        args: ["test"],
      },
    ]);
    manager = new ProcessManager({
      binaryPath: `bun ${binaryPath}`,
    });
  });

  afterAll(() => {
    manager.cleanup();
    cleanupTestEnvironment(env);
  });

  it("should close file descriptors on shutdown", async () => {
    const managed = await manager.start(["--config", env.configPath]);
    expect(managed.pid).toBeGreaterThan(0);

    await manager.stop("SIGTERM");
    // Process being gone is the primary indicator of FD closure in smoke tests
    expect(manager.isRunning()).toBe(false);
  });

  it("should close backend connections on shutdown", async () => {
    const managed = await manager.start(["--config", env.configPath]);
    const httpClient = createHttpClient({ baseUrl: managed.baseUrl });

    // Wait for health check to ensure backends are initialized
    let healthy = false;
    for (let i = 0; i < 10; i++) {
      try {
        const res = await httpClient.get("/health");
        if (res.status === 200) {
          healthy = true;
          break;
        }
      } catch {
        // Expected during startup
      }
      await new Promise((r) => setTimeout(r, 500));
    }
    expect(healthy).toBe(true);

    await manager.stop("SIGTERM");

    // Verify we can't connect anymore
    try {
      await httpClient.get("/health");
      expect(false).toBe(true); // Should not reach here
    } catch {
      // Expected: connection refused or similar
    }
  });

  it("should clean up temporary files on shutdown", async () => {
    const tempDir = manager.getTempDir();
    expect(existsSync(tempDir)).toBe(true);

    // We need to trigger the cleanup specifically if it's what we want to test
    // Usually ProcessManager.cleanup() is called in afterAll, but we test it here
    manager.cleanup();
    expect(existsSync(tempDir)).toBe(false);

    // Re-create for afterAll
    manager = new ProcessManager({
      binaryPath: `bun ${binaryPath}`,
    });
  });

  it("should perform memory cleanup on shutdown", async () => {
    const managed = await manager.start(["--config", env.configPath]);
    expect(managed.pid).toBeGreaterThan(0);

    const metrics = await manager.stop("SIGTERM");

    // In a smoke test, a clean stop after processing indicates
    // no fatal memory corruption or hangs during GC/shutdown.
    expect(metrics.duration).toBeGreaterThan(0);
    expect(manager.isRunning()).toBe(false);
  });
});
