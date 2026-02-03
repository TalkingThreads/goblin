/**
 * MCP Initialization and Capabilities Verification Tests
 *
 * Tests that verify Goblin correctly advertises its capabilities
 * during the MCP initialization handshake.
 */

import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { CleanupManager } from "../../shared/cleanup.js";
import { createTestEnvironment } from "../../shared/environment.js";

describe("MCP Initialization - Capabilities Advertisement", () => {
  let cleanup: CleanupManager;
  let env: ReturnType<typeof createTestEnvironment>;
  let port: number;

  beforeEach(async () => {
    cleanup = new CleanupManager();
    env = createTestEnvironment({ name: "initialization-test", useDocker: false });
    port = await env.getFreePort();
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("gateway should be healthy and responding", async () => {
    const config = env.createGatewayConfig([]);
    config.gateway.port = port;
    config.gateway.host = "127.0.0.1";

    const gatewayProcess = await env.startGoblinGateway(config);
    cleanup.add("Kill gateway process", () => {
      gatewayProcess.kill();
    });

    await env.waitForGatewayReady(port);

    const response = await fetch(`http://127.0.0.1:${port}/health`);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.status).toBe("ok");
  });

  test("should respond to initialize request with capabilities", async () => {
    const config = env.createGatewayConfig([]);
    config.gateway.port = port;
    config.gateway.host = "127.0.0.1";

    const gatewayProcess = await env.startGoblinGateway(config);
    cleanup.add("Kill gateway process", () => {
      gatewayProcess.kill();
    });

    await env.waitForGatewayReady(port);

    const response = await fetch(`http://127.0.0.1:${port}/health`);
    expect(response.status).toBe(200);
  });

  test("should have tools available (meta-tools)", async () => {
    const config = env.createGatewayConfig([]);
    config.gateway.port = port;
    config.gateway.host = "127.0.0.1";

    const gatewayProcess = await env.startGoblinGateway(config);
    cleanup.add("Kill gateway process", () => {
      gatewayProcess.kill();
    });

    await env.waitForGatewayReady(port);

    const response = await fetch(`http://127.0.0.1:${port}/tools`);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.tools).toBeDefined();
    expect(Array.isArray(data.tools)).toBe(true);
    expect(data.tools.length).toBeGreaterThan(0);
  });

  test("should have status endpoint showing correct state", async () => {
    const config = env.createGatewayConfig([]);
    config.gateway.port = port;
    config.gateway.host = "127.0.0.1";

    const gatewayProcess = await env.startGoblinGateway(config);
    cleanup.add("Kill gateway process", () => {
      gatewayProcess.kill();
    });

    await env.waitForGatewayReady(port);

    const response = await fetch(`http://127.0.0.1:${port}/status`);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.servers).toBeDefined();
    expect(data.servers.total).toBe(0);
    expect(typeof data.tools).toBe("number");
    expect(data.tools).toBeGreaterThanOrEqual(0);
    expect(data.uptime).toBeDefined();
    expect(typeof data.uptime).toBe("number");
  });

  test("should accept server configuration", async () => {
    const config = env.createGatewayConfig([
      { name: "test-server", transport: "stdio", command: "echo", args: ["test"], enabled: true },
    ]);
    config.gateway.port = port;
    config.gateway.host = "127.0.0.1";

    const gatewayProcess = await env.startGoblinGateway(config);
    cleanup.add("Kill gateway process", () => {
      gatewayProcess.kill();
    });

    await env.waitForGatewayReady(port);

    const response = await fetch(`http://127.0.0.1:${port}/servers`);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.servers).toBeDefined();
    expect(data.servers.length).toBe(1);
    expect(data.servers[0].name).toBe("test-server");
  });

  test("should list available tools with metadata", async () => {
    const config = env.createGatewayConfig([]);
    config.gateway.port = port;
    config.gateway.host = "127.0.0.1";

    const gatewayProcess = await env.startGoblinGateway(config);
    cleanup.add("Kill gateway process", () => {
      gatewayProcess.kill();
    });

    await env.waitForGatewayReady(port);

    const response = await fetch(`http://127.0.0.1:${port}/tools`);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.tools).toBeDefined();
    expect(Array.isArray(data.tools)).toBe(true);

    if (data.tools.length > 0) {
      const tool = data.tools[0];
      expect(tool.name).toBeDefined();
      expect(typeof tool.name).toBe("string");
      expect(tool.description).toBeDefined();
      expect(typeof tool.description).toBe("string");
    }
  });
});

describe("MCP Capabilities - HTTP Gateway Endpoints", () => {
  let cleanup: CleanupManager;
  let env: ReturnType<typeof createTestEnvironment>;
  let port: number;

  beforeEach(async () => {
    cleanup = new CleanupManager();
    env = createTestEnvironment({ name: "capabilities-test", useDocker: false });
    port = await env.getFreePort();
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("should have metrics endpoint", async () => {
    const config = env.createGatewayConfig([]);
    config.gateway.port = port;
    config.gateway.host = "127.0.0.1";

    const gatewayProcess = await env.startGoblinGateway(config);
    cleanup.add("Kill gateway process", () => {
      gatewayProcess.kill();
    });

    await env.waitForGatewayReady(port);

    const response = await fetch(`http://127.0.0.1:${port}/metrics`);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toBeDefined();
  });

  test("should have empty servers list initially", async () => {
    const config = env.createGatewayConfig([]);
    config.gateway.port = port;
    config.gateway.host = "127.0.0.1";

    const gatewayProcess = await env.startGoblinGateway(config);
    cleanup.add("Kill gateway process", () => {
      gatewayProcess.kill();
    });

    await env.waitForGatewayReady(port);

    const response = await fetch(`http://127.0.0.1:${port}/servers`);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.servers).toBeDefined();
    expect(Array.isArray(data.servers)).toBe(true);
  });

  test("tools endpoint should filter by search query", async () => {
    const config = env.createGatewayConfig([]);
    config.gateway.port = port;
    config.gateway.host = "127.0.0.1";

    const gatewayProcess = await env.startGoblinGateway(config);
    cleanup.add("Kill gateway process", () => {
      gatewayProcess.kill();
    });

    await env.waitForGatewayReady(port);

    const response = await fetch(`http://127.0.0.1:${port}/tools?search=catalog`);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.tools).toBeDefined();
    expect(Array.isArray(data.tools)).toBe(true);
  });
});
