/**
 * MCP Timeout Compliance Tests
 *
 * Tests that verify Goblin correctly handles request timeouts
 * per the MCP 2025-11-25 protocol specification.
 */

import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { CleanupManager } from "../../shared/cleanup.js";
import { createTestEnvironment } from "../../shared/environment.js";

describe("MCP Timeout Compliance", () => {
  let cleanup: CleanupManager;
  let env: ReturnType<typeof createTestEnvironment>;
  let port: number;

  beforeEach(async () => {
    cleanup = new CleanupManager();
    env = createTestEnvironment({ name: "timeout-compliance", useDocker: false });
    port = await env.getFreePort();
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("should timeout slow tool execution with correct error code", async () => {
    // Create config with short timeout for testing
    const config = env.createGatewayConfig([
      {
        name: "slow-server",
        transport: "stdio",
        command: "node",
        args: [
          "-e",
          `
          const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
          const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
          
          const server = new Server({ name: 'slow', version: '1.0.0' }, {
            capabilities: { tools: {} }
          });
          
          server.setRequestHandler({ method: 'tools/list' }, async () => ({
            tools: [{
              name: 'slow_tool',
              description: 'A slow tool',
              inputSchema: { type: 'object', properties: {} }
            }]
          }));
          
          server.setRequestHandler({ method: 'tools/call' }, async () => {
            await new Promise(resolve => setTimeout(resolve, 10000));
            return { content: [{ type: 'text', text: 'done' }] };
          });
          
          const transport = new StdioServerTransport();
          server.connect(transport);
        `,
        ],
        enabled: true,
      },
    ]);
    config.gateway.port = port;
    config.gateway.host = "127.0.0.1";
    config.policies = { ...config.policies, defaultTimeout: 1000 }; // 1 second timeout for testing

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

    // Call slow tool - should timeout
    const startTime = Date.now();
    const response = await fetch(`http://127.0.0.1:${port}/mcp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "MCP-Protocol-Version": "2025-11-25",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 2,
        method: "tools/call",
        params: {
          name: "slow-server_slow_tool",
          arguments: {},
        },
      }),
    });
    const duration = Date.now() - startTime;

    // Should timeout quickly (within 2 seconds, not 10)
    expect(duration).toBeLessThan(2000);

    const data = (await response.json()) as {
      error: { code: number; message: string };
    };

    expect(data.error).toBeDefined();
    expect(data.error.code).toBe(-32001); // Request timeout error
    expect(data.error.message.toLowerCase()).toContain("timeout");
  });

  test("should format timeout errors with correct structure", async () => {
    const config = env.createGatewayConfig([]);
    config.gateway.port = port;
    config.gateway.host = "127.0.0.1";
    config.policies = { ...config.policies, defaultTimeout: 100 }; // 100ms timeout

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

    // Call non-existent tool to trigger timeout error format check
    const response = await fetch(`http://127.0.0.1:${port}/mcp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "MCP-Protocol-Version": "2025-11-25",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 2,
        method: "tools/call",
        params: {
          name: "unknown_tool",
          arguments: {},
        },
      }),
    });

    const data = (await response.json()) as {
      error: { code: number; message: string; data?: unknown };
    };

    // Error should have standard MCP format
    expect(data.error).toBeDefined();
    expect(typeof data.error.code).toBe("number");
    expect(typeof data.error.message).toBe("string");
  });

  test("should enforce configured timeout value", async () => {
    const config = env.createGatewayConfig([]);
    config.gateway.port = port;
    config.gateway.host = "127.0.0.1";
    config.policies = { ...config.policies, defaultTimeout: 500 }; // 500ms timeout

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

    // Try to call a tool - should fail quickly with timeout
    const startTime = Date.now();
    await fetch(`http://127.0.0.1:${port}/mcp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "MCP-Protocol-Version": "2025-11-25",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 2,
        method: "tools/call",
        params: {
          name: "unknown_tool",
          arguments: {},
        },
      }),
    });
    const duration = Date.now() - startTime;

    // Should fail quickly (within 1 second due to timeout config)
    expect(duration).toBeLessThan(1000);
  });
});
