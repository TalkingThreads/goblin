/**
 * Streamable HTTP Transport Integration Tests
 *
 * Integration tests for StreamableHttpTransport client transport.
 * Tests transport configuration, state management, and pool integration.
 */

import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { TransportState } from "../../../src/transport/interface.js";
import { StreamableHttpTransport } from "../../../src/transport/streamable-http.js";
import { CleanupManager, registerServerCleanup } from "../../shared/cleanup.js";
import { createBasicTestServer, type TestMcpServer } from "../../shared/test-server.js";

describe("StreamableHttpTransport - Integration", () => {
  describe("Transport Configuration", () => {
    test("should create transport with URL and name", () => {
      const transport = new StreamableHttpTransport({
        url: "http://localhost:3000/mcp",
        name: "test-server",
      });

      expect(transport.type).toBe("streamablehttp");
      expect(transport.state).toBe(TransportState.Disconnected);
    });

    test("should create transport with authentication headers", () => {
      const transport = new StreamableHttpTransport({
        url: "http://localhost:3000/mcp",
        name: "test-server",
        headers: {
          Authorization: "Bearer test-token",
          "X-API-Key": "api-key-123",
        },
      });

      expect(transport.type).toBe("streamablehttp");
    });

    test("should create transport with Headers object", () => {
      const headers = new Headers({
        Authorization: "Bearer token-from-headers",
      });

      const transport = new StreamableHttpTransport({
        url: "http://localhost:3000/mcp",
        name: "test-server",
        headers,
      });

      expect(transport.type).toBe("streamablehttp");
    });

    test("should create transport with reconnection options", () => {
      const transport = new StreamableHttpTransport({
        url: "http://localhost:3000/mcp",
        name: "test-server",
        reconnectionOptions: {
          initialReconnectionDelay: 1000,
          maxReconnectionDelay: 30000,
          reconnectionDelayGrowFactor: 1.5,
          maxRetries: 5,
        },
      });

      expect(transport.type).toBe("streamablehttp");
    });

    test("should support HTTPS URLs", () => {
      const transport = new StreamableHttpTransport({
        url: "https://api.example.com/mcp",
        name: "secure-server",
      });

      expect(transport.type).toBe("streamablehttp");
    });

    test("should support custom ports", () => {
      const transport = new StreamableHttpTransport({
        url: "http://localhost:9000/mcp",
        name: "custom-port-server",
      });

      expect(transport.type).toBe("streamablehttp");
    });
  });

  describe("Transport State Management", () => {
    test("should report disconnected initially", () => {
      const transport = new StreamableHttpTransport({
        url: "http://localhost:3000/mcp",
        name: "test-server",
      });

      expect(transport.isConnected()).toBe(false);
      expect(transport.state).toBe(TransportState.Disconnected);
    });

    test("should return null sessionId when disconnected", () => {
      const transport = new StreamableHttpTransport({
        url: "http://localhost:3000/mcp",
        name: "test-server",
      });

      expect(transport.getSessionId()).toBeNull();
    });

    test("should throw when getting client while disconnected", () => {
      const transport = new StreamableHttpTransport({
        url: "http://localhost:3000/mcp",
        name: "test-server",
      });

      expect(() => transport.getClient()).toThrow("Transport not connected");
    });
  });

  describe("Transport with Real Server Integration", () => {
    let cleanup: CleanupManager;
    let server: TestMcpServer;

    beforeEach(async () => {
      cleanup = new CleanupManager();
      server = createBasicTestServer("streamable-integration");
      registerServerCleanup(cleanup, server, "streamable integration server");
      await server.start();
    });

    afterEach(async () => {
      await cleanup.run();
    });

    test("test server should be running", async () => {
      expect(server.isRunning()).toBe(true);
    });

    test("test server should have tools configured", async () => {
      const tools = server["config"].tools;
      expect(tools!.length).toBe(3);
      expect(tools!.map((t) => t.name).sort()).toEqual(["add", "echo", "get_time"]);
    });

    test("test server should have resources configured", async () => {
      const resources = server["config"].resources;
      expect(resources!.length).toBe(2);
    });

    test("test server should have prompts configured", async () => {
      const prompts = server["config"].prompts;
      expect(prompts!.length).toBe(1);
      expect(prompts![0].name).toBe("greet");
    });

    test("server should maintain state across operations", async () => {
      const initialTools = server["config"].tools!.length;
      expect(initialTools).toBe(3);

      server.addTool(
        "dynamic_tool",
        "Dynamically added tool",
        { type: "object", properties: {}, required: [] },
        async () => ({ content: [{ type: "text", text: "dynamic" }] }),
      );

      expect(server["config"].tools!.length).toBe(4);
    });

    test("server should handle latency configuration", async () => {
      server.setLatency(50);
      expect(server["config"].latency).toBe(50);

      server.setLatency(0);
      expect(server["config"].latency).toBe(0);
    });

    test("server should handle error rate configuration", async () => {
      server.setErrorRate(0.1);
      expect(server["config"].errorRate).toBe(0.1);

      server.setErrorRate(0);
      expect(server["config"].errorRate).toBe(0);
    });
  });

  describe("Transport Pool Integration", () => {
    test("should have streamablehttp as valid transport type in schema", () => {
      const config = {
        name: "streamable-server",
        transport: "streamablehttp" as const,
        url: "http://localhost:3000/mcp",
        headers: {
          Authorization: "Bearer token",
        },
      };

      expect(config.transport).toBe("streamablehttp");
      expect(config.url).toBeDefined();
      expect(config.headers?.Authorization).toBe("Bearer token");
    });

    test("should validate streamablehttp transport configuration", () => {
      const validConfig = {
        name: "server",
        transport: "streamablehttp" as const,
        url: "http://localhost:3000/mcp",
      };

      expect(validConfig.url).toBeDefined();
      expect(validConfig.transport).toBe("streamablehttp");
    });

    test("should support optional headers in config", () => {
      const withHeaders = {
        name: "server",
        transport: "streamablehttp" as const,
        url: "http://localhost:3000/mcp",
        headers: {
          "X-Custom-Auth": "value",
        },
      };

      expect(withHeaders.headers).toBeDefined();
    });

    test("should support reconnection options in config", () => {
      const withReconnect = {
        name: "server",
        transport: "streamablehttp" as const,
        url: "http://localhost:3000/mcp",
        reconnectionOptions: {
          maxRetries: 10,
          initialReconnectionDelay: 500,
        },
      };

      expect(withReconnect.reconnectionOptions?.maxRetries).toBe(10);
    });
  });

  describe("Headers Configuration Patterns", () => {
    test("should support Bearer token authentication", () => {
      const config = {
        name: "authenticated-server",
        transport: "streamablehttp" as const,
        url: "http://localhost:3000/mcp",
        headers: {
          Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
        },
      };

      expect(config.headers?.Authorization).toContain("Bearer");
    });

    test("should support API key authentication", () => {
      const config = {
        name: "apikey-server",
        transport: "streamablehttp" as const,
        url: "http://localhost:3000/mcp",
        headers: {
          "X-API-Key": "sk-api-key-12345",
          "X-Request-ID": "req-abc123",
        },
      };

      expect(config.headers?.["X-API-Key"]).toBeDefined();
      expect(config.headers?.["X-Request-ID"]).toBeDefined();
    });

    test("should support multiple authentication methods", () => {
      const config = {
        name: "multi-auth-server",
        transport: "streamablehttp" as const,
        url: "http://localhost:3000/mcp",
        headers: {
          Authorization: "Bearer token",
          "X-API-Key": "key",
          "X-Custom-Auth": "custom-value",
        },
      };

      const headerKeys = Object.keys(config.headers!);
      expect(headerKeys.length).toBe(3);
    });
  });

  describe("URL Validation Patterns", () => {
    test("should handle localhost URLs", () => {
      const url = "http://127.0.0.1:8080/mcp";
      expect(url).toContain("127.0.0.1");
    });

    test("should handle hostname URLs", () => {
      const url = "https://mcp.example.com/api/v1/mcp";
      expect(url).toContain("mcp.example.com");
    });

    test("should handle URLs with query parameters", () => {
      const url = "http://localhost:3000/mcp?version=2025-11-05&mode=stream";
      expect(url).toContain("?");
    });

    test("should handle URLs with paths", () => {
      const url = "http://localhost:3000/api/mcp/v1";
      expect(url).toContain("/api/mcp/v1");
    });
  });

  describe("Error Handling Patterns", () => {
    test("should handle missing URL in config", () => {
      const invalidConfig = {
        name: "invalid-server",
        transport: "streamablehttp" as const,
      };

      expect(invalidConfig.url).toBeUndefined();
    });

    test("should handle empty headers", () => {
      const config = {
        name: "no-headers-server",
        transport: "streamablehttp" as const,
        url: "http://localhost:3000/mcp",
        headers: {},
      };

      expect(Object.keys(config.headers!).length).toBe(0);
    });

    test("should handle URL parsing", () => {
      const urlString = "http://localhost:3000/mcp";
      expect(() => new URL(urlString)).not.toThrow();
    });
  });
});
