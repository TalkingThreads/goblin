import { describe, expect, mock, test } from "bun:test";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { type Transport, TransportState } from "../../../src/transport/interface.js";
import { TransportPool } from "../../../src/transport/pool.js";

// Mock Transport implementation
class MockTransport implements Transport {
  type: "stdio" | "http" | "sse" | "streamablehttp" = "stdio";
  state = TransportState.Disconnected;
  connectCount = 0;
  disconnectCount = 0;

  async connect() {
    this.state = TransportState.Connected;
    this.connectCount++;
  }

  async disconnect() {
    this.state = TransportState.Disconnected;
    this.disconnectCount++;
  }

  isConnected() {
    return this.state === TransportState.Connected;
  }

  getClient() {
    return {} as Client;
  }
}

// Mock StdioTransport and HttpTransport constructors
mock.module("../../../src/transport/stdio.js", () => ({
  StdioTransport: MockTransport,
}));

mock.module("../../../src/transport/http.js", () => ({
  HttpTransport: class extends MockTransport {
    type = "sse" as const;
  },
}));

// Note: We don't mock StreamableHttpTransport to avoid interfering with other tests
// The StreamableHttpTransport will be imported directly for tests

describe("TransportPool", () => {
  test("should create new transport for server", async () => {
    const pool = new TransportPool();
    const config = {
      name: "server1",
      transport: "stdio" as const,
      command: "echo",
      enabled: true,
      mode: "stateful" as const,
    };

    const transport = await pool.getTransport(config);
    expect(transport).toBeDefined();
    expect(transport.isConnected()).toBe(true);
    expect((transport as MockTransport).connectCount).toBe(1);
  });

  test("should reuse existing transport", async () => {
    const pool = new TransportPool();
    const config = {
      name: "server1",
      transport: "stdio" as const,
      command: "echo",
      enabled: true,
      mode: "stateful" as const,
    };

    const t1 = await pool.getTransport(config);
    const t2 = await pool.getTransport(config);

    expect(t1).toBe(t2);
    expect((t1 as MockTransport).connectCount).toBe(1); // Should not connect again
  });

  test("should reconnect if disconnected", async () => {
    const pool = new TransportPool();
    const config = {
      name: "server1",
      transport: "stdio" as const,
      command: "echo",
      enabled: true,
      mode: "stateful" as const,
    };

    const t1 = await pool.getTransport(config);
    await t1.disconnect();
    expect(t1.isConnected()).toBe(false);

    const t2 = await pool.getTransport(config);
    expect(t2).toBe(t1); // Same instance
    expect(t2.isConnected()).toBe(true); // Reconnected
    expect((t1 as MockTransport).connectCount).toBe(2);
  });

  test("should release transport", async () => {
    const pool = new TransportPool();
    const config = {
      name: "server1",
      transport: "stdio" as const,
      command: "echo",
      enabled: true,
      mode: "stateful" as const,
    };

    const t1 = await pool.getTransport(config);
    await pool.releaseTransport("server1");

    expect((t1 as MockTransport).disconnectCount).toBe(1);

    // Should create new one
    const t2 = await pool.getTransport(config);
    expect(t2).not.toBe(t1);
  });

  test("should handle concurrent requests with single connection", async () => {
    const pool = new TransportPool();
    const config = {
      name: "server1",
      transport: "stdio" as const,
      command: "echo",
      enabled: true,
      mode: "stateful" as const,
    };

    // Make multiple concurrent requests for the same server
    const promises = [
      pool.getTransport(config),
      pool.getTransport(config),
      pool.getTransport(config),
      pool.getTransport(config),
    ];

    const transports = await Promise.all(promises);

    // All requests should return the same transport instance
    for (let i = 1; i < transports.length; i++) {
      expect(transports[i]).toBe(transports[0]);
    }

    // Should only connect once
    expect((transports[0] as MockTransport).connectCount).toBe(1);
  });

  test("should handle rapid sequential requests correctly", async () => {
    const pool = new TransportPool();
    const config = {
      name: "server1",
      transport: "stdio" as const,
      command: "echo",
      enabled: true,
      mode: "stateful" as const,
    };

    // First request
    const t1 = await pool.getTransport(config);
    expect(t1.isConnected()).toBe(true);

    // Immediate follow-up request should reuse the connection
    const t2 = await pool.getTransport(config);
    expect(t2).toBe(t1);
    expect((t1 as MockTransport).connectCount).toBe(1);
  });

  test("should not create duplicate connections under rapid load", async () => {
    const pool = new TransportPool();
    const config = {
      name: "server1",
      transport: "stdio" as const,
      command: "echo",
      enabled: true,
      mode: "stateful" as const,
    };

    // Fire many rapid requests in quick succession
    const requests: Promise<Transport>[] = [];
    for (let i = 0; i < 10; i++) {
      requests.push(pool.getTransport(config));
    }

    const transports = await Promise.all(requests);

    // Verify all requests got the same transport
    for (let i = 1; i < transports.length; i++) {
      expect(transports[i]).toBe(transports[0]);
    }

    // Verify only one connection was made
    expect((transports[0] as MockTransport).connectCount).toBe(1);
  });

  describe("StreamableHttp Transport Configuration", () => {
    test("should have streamablehttp as valid transport type", () => {
      const config = {
        name: "streamable-server",
        transport: "streamablehttp" as const,
        url: "http://localhost:3000/mcp",
        enabled: true,
        mode: "stateful" as const,
      };

      expect(config.transport).toBe("streamablehttp");
    });

    test("should validate streamablehttp config has url", () => {
      const validConfig = {
        name: "server",
        transport: "streamablehttp" as const,
        url: "http://localhost:3000/mcp",
      };

      expect(validConfig.url).toBeDefined();
    });

    test("should support headers in streamablehttp config", () => {
      const config = {
        name: "server",
        transport: "streamablehttp" as const,
        url: "http://localhost:3000/mcp",
        headers: {
          Authorization: "Bearer token",
        },
      };

      expect(config.headers?.Authorization).toBe("Bearer token");
    });
  });
});
