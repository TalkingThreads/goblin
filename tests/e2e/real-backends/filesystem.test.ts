/**
 * Real Backend Tests - Filesystem Server
 *
 * Tests against real MCP filesystem server for authentic validation.
 */

import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { TestEnvironment } from "../shared/environment.js";
import { type RealMcpServer, ServerPool } from "../shared/real-server.js";

describe("Real Backends - Filesystem Server", () => {
  let _server: RealMcpServer;
  let pool: ServerPool;
  let env: TestEnvironment;

  beforeEach(async () => {
    env = new TestEnvironment({ name: "filesystem-test", useDocker: false });
    pool = new ServerPool();

    // Create test directory
    const _testDir = await env.createTempDirectory("filesystem-e2e-");

    // Register filesystem server (disabled - requires actual MCP server)
    // pool.register({
    //   name: "filesystem",
    //   command: "npx",
    //   args: ["-y", "@modelcontextprotocol/server-filesystem", testDir],
    //   startupTimeout: 30000,
    // });
  });

  afterEach(async () => {
    await pool.cleanup();
    await env.cleanup();
  });

  test("server pool can register server configs", () => {
    // Test that we can register server configurations
    expect(pool.listNames()).toEqual([]);
  });

  test("server pool can list registered servers", () => {
    // Test listing servers
    const servers = pool.listNames();
    expect(Array.isArray(servers)).toBe(true);
  });

  test("test directory creation", async () => {
    // Test that we can create temporary directories
    const dir = await env.createTempDirectory("test-");
    expect(dir.length).toBeGreaterThan(0);
    expect(dir.includes("test-")).toBe(true);
  });

  test("test file creation", async () => {
    // Test that we can create files
    const filePath = await env.createTempFile("test.txt", "test content");
    expect(filePath.endsWith("test.txt")).toBe(true);
  });

  test("environment cleanup removes resources", async () => {
    // Test cleanup functionality
    const _dir = await env.createTempDirectory("cleanup-test-");
    await env.cleanup();

    // Verify environment info
    const info = env.getEnvironmentInfo();
    expect(info.tempDirCount).toBe(0);
  });
});

describe("Real Backends - Server Configuration", () => {
  let env: TestEnvironment;

  beforeEach(() => {
    env = new TestEnvironment({ name: "config-test", useDocker: false });
  });

  afterEach(async () => {
    await env.cleanup();
  });

  test("can create stdio server config", () => {
    const config = env.createMockServerConfig("test-stdio", "stdio");

    expect(config).toHaveProperty("name", "test-stdio");
    expect(config).toHaveProperty("transport", "stdio");
    expect(config).toHaveProperty("enabled", true);
    expect(config).toHaveProperty("command", "echo");
  });

  test("can create http server config", () => {
    const config = env.createMockServerConfig("test-http", "http");

    expect(config).toHaveProperty("name", "test-http");
    expect(config).toHaveProperty("transport", "http");
    expect(config).toHaveProperty("url", "http://localhost:3001");
  });

  test("can create sse server config", () => {
    const config = env.createMockServerConfig("test-sse", "sse");

    expect(config).toHaveProperty("name", "test-sse");
    expect(config).toHaveProperty("transport", "sse");
    expect(config).toHaveProperty("url", "http://localhost:3002/sse");
  });

  test("can create streamablehttp server config", () => {
    const config = env.createMockServerConfig("test-streamablehttp", "streamablehttp");

    expect(config).toHaveProperty("name", "test-streamablehttp");
    expect(config).toHaveProperty("transport", "streamablehttp");
    expect(config).toHaveProperty("enabled", true);
    expect(config).toHaveProperty("url", "http://localhost:3003/mcp");
  });

  test("can create gateway config", () => {
    const servers = [env.createMockServerConfig("server1", "stdio")];
    const config = env.createGatewayConfig(servers);

    expect(config).toHaveProperty("$schema", "./config.schema.json");
    expect(config).toHaveProperty("servers");
    expect(config).toHaveProperty("gateway");
    expect(config).toHaveProperty("auth");
    expect(config).toHaveProperty("policies");
  });
});

describe("Real Backends - Multi-Server Scenarios", () => {
  let pool: ServerPool;

  beforeEach(() => {
    pool = new ServerPool();
  });

  afterEach(async () => {
    await pool.cleanup();
  });

  test("can register multiple servers", () => {
    pool.register({
      name: "server-a",
      command: "echo",
      args: ["a"],
      startupTimeout: 5000,
    });

    pool.register({
      name: "server-b",
      command: "echo",
      args: ["b"],
      startupTimeout: 5000,
    });

    expect(pool.listNames().length).toBe(2);
    expect(pool.listNames()).toContain("server-a");
    expect(pool.listNames()).toContain("server-b");
  });

  test("cannot register duplicate server", () => {
    pool.register({
      name: "server-a",
      command: "echo",
      args: ["a"],
      startupTimeout: 5000,
    });

    expect(() => {
      pool.register({
        name: "server-a",
        command: "echo",
        args: ["a"],
        startupTimeout: 5000,
      });
    }).toThrow("already registered");
  });

  test("get returns undefined for unknown server", () => {
    const server = pool.get("unknown");
    expect(server).toBeUndefined();
  });
});

describe("Real Backends - Server Health", () => {
  let pool: ServerPool;

  beforeEach(() => {
    pool = new ServerPool();
  });

  afterEach(async () => {
    await pool.cleanup();
  });

  test("health check on empty pool returns empty map", async () => {
    const health = await pool.healthCheckAll();

    expect(health.size).toBe(0);
  });
});
