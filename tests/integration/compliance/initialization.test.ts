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
  let port: number;

  beforeEach(async () => {
    cleanup = new CleanupManager();
    env = createTestEnvironment({ name: "init-compliance", useDocker: false });
    port = await env.getFreePort();
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("should complete initialization handshake within 500ms", async () => {
    const config = env.createGatewayConfig([]);
    config.gateway.port = port;
    config.gateway.host = "127.0.0.1";

    const gatewayProcess = await env.startGoblinGateway(config);
    cleanup.add("Kill gateway process", () => {
      gatewayProcess.kill();
    });

    await env.waitForGatewayReady(port);

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
    const response = await fetch(`http://127.0.0.1:${port}/mcp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
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

    // Verify response format per MCP spec
    expect(data.result.protocolVersion).toBeDefined();
    expect(data.result.capabilities).toBeDefined();
    expect(data.result.serverInfo).toBeDefined();
    expect(data.result.serverInfo.name).toBeDefined();
    expect(data.result.serverInfo.version).toBeDefined();

    // Send initialized notification
    const initNotification = {
      jsonrpc: "2.0" as const,
      method: "notifications/initialized",
    };

    await fetch(`http://127.0.0.1:${port}/mcp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "MCP-Protocol-Version": "2025-11-25",
      },
      body: JSON.stringify(initNotification),
    });
  });

  test("should negotiate protocol version correctly", async () => {
    const config = env.createGatewayConfig([]);
    config.gateway.port = port;
    config.gateway.host = "127.0.0.1";

    const gatewayProcess = await env.startGoblinGateway(config);
    cleanup.add("Kill gateway process", () => {
      gatewayProcess.kill();
    });

    await env.waitForGatewayReady(port);

    // Request with older protocol version
    const initRequest = {
      jsonrpc: "2.0" as const,
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "test-client", version: "1.0.0" },
      },
    };

    const response = await fetch(`http://127.0.0.1:${port}/mcp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "MCP-Protocol-Version": "2024-11-05",
      },
      body: JSON.stringify(initRequest),
    });

    expect(response.status).toBe(200);
    const data = (await response.json()) as {
      result: { protocolVersion: string };
    };

    // Server should respond with supported version
    expect(["2025-11-25", "2024-11-05"]).toContain(data.result.protocolVersion);
  });

  test("should reject unsupported protocol version", async () => {
    const config = env.createGatewayConfig([]);
    config.gateway.port = port;
    config.gateway.host = "127.0.0.1";

    const gatewayProcess = await env.startGoblinGateway(config);
    cleanup.add("Kill gateway process", () => {
      gatewayProcess.kill();
    });

    await env.waitForGatewayReady(port);

    // Request with unsupported protocol version
    const response = await fetch(`http://127.0.0.1:${port}/mcp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "MCP-Protocol-Version": "2023-01-01", // Unsupported version
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2023-01-01",
          capabilities: {},
          clientInfo: { name: "test-client", version: "1.0.0" },
        },
      }),
    });

    expect(response.status).toBe(400);
    const data = (await response.json()) as {
      error: { code: number; message: string; data: { supported: string[] } };
    };

    expect(data.error).toBeDefined();
    expect(data.error.code).toBe(-32602);
    expect(data.error.message).toContain("Unsupported protocol version");
    expect(data.error.data.supported).toContain("2025-11-25");
  });

  test("should reject requests before initialized notification", async () => {
    const config = env.createGatewayConfig([]);
    config.gateway.port = port;
    config.gateway.host = "127.0.0.1";

    const gatewayProcess = await env.startGoblinGateway(config);
    cleanup.add("Kill gateway process", () => {
      gatewayProcess.kill();
    });

    await env.waitForGatewayReady(port);

    // Send initialize request
    const initResponse = await fetch(`http://127.0.0.1:${port}/mcp`, {
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

    expect(initResponse.status).toBe(200);

    // Try to list tools BEFORE sending initialized notification
    const toolsResponse = await fetch(`http://127.0.0.1:${port}/mcp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "MCP-Protocol-Version": "2025-11-25",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 2,
        method: "tools/list",
        params: {},
      }),
    });

    const toolsData = (await toolsResponse.json()) as {
      error: { code: number; message: string };
    };
    expect(toolsData.error).toBeDefined();
    expect(toolsData.error.code).toBe(-32600); // Invalid request
    expect(toolsData.error.message).toContain("not initialized");
  });

  test("should accept requests after initialized notification", async () => {
    const config = env.createGatewayConfig([]);
    config.gateway.port = port;
    config.gateway.host = "127.0.0.1";

    const gatewayProcess = await env.startGoblinGateway(config);
    cleanup.add("Kill gateway process", () => {
      gatewayProcess.kill();
    });

    await env.waitForGatewayReady(port);

    // Send initialize request
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

    // Send initialized notification
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

    // Now try to list tools - should succeed
    const toolsResponse = await fetch(`http://127.0.0.1:${port}/mcp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "MCP-Protocol-Version": "2025-11-25",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 2,
        method: "tools/list",
        params: {},
      }),
    });

    expect(toolsResponse.status).toBe(200);
    const toolsData = (await toolsResponse.json()) as { result: { tools: unknown[] } };
    expect(toolsData.result.tools).toBeDefined();
    expect(Array.isArray(toolsData.result.tools)).toBe(true);
  });

  test("should advertise correct capabilities", async () => {
    const config = env.createGatewayConfig([]);
    config.gateway.port = port;
    config.gateway.host = "127.0.0.1";

    const gatewayProcess = await env.startGoblinGateway(config);
    cleanup.add("Kill gateway process", () => {
      gatewayProcess.kill();
    });

    await env.waitForGatewayReady(port);

    const response = await fetch(`http://127.0.0.1:${port}/mcp`, {
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

    const data = (await response.json()) as {
      result: {
        capabilities: {
          tools?: { listChanged?: boolean };
          prompts?: { listChanged?: boolean };
          resources?: { listChanged?: boolean; subscribe?: boolean };
          logging?: Record<string, never>;
        };
      };
    };

    // Verify required capabilities are advertised
    expect(data.result.capabilities.tools).toBeDefined();
    expect(data.result.capabilities.tools?.listChanged).toBe(true);
    expect(data.result.capabilities.prompts).toBeDefined();
    expect(data.result.capabilities.resources).toBeDefined();
    expect(data.result.capabilities.resources?.subscribe).toBe(true);
    expect(data.result.capabilities.logging).toBeDefined();
  });
});
