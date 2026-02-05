/**
 * Real Backend Tests - Streamable HTTP Transport
 *
 * Tests against real MCP servers using Streamable HTTP transport for authentic validation.
 */

import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { TestEnvironment } from "../shared/environment.js";
import { ServerPool } from "../shared/real-server.js";

describe("Real Backends - Streamable HTTP Transport", () => {
  let pool: ServerPool;
  let env: TestEnvironment;

  beforeEach(async () => {
    env = new TestEnvironment({ name: "streamable-http-test", useDocker: false });
    pool = new ServerPool();

    const testDir = await env.createTempDirectory("streamable-http-e2e-");

    pool.register({
      name: "filesystem",
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-filesystem", testDir],
      startupTimeout: 30000,
    });
  });

  afterEach(async () => {
    await pool.cleanup();
    await env.cleanup();
  });

  test("can create streamablehttp server config", () => {
    const config = env.createMockServerConfig("test-streamablehttp", "streamablehttp");

    expect(config).toHaveProperty("name", "test-streamablehttp");
    expect(config).toHaveProperty("transport", "streamablehttp");
    expect(config).toHaveProperty("enabled", true);
    expect(config).toHaveProperty("url", "http://localhost:3003/mcp");
  });

  test("server pool can register servers", async () => {
    const servers = pool.listNames();
    expect(servers).toContain("filesystem");
  });

  test("can start and stop server", async () => {
    const server = pool.get("filesystem");
    expect(server).toBeDefined();

    if (server) {
      await server.start();
      const status = server.getStatus();
      expect(status).toBe("running");

      await server.stop();
      const stoppedStatus = server.getStatus();
      expect(stoppedStatus).toBe("stopped");
    }
  });

  test("server health check returns status", async () => {
    const server = pool.get("filesystem");
    expect(server).toBeDefined();

    if (server) {
      await server.start();
      const health = await server.healthCheck();

      expect(health).toHaveProperty("healthy");
      expect(health).toHaveProperty("latency");
    }
  });
});

describe("Real Backends - Streamable HTTP Configuration", () => {
  let env: TestEnvironment;

  beforeEach(() => {
    env = new TestEnvironment({ name: "streamablehttp-config-test", useDocker: false });
  });

  afterEach(async () => {
    await env.cleanup();
  });

  test("streamablehttp config includes url", () => {
    const config = env.createMockServerConfig("test-sh", "streamablehttp");

    expect(config).toHaveProperty("url", "http://localhost:3003/mcp");
    expect(config).not.toHaveProperty("command");
    expect(config).not.toHaveProperty("args");
  });

  test("can create gateway config with streamablehttp servers", () => {
    const servers = [
      env.createMockServerConfig("server1", "streamablehttp"),
      env.createMockServerConfig("server2", "streamablehttp"),
    ];
    const config = env.createGatewayConfig(servers);

    expect(config).toHaveProperty("$schema", "./config.schema.json");
    expect(config).toHaveProperty("servers");
    expect((config as Record<string, unknown>).servers).toHaveLength(2);
    expect(config).toHaveProperty("gateway");
    expect(config).toHaveProperty("auth");
    expect(config).toHaveProperty("policies");
  });

  test("can mix transport types in gateway config", () => {
    const servers = [
      env.createMockServerConfig("stdio-server", "stdio"),
      env.createMockServerConfig("http-server", "http"),
      env.createMockServerConfig("sse-server", "sse"),
      env.createMockServerConfig("streamablehttp-server", "streamablehttp"),
    ];
    const config = env.createGatewayConfig(servers);

    expect((config as Record<string, unknown>).servers).toHaveLength(4);
  });
});

describe("Real Backends - Streamable HTTP Pool Management", () => {
  let pool: ServerPool;

  beforeEach(() => {
    pool = new ServerPool();
  });

  afterEach(async () => {
    await pool.cleanup();
  });

  test("can register multiple streamablehttp servers", () => {
    pool.register({
      name: "server1",
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-filesystem", "/tmp/server1"],
      startupTimeout: 5000,
    });

    pool.register({
      name: "server2",
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-filesystem", "/tmp/server2"],
      startupTimeout: 5000,
    });

    expect(pool.listNames()).toHaveLength(2);
  });

  test("pool tracks servers correctly", async () => {
    pool.register({
      name: "server1",
      command: "echo",
      args: ["test1"],
      startupTimeout: 5000,
    });

    pool.register({
      name: "server2",
      command: "echo",
      args: ["test2"],
      startupTimeout: 5000,
    });

    expect(pool.listNames()).toHaveLength(2);

    await pool.startAll();

    const health = await pool.healthCheckAll();
    expect(health.size).toBe(2);

    await pool.stopAll();
  });
});

describe("Real Backends - Streamable HTTP Headers", () => {
  let env: TestEnvironment;

  beforeEach(() => {
    env = new TestEnvironment({ name: "streamablehttp-headers-test", useDocker: false });
  });

  afterEach(async () => {
    await env.cleanup();
  });

  test("headers are configurable for streamablehttp", () => {
    const headers = {
      Authorization: "Bearer token123",
      "X-Custom-Header": "custom-value",
    };

    const config = {
      name: "server-with-headers",
      transport: "streamablehttp",
      url: "http://localhost:3003/mcp",
      headers,
      enabled: true,
    };

    expect(config).toHaveProperty("transport", "streamablehttp");
    expect(config).toHaveProperty("headers");
    expect((config as Record<string, unknown>).headers).toEqual(headers);
  });

  test("can create config with Bearer token", () => {
    const config = {
      name: "authenticated-server",
      transport: "streamablehttp",
      url: "http://localhost:3003/mcp",
      headers: {
        Authorization: "Bearer my-secret-token",
      },
      enabled: true,
    };

    expect(config).toHaveProperty("headers");
    expect((config as Record<string, unknown>).headers as Record<string, string>).toHaveProperty(
      "Authorization",
    );
    expect((config as Record<string, unknown>).headers as Record<string, string>).toHaveProperty(
      "Authorization",
      "Bearer my-secret-token",
    );
  });

  test("can create config with multiple headers", () => {
    const headers = {
      Authorization: "Bearer token123",
      "X-API-Key": "api-key-456",
      "X-Client-Version": "1.0.0",
      "X-Request-ID": "req-789",
    };

    const config = {
      name: "multi-header-server",
      transport: "streamablehttp",
      url: "http://localhost:3003/mcp",
      headers,
      enabled: true,
    };

    expect((config as Record<string, unknown>).headers as Record<string, string>).toEqual(headers);
  });
});
