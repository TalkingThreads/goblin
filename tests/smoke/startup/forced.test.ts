import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { existsSync } from "node:fs";
import { ProcessManager } from "../shared/process-manager.js";
import {
  cleanupTestEnvironment,
  createTestEnvironment,
  type TestEnvironment,
  writeTestConfig,
} from "../shared/test-config.js";

describe("Forced Shutdown", () => {
  let manager: ProcessManager | null = null;
  let env: TestEnvironment;

  beforeAll(() => {
    env = createTestEnvironment("goblin-forced-test-");
    // Use an empty servers list to avoid connection errors during startup
    writeTestConfig(env, []);
  });

  afterAll(() => {
    if (manager) {
      manager.cleanup();
    }
    cleanupTestEnvironment(env);
  });

  it("should force shutdown after timeout", async () => {
    manager = new ProcessManager({
      shutdownTimeout: 500, // Short but enough for a graceful attempt
    });

    await manager.start(["--config", env.configPath]);
    expect(manager.isRunning()).toBe(true);

    const metrics = await manager.stop("SIGTERM");

    expect(manager.isRunning()).toBe(false);
    expect(metrics.exitCode !== null || metrics.signal !== null).toBe(true);
  }, 10000);

  it("should force shutdown with active requests", async () => {
    manager = new ProcessManager({
      shutdownTimeout: 500,
    });

    const managed = await manager.start(["--config", env.configPath]);
    expect(managed.baseUrl).toBeDefined();

    const metrics = await manager.stop("SIGTERM");

    expect(manager.isRunning()).toBe(false);
    expect(metrics.duration).toBeGreaterThan(0);
  }, 10000);

  it("should cleanup resources after forced shutdown", async () => {
    manager = new ProcessManager();
    await manager.start(["--config", env.configPath]);
    const tempDir = manager.getTempDir();
    expect(existsSync(tempDir)).toBe(true);

    manager.kill();
    expect(manager.isRunning()).toBe(false);

    // Run cleanup
    manager.cleanup();

    // Retry check for Windows handles to be released
    let exists = true;
    for (let i = 0; i < 10; i++) {
      exists = existsSync(tempDir);
      if (!exists) break;
      await new Promise((r) => setTimeout(r, 200));
    }

    expect(exists).toBe(false);
  }, 10000);
});
