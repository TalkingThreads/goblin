/**
 * Multi-Server Tests - Basic
 *
 * Tests for basic multi-server functionality and configuration.
 */

import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import {
  CleanupManager,
  registerClientCleanup,
  registerServerCleanup,
} from "../../shared/cleanup.js";
import { createTestClient, type TestMcpClient } from "../../shared/test-client.js";
import { createBasicTestServer, type TestMcpServer } from "../../shared/test-server.js";

describe("Multi-Server - Basic", () => {
  let cleanup: CleanupManager;
  let server1: TestMcpServer;
  let server2: TestMcpServer;
  let client: TestMcpClient;

  beforeEach(async () => {
    cleanup = new CleanupManager();
    server1 = createBasicTestServer("server-1");
    server2 = createBasicTestServer("server-2");
    client = createTestClient("multi-server-client");

    registerServerCleanup(cleanup, server1, "server 1");
    registerServerCleanup(cleanup, server2, "server 2");
    registerClientCleanup(cleanup, client, "multi-server client");

    await server1.start();
    await server2.start();
    await client.connectToServer(server1.getTransport()!);
    server1.connectToClient(client);
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("should start both servers", async () => {
    expect(server1.isRunning()).toBe(true);
    expect(server2.isRunning()).toBe(true);
  });

  test("should have tools on server1", async () => {
    const tools = server1["config"].tools;
    expect(tools).toBeDefined();
    expect(tools!.length).toBeGreaterThan(0);
  });

  test("should have tools on server2", async () => {
    const tools = server2["config"].tools;
    expect(tools).toBeDefined();
    expect(tools!.length).toBeGreaterThan(0);
  });

  test("should have resources on server1", async () => {
    const resources = server1["config"].resources;
    expect(resources).toBeDefined();
    expect(resources!.length).toBeGreaterThan(0);
  });

  test("should have resources on server2", async () => {
    const resources = server2["config"].resources;
    expect(resources).toBeDefined();
    expect(resources!.length).toBeGreaterThan(0);
  });

  test("should have prompts on server1", async () => {
    const prompts = server1["config"].prompts;
    expect(prompts).toBeDefined();
    expect(prompts!.length).toBeGreaterThan(0);
  });

  test("should have prompts on server2", async () => {
    const prompts = server2["config"].prompts;
    expect(prompts).toBeDefined();
    expect(prompts!.length).toBeGreaterThan(0);
  });
});

describe("Multi-Server - Server Identity", () => {
  let cleanup = new CleanupManager();

  beforeEach(() => {
    cleanup = new CleanupManager();
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("servers should have unique names", async () => {
    const server1 = createBasicTestServer("unique-server-1");
    const server2 = createBasicTestServer("unique-server-2");

    registerServerCleanup(cleanup, server1, "unique server 1");
    registerServerCleanup(cleanup, server2, "unique server 2");

    await server1.start();
    await server2.start();

    expect(server1["config"].name).toBe("unique-server-1");
    expect(server2["config"].name).toBe("unique-server-2");
    expect(server1["config"].name).not.toBe(server2["config"].name);
  });

  test("servers should have independent configurations", async () => {
    const server1 = createBasicTestServer("config-test-1");
    const server2 = createBasicTestServer("config-test-2");

    registerServerCleanup(cleanup, server1, "config test 1");
    registerServerCleanup(cleanup, server2, "config test 2");

    await server1.start();
    await server2.start();

    // Servers should have same initial tools
    expect(server1["config"].tools!.length).toBe(server2["config"].tools!.length);

    // Modify server1
    server1.addTool(
      "server1_only",
      "Only on server1",
      { type: "object", properties: {}, required: [] },
      async () => ({ content: [{ type: "text", text: "server1" }] }),
    );

    // Server2 should not have the new tool
    const server2ToolNames = server2["config"].tools!.map((t) => t.name);
    expect(server2ToolNames).not.toContain("server1_only");
  });
});

describe("Multi-Server - Client Connections", () => {
  let cleanup: CleanupManager;
  let server1: TestMcpServer;
  let server2: TestMcpServer;
  let client: TestMcpClient;

  beforeEach(async () => {
    cleanup = new CleanupManager();
    server1 = createBasicTestServer("conn-server-1");
    server2 = createBasicTestServer("conn-server-2");
    client = createTestClient("conn-client");

    registerServerCleanup(cleanup, server1, "conn server 1");
    registerServerCleanup(cleanup, server2, "conn server 2");
    registerClientCleanup(cleanup, client, "conn client");

    await server1.start();
    await server2.start();
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("client can connect to server1", async () => {
    await client.connectToServer(server1.getTransport()!);
    server1.connectToClient(client);
    expect(client.isConnected()).toBe(true);
  });

  test("client can connect to server2 after server1", async () => {
    await client.connectToServer(server1.getTransport()!);
    server1.connectToClient(client);
    await client.connectToServer(server2.getTransport()!);
    server2.connectToClient(client);
    expect(client.isConnected()).toBe(true);
  });

  test("server1 maintains independent state", async () => {
    await client.connectToServer(server1.getTransport()!);
    server1.connectToClient(client);

    const tools1 = server1["config"].tools;
    expect(tools1!.length).toBe(3); // echo, add, get_time
  });

  test("server2 maintains independent state", async () => {
    await client.connectToServer(server2.getTransport()!);
    server2.connectToClient(client);

    const tools2 = server2["config"].tools;
    expect(tools2!.length).toBe(3); // echo, add, get_time
  });
});

describe("Multi-Server - Lifecycle", () => {
  let cleanup = new CleanupManager();

  beforeEach(() => {
    cleanup = new CleanupManager();
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("can start and stop multiple servers", async () => {
    const server1 = createBasicTestServer("lifecycle-1");
    const server2 = createBasicTestServer("lifecycle-2");

    registerServerCleanup(cleanup, server1, "lifecycle server 1");
    registerServerCleanup(cleanup, server2, "lifecycle server 2");

    await server1.start();
    await server2.start();

    expect(server1.isRunning()).toBe(true);
    expect(server2.isRunning()).toBe(true);

    await server1.stop();
    expect(server1.isRunning()).toBe(false);
    expect(server2.isRunning()).toBe(true);

    await server2.stop();
    expect(server2.isRunning()).toBe(false);
  });

  test("can restart server after stop", async () => {
    const server = createBasicTestServer("restart-server");
    registerServerCleanup(cleanup, server, "restart server");

    await server.start();
    expect(server.isRunning()).toBe(true);

    await server.stop();
    expect(server.isRunning()).toBe(false);

    await server.start();
    expect(server.isRunning()).toBe(true);
  });

  test("server maintains tools after restart", async () => {
    const server = createBasicTestServer("maintain-server");
    registerServerCleanup(cleanup, server, "maintain server");

    await server.start();
    const toolsBefore = server["config"].tools!.map((t) => t.name);

    await server.stop();
    await server.start();
    const toolsAfter = server["config"].tools!.map((t) => t.name);

    expect(toolsBefore).toEqual(toolsAfter);
  });
});
