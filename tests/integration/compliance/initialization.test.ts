/**
 * MCP Initialization Compliance Tests
 *
 * Tests that verify Goblin correctly implements the MCP initialization
 * handshake per the 2025-11-25 protocol specification.
 */

import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { CleanupManager } from "../../shared/cleanup.js";
import { createTestEnvironment } from "../../shared/environment.js";

describe("MCP Initialization Compliance", () => {
  let cleanup: CleanupManager;
  let env: ReturnType<typeof createTestEnvironment>;

  beforeEach(async () => {
    cleanup = new CleanupManager();
    env = createTestEnvironment({ name: "init-compliance", useDocker: false });
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("should complete initialization handshake within 500ms", async () => {
    const config = env.createGatewayConfig([]);
    config.gateway.host = "127.0.0.1";

    const gatewayProcess = await env.startGoblinGateway(config);
    cleanup.add("Kill gateway process", () => {
      gatewayProcess.kill();
    });

    const actualPort = await env.waitForGatewayReady(config.gateway.port ?? 3000);

    const initRequest = {
      jsonrpc: "2.0" as const,
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2025-11-25",
        capabilities: {},
        clientInfo: { name: "test-client", version: "1.0.0" },
      },
    };

    const startTime = Date.now();
    const response = await fetch(`http://127.0.0.1:${actualPort}/mcp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
        "MCP-Protocol-Version": "2025-11-25",
      },
      body: JSON.stringify(initRequest),
    });
    const initDuration = Date.now() - startTime;

    expect(response.status).toBe(200);
    expect(initDuration).toBeLessThan(500);

    const data = (await response.json()) as {
      result: {
        protocolVersion: string;
        capabilities: Record<string, unknown>;
        serverInfo: { name: string; version: string };
      };
    };

    expect(data.result.protocolVersion).toBeDefined();
    expect(data.result.capabilities).toBeDefined();
    expect(data.result.serverInfo).toBeDefined();

    await fetch(`http://127.0.0.1:${actualPort}/mcp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
        "MCP-Protocol-Version": "2025-11-25",
      },
      body: JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }),
    });
  });

  test("should negotiate protocol version correctly", async () => {
    const config = env.createGatewayConfig([]);
    config.gateway.host = "127.0.0.1";

    const gatewayProcess = await env.startGoblinGateway(config);
    cleanup.add("Kill gateway process", () => {
      gatewayProcess.kill();
    });

    const actualPort = await env.waitForGatewayReady(config.gateway.port ?? 3000);

    const response = await fetch(`http://127.0.0.1:${actualPort}/mcp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
        "MCP-Protocol-Version": "2024-11-05",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          capabilities: {},
          clientInfo: { name: "test", version: "1.0" },
        },
      }),
    });

    expect(response.status).toBe(200);
    const data = (await response.json()) as { result: { protocolVersion: string } };
    expect(["2025-11-25", "2024-11-05"]).toContain(data.result.protocolVersion);
  });

  test("should reject unsupported protocol version", async () => {
    const config = env.createGatewayConfig([]);
    config.gateway.host = "127.0.0.1";

    const gatewayProcess = await env.startGoblinGateway(config);
    cleanup.add("Kill gateway process", () => {
      gatewayProcess.kill();
    });

    const actualPort = await env.waitForGatewayReady(config.gateway.port ?? 3000);

    const response = await fetch(`http://127.0.0.1:${actualPort}/mcp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
        "MCP-Protocol-Version": "2023-01-01",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2023-01-01",
          capabilities: {},
          clientInfo: { name: "test", version: "1.0" },
        },
      }),
    });

    expect(response.status).toBe(400);
    const data = (await response.json()) as { error: { code: number; message: string } };
    expect(data.error.code).toBe(-32602);
  });

  test("should reject requests before initialized notification", async () => {
    const config = env.createGatewayConfig([]);
    config.gateway.host = "127.0.0.1";

    const gatewayProcess = await env.startGoblinGateway(config);
    cleanup.add("Kill gateway process", () => {
      gatewayProcess.kill();
    });

    const actualPort = await env.waitForGatewayReady(config.gateway.port ?? 3000);

    await fetch(`http://127.0.0.1:${actualPort}/mcp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
        "MCP-Protocol-Version": "2025-11-25",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2025-11-25",
          capabilities: {},
          clientInfo: { name: "test", version: "1.0" },
        },
      }),
    });

    const toolsResponse = await fetch(`http://127.0.0.1:${actualPort}/mcp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
        "MCP-Protocol-Version": "2025-11-25",
      },
      body: JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} }),
    });

    const toolsData = (await toolsResponse.json()) as { error: { code: number } };
    expect(toolsData.error.code).toBe(-32600);
  });

  test("should accept requests after initialized notification", async () => {
    const config = env.createGatewayConfig([]);
    config.gateway.host = "127.0.0.1";

    const gatewayProcess = await env.startGoblinGateway(config);
    cleanup.add("Kill gateway process", () => {
      gatewayProcess.kill();
    });

    const actualPort = await env.waitForGatewayReady(config.gateway.port ?? 3000);

    await fetch(`http://127.0.0.1:${actualPort}/mcp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
        "MCP-Protocol-Version": "2025-11-25",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2025-11-25",
          capabilities: {},
          clientInfo: { name: "test", version: "1.0" },
        },
      }),
    });

    await fetch(`http://127.0.0.1:${actualPort}/mcp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
        "MCP-Protocol-Version": "2025-11-25",
      },
      body: JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }),
    });

    const toolsResponse = await fetch(`http://127.0.0.1:${actualPort}/mcp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
        "MCP-Protocol-Version": "2025-11-25",
      },
      body: JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} }),
    });

    expect(toolsResponse.status).toBe(200);
    const toolsData = (await toolsResponse.json()) as { result: { tools: unknown[] } };
    expect(Array.isArray(toolsData.result.tools)).toBe(true);
  });

  test("should advertise correct capabilities", async () => {
    const config = env.createGatewayConfig([]);
    config.gateway.host = "127.0.0.1";

    const gatewayProcess = await env.startGoblinGateway(config);
    cleanup.add("Kill gateway process", () => {
      gatewayProcess.kill();
    });

    const actualPort = await env.waitForGatewayReady(config.gateway.port ?? 3000);

    const response = await fetch(`http://127.0.0.1:${actualPort}/mcp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
        "MCP-Protocol-Version": "2025-11-25",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2025-11-25",
          capabilities: {},
          clientInfo: { name: "test", version: "1.0" },
        },
      }),
    });

    const data = (await response.json()) as {
      result: {
        capabilities: { tools?: { listChanged?: boolean }; resources?: { subscribe?: boolean } };
      };
    };
    expect(data.result.capabilities.tools?.listChanged).toBe(true);
    expect(data.result.capabilities.resources?.subscribe).toBe(true);
  });
});
