/**
 * MCP Ping/Pong Compliance Tests
 *
 * Tests that verify Goblin correctly implements ping/pong
 * per the MCP 2025-11-25 protocol specification.
 */

import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { CleanupManager } from "../../shared/cleanup.js";
import { createTestEnvironment } from "../../shared/environment.js";

describe("MCP Ping/Pong Compliance", () => {
  let cleanup: CleanupManager;
  let env: ReturnType<typeof createTestEnvironment>;
  let port: number;

  beforeEach(async () => {
    cleanup = new CleanupManager();
    env = createTestEnvironment({ name: "ping-compliance", useDocker: false });
    port = await env.getFreePort();
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("should respond to ping request with empty result", async () => {
    const config = env.createGatewayConfig([]);
    config.gateway.port = port;
    config.gateway.host = "127.0.0.1";

    const gatewayProcess = await env.startGoblinGateway(config);
    cleanup.add("Kill gateway process", () => {
      gatewayProcess.kill();
    });

    await env.waitForGatewayReady(port);

    // First initialize the connection
    await fetch(`http://127.0.0.1:${port}/mcp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "MCP-Protocol-Version": "2025-11-25",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2025-11-25",
          capabilities: {},
          clientInfo: { name: "test-client", version: "1.0.0" },
        },
      }),
    });

    await fetch(`http://127.0.0.1:${port}/mcp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "MCP-Protocol-Version": "2025-11-25",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "notifications/initialized",
      }),
    });

    // Send ping request
    const pingResponse = await fetch(`http://127.0.0.1:${port}/mcp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "MCP-Protocol-Version": "2025-11-25",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 2,
        method: "ping",
      }),
    });

    expect(pingResponse.status).toBe(200);
    const data = (await pingResponse.json()) as { result: Record<string, never> };
    expect(data.result).toBeDefined();
    expect(Object.keys(data.result).length).toBe(0); // Empty result per spec
  });

  test("should respond to ping quickly (< 10ms)", async () => {
    const config = env.createGatewayConfig([]);
    config.gateway.port = port;
    config.gateway.host = "127.0.0.1";

    const gatewayProcess = await env.startGoblinGateway(config);
    cleanup.add("Kill gateway process", () => {
      gatewayProcess.kill();
    });

    await env.waitForGatewayReady(port);

    // Initialize
    await fetch(`http://127.0.0.1:${port}/mcp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "MCP-Protocol-Version": "2025-11-25",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2025-11-25",
          capabilities: {},
          clientInfo: { name: "test-client", version: "1.0.0" },
        },
      }),
    });

    await fetch(`http://127.0.0.1:${port}/mcp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "MCP-Protocol-Version": "2025-11-25",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "notifications/initialized",
      }),
    });

    // Time the ping response
    const startTime = performance.now();
    await fetch(`http://127.0.0.1:${port}/mcp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "MCP-Protocol-Version": "2025-11-25",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 2,
        method: "ping",
      }),
    });
    const pingDuration = performance.now() - startTime;

    expect(pingDuration).toBeLessThan(10);
  });

  test("should handle multiple consecutive pings", async () => {
    const config = env.createGatewayConfig([]);
    config.gateway.port = port;
    config.gateway.host = "127.0.0.1";

    const gatewayProcess = await env.startGoblinGateway(config);
    cleanup.add("Kill gateway process", () => {
      gatewayProcess.kill();
    });

    await env.waitForGatewayReady(port);

    // Initialize
    await fetch(`http://127.0.0.1:${port}/mcp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "MCP-Protocol-Version": "2025-11-25",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2025-11-25",
          capabilities: {},
          clientInfo: { name: "test-client", version: "1.0.0" },
        },
      }),
    });

    await fetch(`http://127.0.0.1:${port}/mcp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "MCP-Protocol-Version": "2025-11-25",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "notifications/initialized",
      }),
    });

    // Send multiple pings
    for (let i = 0; i < 10; i++) {
      const response = await fetch(`http://127.0.0.1:${port}/mcp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "MCP-Protocol-Version": "2025-11-25",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: i + 2,
          method: "ping",
        }),
      });

      expect(response.status).toBe(200);
      const data = (await response.json()) as { result: Record<string, never> };
      expect(data.result).toBeDefined();
    }
  });
});
