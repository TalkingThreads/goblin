/**
 * Graceful Shutdown Smoke Tests
 *
 * Tests for gateway graceful shutdown on signals
 */

import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { createHttpClient } from "../shared/http-client.js";
import { ProcessManager } from "../shared/process-manager.js";
import {
  cleanupTestEnvironment,
  createTestEnvironment,
  writeTestConfig,
} from "../shared/test-config.js";

describe("Graceful Shutdown", () => {
  let processManager: ProcessManager;
  let testEnv: any;
  let configPath: string;

  beforeAll(() => {
    testEnv = createTestEnvironment();
    configPath = writeTestConfig(testEnv);
    processManager = new ProcessManager({
      startupTimeout: 15000,
      shutdownTimeout: 10000,
    });
  });

  afterAll(() => {
    processManager.cleanup();
    cleanupTestEnvironment(testEnv);
  });

  it("should shutdown on SIGTERM", async () => {
    await processManager.start(["--config", configPath]);
    expect(processManager.isRunning()).toBe(true);

    const metrics = await processManager.stop("SIGTERM");
    expect(processManager.isRunning()).toBe(false);
    // On Windows signals might not result in exit code 0
    expect(metrics.exitCode === 0 || metrics.signal === "SIGTERM").toBe(true);
  });

  it("should shutdown on SIGINT", async () => {
    await processManager.start(["--config", configPath]);
    expect(processManager.isRunning()).toBe(true);

    const metrics = await processManager.stop("SIGINT");
    expect(processManager.isRunning()).toBe(false);
    expect(metrics.exitCode === 0 || metrics.signal === "SIGINT").toBe(true);
  });

  it("should shutdown with active connections", async () => {
    const managed = await processManager.start(["--config", configPath]);
    const client = createHttpClient({ baseUrl: managed.baseUrl });

    // Establish an SSE connection which is long-lived
    // Using a side effect to keep the connection open
    let sseError: any = null;
    const ssePromise = client.get("/sse").catch((err) => {
      sseError = err;
    });

    // Small delay to ensure connection is established
    await new Promise((r) => setTimeout(r, 1000));

    const metrics = await processManager.stop("SIGTERM");
    expect(processManager.isRunning()).toBe(false);
    expect(metrics.exitCode === 0 || metrics.signal === "SIGTERM").toBe(true);

    // Wait for SSE to realize it's closed
    await ssePromise;
    expect(sseError).toBeDefined();
  });

  it("should wait for in-flight requests", async () => {
    const managed = await processManager.start(["--config", configPath]);
    const client = createHttpClient({ baseUrl: managed.baseUrl });

    // Start a request to /status which should be fast,
    // but we want to see it completes even if shutdown is triggered.
    const requestPromise = client.get("/status");

    // Small delay to ensure request is being processed
    await new Promise((r) => setTimeout(r, 10));

    const metricsPromise = processManager.stop("SIGTERM");

    // Both should complete
    const [response, metrics] = await Promise.all([requestPromise, metricsPromise]);

    expect(response.status).toBe(200);
    expect(processManager.isRunning()).toBe(false);
    expect(metrics.exitCode === 0 || metrics.signal === "SIGTERM").toBe(true);
  });
});
