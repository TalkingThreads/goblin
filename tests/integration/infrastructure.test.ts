/**
 * Integration Test Infrastructure Verification
 *
 * Basic tests to verify the test infrastructure is working correctly.
 */

import { describe, expect, test } from "bun:test";
import { createCleanupManager } from "../shared/cleanup.js";
import { createNetworkSimulator } from "../shared/network-simulator.js";
import { createTestClient } from "../shared/test-client.js";
import { createBasicTestServer, TestMcpServer } from "../shared/test-server.js";

describe("Test Infrastructure", () => {
  describe("TestMcpServer", () => {
    test("should create and start a basic server", async () => {
      const server = createBasicTestServer("basic-test");
      expect(server.isRunning()).toBe(false);

      await server.start();
      expect(server.isRunning()).toBe(true);

      await server.stop();
      expect(server.isRunning()).toBe(false);
    });

    test("should add custom tools", async () => {
      const server = new TestMcpServer({ name: "custom-tools" });
      server.addTool(
        "custom_tool",
        "A custom tool",
        { type: "object", properties: { input: { type: "string" } }, required: ["input"] },
        async (args) => ({
          content: [{ type: "text", text: `Custom: ${args.input}` }],
        }),
      );

      await server.start();
      expect(server.isRunning()).toBe(true);

      await server.stop();
    });

    test("should set latency and error rate", async () => {
      const server = new TestMcpServer({ name: "latency-test" });
      server.setLatency(100);
      server.setErrorRate(0.1);

      await server.start();

      await server.stop();
    });
  });

  describe("TestMcpClient", () => {
    test("should create and connect a client", async () => {
      const client = createTestClient("test-client");
      expect(client.isConnected()).toBe(false);

      await client.connect();
      expect(client.isConnected()).toBe(true);

      await client.disconnect();
      expect(client.isConnected()).toBe(false);
    });
  });

  describe("NetworkSimulator", () => {
    test("should create a network simulator", () => {
      const simulator = createNetworkSimulator();
      expect(simulator).toBeDefined();
    });

    test("should set latency", () => {
      const simulator = createNetworkSimulator();
      simulator.setLatency(500);
      expect(simulator.getLatency()).toBe(500);
    });

    test("should set error rate", () => {
      const simulator = createNetworkSimulator();
      simulator.setErrorRate(0.2);
      expect(simulator.getErrorRate()).toBe(0.2);
    });

    test("should track statistics", async () => {
      const simulator = createNetworkSimulator();
      simulator.setLatency(10);

      // Execute some operations
      await simulator.wrap(async () => Promise.resolve("test"));
      await simulator.wrap(async () => Promise.resolve("test2"));

      const stats = simulator.getStats();
      expect(stats.totalRequests).toBe(2);
      expect(stats.averageLatency).toBe(10);
    });

    test("should reset statistics", () => {
      const simulator = createNetworkSimulator();
      simulator.setLatency(100);

      // Execute an operation
      simulator.wrap(async () => Promise.resolve("test"));

      // Reset
      simulator.resetStats();
      const stats = simulator.getStats();
      expect(stats.totalRequests).toBe(0);
    });
  });

  describe("CleanupManager", () => {
    test("should create a cleanup manager", () => {
      const cleanup = createCleanupManager();
      expect(cleanup).toBeDefined();
    });

    test("should track pending cleanup tasks", () => {
      const cleanup = createCleanupManager();
      expect(cleanup.getPendingCount()).toBe(0);

      cleanup.add("test task", async () => {});
      expect(cleanup.getPendingCount()).toBe(1);
    });

    test("should run cleanup tasks", async () => {
      const cleanup = createCleanupManager();
      let cleaned = false;

      cleanup.add("cleanup task", async () => {
        cleaned = true;
      });

      await cleanup.run();
      expect(cleaned).toBe(true);
      expect(cleanup.getPendingCount()).toBe(0);
    });

    test("should handle cleanup errors gracefully", async () => {
      const cleanup = createCleanupManager();

      cleanup.add("failing task", async () => {
        throw new Error("Cleanup failed");
      });

      cleanup.add("success task", async () => {
        // This should still run
      });

      // Should not throw
      await cleanup.run();
    });
  });

  describe("Full Integration Test", () => {
    test("should connect server and client", async () => {
      const server = createBasicTestServer("integration-test");
      const client = createTestClient("integration-client");
      const cleanup = createCleanupManager();

      // Register cleanup
      cleanup.add("stop server", async () => {
        await server.stop();
      });
      cleanup.add("disconnect client", async () => {
        await client.disconnect();
      });

      // Start server
      await server.start();

      // Connect client
      await client.connect();

      // Verify connection
      expect(server.isRunning()).toBe(true);
      expect(client.isConnected()).toBe(true);

      // Cleanup
      await cleanup.run();
    });
  });
});
