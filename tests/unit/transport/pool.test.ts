import { describe, expect, mock, test } from "bun:test";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { type Transport, TransportState } from "../../../src/transport/interface.js";
import { TransportPool } from "../../../src/transport/pool.js";

// Mock Transport implementation
class MockTransport implements Transport {
  type: "stdio" | "http" | "sse" = "stdio";
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

describe("TransportPool", () => {
  test("should create new transport for server", async () => {
    const pool = new TransportPool();
    const config = {
      name: "server1",
      transport: "stdio" as const,
      command: "echo",
      enabled: true,
    };

    const transport = await pool.getTransport(config);
    expect(transport).toBeDefined();
    expect(transport.isConnected()).toBe(true);
    expect((transport as any).connectCount).toBe(1);
  });

  test("should reuse existing transport", async () => {
    const pool = new TransportPool();
    const config = {
      name: "server1",
      transport: "stdio" as const,
      command: "echo",
      enabled: true,
    };

    const t1 = await pool.getTransport(config);
    const t2 = await pool.getTransport(config);

    expect(t1).toBe(t2);
    expect((t1 as any).connectCount).toBe(1); // Should not connect again
  });

  test("should reconnect if disconnected", async () => {
    const pool = new TransportPool();
    const config = {
      name: "server1",
      transport: "stdio" as const,
      command: "echo",
      enabled: true,
    };

    const t1 = await pool.getTransport(config);
    await t1.disconnect();
    expect(t1.isConnected()).toBe(false);

    const t2 = await pool.getTransport(config);
    expect(t2).toBe(t1); // Same instance
    expect(t2.isConnected()).toBe(true); // Reconnected
    expect((t1 as any).connectCount).toBe(2);
  });

  test("should release transport", async () => {
    const pool = new TransportPool();
    const config = {
      name: "server1",
      transport: "stdio" as const,
      command: "echo",
      enabled: true,
    };

    const t1 = await pool.getTransport(config);
    await pool.releaseTransport("server1");

    expect((t1 as any).disconnectCount).toBe(1);

    // Should create new one
    const t2 = await pool.getTransport(config);
    expect(t2).not.toBe(t1);
  });
});
