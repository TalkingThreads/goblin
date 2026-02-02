/**
 * Gateway Startup Error Smoke Tests
 *
 * Tests for gateway failure modes and error reporting.
 */

import { afterAll, describe, expect, it } from "bun:test";
import { writeFileSync } from "node:fs";
import { createServer } from "node:net";
import { join } from "node:path";
import { ProcessManager } from "../shared/process-manager.js";
import { cleanupSuiteContext, createSuiteContext } from "../shared/test-config.js";

describe("Gateway Startup Errors", () => {
  const context = createSuiteContext();

  afterAll(() => {
    cleanupSuiteContext(context);
  });

  it("should fail when port is already in use", async () => {
    const port = 5000 + Math.floor(Math.random() * 1000);
    const server = createServer();

    // Bind to the port
    await new Promise<void>((resolve, reject) => {
      server.on("error", reject);
      server.listen(port, "127.0.0.1", () => resolve());
    });

    try {
      const manager = new ProcessManager();
      // We expect this to fail because the port is occupied
      // ProcessManager.start rejects if it sees "Error" or "error" in stderr
      await expect(manager.start(["--port", port.toString()])).rejects.toThrow();
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  }, 10000);

  it("should fail with invalid configuration file", async () => {
    const invalidConfigPath = join(context.env.tempDir, "invalid-config.json");
    writeFileSync(invalidConfigPath, "{ invalid json: }");

    const manager = new ProcessManager();
    // We expect this to fail with a parsing error
    await expect(manager.start(["--config", invalidConfigPath])).rejects.toThrow();
  }, 10000);

  it("should fail when configuration validation fails", async () => {
    const invalidConfigPath = join(context.env.tempDir, "validation-fail.json");
    // Invalid according to schema (e.g. servers should be an array)
    writeFileSync(
      invalidConfigPath,
      JSON.stringify({
        servers: "not-an-array",
        gateway: { port: 3000 },
      }),
    );

    const manager = new ProcessManager();
    await expect(manager.start(["--config", invalidConfigPath])).rejects.toThrow();
  }, 10000);

  it("should fail with missing required dependencies", async () => {
    // Testing missing config file when explicitly provided
    const manager = new ProcessManager();
    await expect(manager.start(["--config", "/nonexistent/config.json"])).rejects.toThrow();
  }, 10000);

  it("should provide helpful error messages on port conflict", async () => {
    const port = 6000 + Math.floor(Math.random() * 1000);
    const server = createServer();
    await new Promise<void>((resolve) => server.listen(port, "127.0.0.1", () => resolve()));

    try {
      const manager = new ProcessManager();
      try {
        await manager.start(["--port", port.toString()]);
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        const message = error.message.toLowerCase();
        // Check if it contains relevant error info
        expect(message).toContain("failed");

        // It should mention address or port or the specific error code
        const hasRelevance =
          message.includes("port") || message.includes("address") || message.includes("eaddrinuse");
        expect(hasRelevance).toBe(true);
      }
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  }, 10000);

  it("should provide helpful error messages on invalid config", async () => {
    const invalidConfigPath = join(context.env.tempDir, "helpful-invalid.json");
    writeFileSync(invalidConfigPath, "{ missing bracket");

    const manager = new ProcessManager();
    try {
      await manager.start(["--config", invalidConfigPath]);
      expect(true).toBe(false); // Should not reach here
    } catch (error: any) {
      const message = error.message.toLowerCase();
      expect(message).toContain("config");
      // Could be 'parsing' or 'validation' depending on the exact failure
      const hasRelevance =
        message.includes("parsing") || message.includes("validation") || message.includes("fail");
      expect(hasRelevance).toBe(true);
    }
  }, 10000);
});
