/**
 * Streamable HTTP Transport Unit Tests
 */

import { describe, expect, test } from "bun:test";
import { TransportState } from "../../../src/transport/interface.js";
import { StreamableHttpTransport } from "../../../src/transport/streamable-http.js";

describe("StreamableHttpTransport", () => {
  describe("Constructor", () => {
    test("should create transport with required config", () => {
      const transport = new StreamableHttpTransport({
        url: "http://localhost:3000/mcp",
        name: "test-server",
      });

      expect(transport).toBeDefined();
      expect(transport.type).toBe("streamablehttp");
    });

    test("should create transport with custom headers", () => {
      const transport = new StreamableHttpTransport({
        url: "http://localhost:3000/mcp",
        name: "test-server",
        headers: {
          Authorization: "Bearer test-token",
          "X-API-Key": "test-key",
        },
      });

      expect(transport).toBeDefined();
    });

    test("should have correct transport type", () => {
      const transport = new StreamableHttpTransport({
        url: "http://localhost:3000/mcp",
        name: "test-server",
      });

      expect(transport.type).toBe("streamablehttp");
    });
  });

  describe("State Management", () => {
    test("should start in disconnected state", () => {
      const transport = new StreamableHttpTransport({
        url: "http://localhost:3000/mcp",
        name: "test-server",
      });

      expect(transport.state).toBe(TransportState.Disconnected);
    });

    test("should report disconnected when not connected", () => {
      const transport = new StreamableHttpTransport({
        url: "http://localhost:3000/mcp",
        name: "test-server",
      });

      expect(transport.isConnected()).toBe(false);
    });

    test("should throw error when getting client while disconnected", () => {
      const transport = new StreamableHttpTransport({
        url: "http://localhost:3000/mcp",
        name: "test-server",
      });

      expect(() => transport.getClient()).toThrow("Transport not connected");
    });

    test("should return null sessionId when disconnected", () => {
      const transport = new StreamableHttpTransport({
        url: "http://localhost:3000/mcp",
        name: "test-server",
      });

      expect(transport.getSessionId()).toBeNull();
    });
  });

  describe("Configuration", () => {
    test("should store url in config", () => {
      const transport = new StreamableHttpTransport({
        url: "http://localhost:3000/mcp",
        name: "test-server",
      });

      expect((transport as unknown as { config: { url: string } }).config.url).toBe(
        "http://localhost:3000/mcp",
      );
    });

    test("should store name in config", () => {
      const transport = new StreamableHttpTransport({
        url: "http://localhost:3000/mcp",
        name: "test-server",
      });

      expect((transport as unknown as { config: { name: string } }).config.name).toBe(
        "test-server",
      );
    });

    test("should store custom headers in config", () => {
      const customHeaders = {
        Authorization: "Bearer token",
        "X-Custom-Header": "value",
      };

      const transport = new StreamableHttpTransport({
        url: "http://localhost:3000/mcp",
        name: "test-server",
        headers: customHeaders,
      });

      expect(
        (
          transport as unknown as {
            config: { headers?: Record<string, string> };
          }
        ).config.headers,
      ).toEqual(customHeaders);
    });

    test("should handle missing timeout in config", () => {
      const transport = new StreamableHttpTransport({
        url: "http://localhost:3000/mcp",
        name: "test-server",
      });

      expect(
        (transport as unknown as { config: { timeout?: number } }).config.timeout,
      ).toBeUndefined();
    });

    test("should store timeout in config when provided", () => {
      const transport = new StreamableHttpTransport({
        url: "http://localhost:3000/mcp",
        name: "test-server",
        timeout: 30000,
      });

      expect((transport as unknown as { config: { timeout?: number } }).config.timeout).toBe(30000);
    });

    test("should store reconnection options in config", () => {
      const reconnectionOptions = {
        initialReconnectionDelay: 1000,
        maxReconnectionDelay: 30000,
        reconnectionDelayGrowFactor: 1.5,
        maxRetries: 5,
      };

      const transport = new StreamableHttpTransport({
        url: "http://localhost:3000/mcp",
        name: "test-server",
        reconnectionOptions,
      });

      expect(
        (
          transport as unknown as {
            config: { reconnectionOptions?: Record<string, number> };
          }
        ).config.reconnectionOptions,
      ).toEqual(reconnectionOptions);
    });

    test("should use default maxRetries when not provided", () => {
      const transport = new StreamableHttpTransport({
        url: "http://localhost:3000/mcp",
        name: "test-server",
      });

      expect((transport as unknown as { maxReconnectAttempts: number }).maxReconnectAttempts).toBe(
        5,
      );
    });

    test("should use custom maxRetries when provided", () => {
      const transport = new StreamableHttpTransport({
        url: "http://localhost:3000/mcp",
        name: "test-server",
        reconnectionOptions: {
          maxRetries: 10,
        },
      });

      expect((transport as unknown as { maxReconnectAttempts: number }).maxReconnectAttempts).toBe(
        10,
      );
    });
  });

  describe("URL Handling", () => {
    test("should handle http URL", () => {
      const transport = new StreamableHttpTransport({
        url: "http://localhost:3000/mcp",
        name: "test-server",
      });

      expect(transport.type).toBe("streamablehttp");
    });

    test("should handle https URL", () => {
      const transport = new StreamableHttpTransport({
        url: "https://api.example.com/mcp",
        name: "test-server",
      });

      expect(transport.type).toBe("streamablehttp");
    });

    test("should handle URL with path", () => {
      const transport = new StreamableHttpTransport({
        url: "http://localhost:3000/custom/path/mcp",
        name: "test-server",
      });

      expect(transport.type).toBe("streamablehttp");
    });

    test("should handle URL with query parameters", () => {
      const transport = new StreamableHttpTransport({
        url: "http://localhost:3000/mcp?version=2025-11-05",
        name: "test-server",
      });

      expect(transport.type).toBe("streamablehttp");
    });

    test("should handle localhost URL", () => {
      const transport = new StreamableHttpTransport({
        url: "http://127.0.0.1:8080/mcp",
        name: "test-server",
      });

      expect(transport.type).toBe("streamablehttp");
    });

    test("should handle URL with port", () => {
      const transport = new StreamableHttpTransport({
        url: "http://localhost:9000/mcp",
        name: "test-server",
      });

      expect(transport.type).toBe("streamablehttp");
    });
  });

  describe("Authentication Headers", () => {
    test("should support Authorization Bearer token", () => {
      const transport = new StreamableHttpTransport({
        url: "http://localhost:3000/mcp",
        name: "test-server",
        headers: {
          Authorization: "Bearer my-token",
        },
      });

      expect(
        (
          transport as unknown as {
            config: { headers?: Record<string, string> };
          }
        ).config.headers?.Authorization,
      ).toBe("Bearer my-token");
    });

    test("should support X-API-Key header", () => {
      const transport = new StreamableHttpTransport({
        url: "http://localhost:3000/mcp",
        name: "test-server",
        headers: {
          "X-API-Key": "my-api-key",
        },
      });

      expect(
        (
          transport as unknown as {
            config: { headers?: Record<string, string> };
          }
        ).config.headers?.["X-API-Key"],
      ).toBe("my-api-key");
    });

    test("should support multiple custom headers", () => {
      const transport = new StreamableHttpTransport({
        url: "http://localhost:3000/mcp",
        name: "test-server",
        headers: {
          Authorization: "Bearer token",
          "X-Custom-Auth": "custom-value",
          "X-Request-ID": "req-123",
        },
      });

      const headers = (
        transport as unknown as {
          config: { headers?: Record<string, string> };
        }
      ).config.headers;

      expect(headers?.Authorization).toBe("Bearer token");
      expect(headers?.["X-Custom-Auth"]).toBe("custom-value");
      expect(headers?.["X-Request-ID"]).toBe("req-123");
    });

    test("should support Headers object", () => {
      const headers = new Headers({
        Authorization: "Bearer my-token",
        "X-Custom-Header": "value",
      });

      const transport = new StreamableHttpTransport({
        url: "http://localhost:3000/mcp",
        name: "test-server",
        headers,
      });

      expect(
        (
          transport as unknown as {
            config: { headers?: Headers };
          }
        ).config.headers instanceof Headers,
      ).toBe(true);
    });
  });

  describe("Transport Type", () => {
    test("should have streamablehttp type", () => {
      const transport = new StreamableHttpTransport({
        url: "http://localhost:3000/mcp",
        name: "test-server",
      });

      expect(transport.type).toBe("streamablehttp");
    });

    test("should have different type from stdio", () => {
      const transport = new StreamableHttpTransport({
        url: "http://localhost:3000/mcp",
        name: "test-server",
      });

      expect(transport.type).not.toBe("stdio");
    });

    test("should have different type from http/sse", () => {
      const transport = new StreamableHttpTransport({
        url: "http://localhost:3000/mcp",
        name: "test-server",
      });

      expect(transport.type).not.toBe("http");
      expect(transport.type).not.toBe("sse");
    });
  });

  describe("Reconnection Configuration", () => {
    test("should store all reconnection options", () => {
      const options = {
        initialReconnectionDelay: 500,
        maxReconnectionDelay: 15000,
        reconnectionDelayGrowFactor: 2,
        maxRetries: 3,
      };

      const transport = new StreamableHttpTransport({
        url: "http://localhost:3000/mcp",
        name: "test-server",
        reconnectionOptions: options,
      });

      const config = transport as unknown as {
        config: {
          reconnectionOptions?: {
            initialReconnectionDelay?: number;
            maxReconnectionDelay?: number;
            reconnectionDelayGrowFactor?: number;
            maxRetries?: number;
          };
        };
      };

      expect(config.config.reconnectionOptions?.initialReconnectionDelay).toBe(500);
      expect(config.config.reconnectionOptions?.maxReconnectionDelay).toBe(15000);
      expect(config.config.reconnectionOptions?.reconnectionDelayGrowFactor).toBe(2);
      expect(config.config.reconnectionOptions?.maxRetries).toBe(3);
    });

    test("should handle partial reconnection options", () => {
      const transport = new StreamableHttpTransport({
        url: "http://localhost:3000/mcp",
        name: "test-server",
        reconnectionOptions: {
          maxRetries: 8,
        },
      });

      const config = transport as unknown as {
        config: {
          reconnectionOptions?: {
            maxRetries?: number;
          };
        };
      };

      expect(config.config.reconnectionOptions?.maxRetries).toBe(8);
    });
  });
});
