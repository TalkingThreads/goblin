/**
 * Transport Tests - Basic
 *
 * Tests for basic transport layer functionality.
 */

import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import {
  CleanupManager,
  registerClientCleanup,
  registerServerCleanup,
} from "../../shared/cleanup.js";
import { createTestClient, type TestMcpClient } from "../../shared/test-client.js";
import { createBasicTestServer, type TestMcpServer } from "../../shared/test-server.js";

describe("Transport - Basic Connection", () => {
  let cleanup: CleanupManager;
  let server: TestMcpServer;
  let client: TestMcpClient;

  beforeEach(async () => {
    cleanup = new CleanupManager();
    server = createBasicTestServer("transport-basic");
    client = createTestClient("transport-basic-client");

    registerServerCleanup(cleanup, server, "transport basic server");
    registerClientCleanup(cleanup, client, "transport basic client");

    await server.start();
    await client.connectToServer(server.getTransport()!);
    server.connectToClient(client);
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("server should be running after start", async () => {
    expect(server.isRunning()).toBe(true);
  });

  test("client should be connected after connect", async () => {
    expect(client.isConnected()).toBe(true);
  });

  test("server transport should be available", async () => {
    const transport = server.getTransport();
    expect(transport).not.toBeNull();
  });

  test("client should have transport", async () => {
    const transport = client.getTransport();
    expect(transport).toBeDefined();
  });

  test("server should have tools after start", async () => {
    const tools = server["config"].tools;
    expect(tools?.length).toBeGreaterThan(0);
  });

  test("server should have resources after start", async () => {
    const resources = server["config"].resources;
    expect(resources?.length).toBeGreaterThan(0);
  });

  test("server should have prompts after start", async () => {
    const prompts = server["config"].prompts;
    expect(prompts?.length).toBeGreaterThan(0);
  });
});

describe("Transport - Connection State", () => {
  let cleanup: CleanupManager;
  let server: TestMcpServer;
  let client: TestMcpClient;

  beforeEach(async () => {
    cleanup = new CleanupManager();
    server = createBasicTestServer("transport-state");
    client = createTestClient("transport-state-client");

    registerServerCleanup(cleanup, server, "transport state server");
    registerClientCleanup(cleanup, client, "transport state client");
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("server should not be running before start", async () => {
    expect(server.isRunning()).toBe(false);
  });

  test("server should be running after start", async () => {
    await server.start();
    expect(server.isRunning()).toBe(true);
  });

  test("server should not be running after stop", async () => {
    await server.start();
    await server.stop();
    expect(server.isRunning()).toBe(false);
  });

  test("client should not be connected before connect", async () => {
    expect(client.isConnected()).toBe(false);
  });

  test("client should be connected after connect", async () => {
    await server.start();
    await client.connectToServer(server.getTransport()!);
    server.connectToClient(client);
    expect(client.isConnected()).toBe(true);
  });

  test("client should not be connected after disconnect", async () => {
    await server.start();
    await client.connectToServer(server.getTransport()!);
    server.connectToClient(client);
    await client.disconnect();
    expect(client.isConnected()).toBe(false);
  });
});

describe("Transport - Reconnection", () => {
  let cleanup: CleanupManager;
  let server: TestMcpServer;
  let client: TestMcpClient;

  beforeEach(async () => {
    cleanup = new CleanupManager();
    server = createBasicTestServer("transport-reconnect");
    client = createTestClient("transport-reconnect-client");

    registerServerCleanup(cleanup, server, "transport reconnect server");
    registerClientCleanup(cleanup, client, "transport reconnect client");

    await server.start();
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("can reconnect client", async () => {
    await client.connectToServer(server.getTransport()!);
    server.connectToClient(client);
    expect(client.isConnected()).toBe(true);

    await client.disconnect();
    expect(client.isConnected()).toBe(false);

    await client.connectToServer(server.getTransport()!);
    server.connectToClient(client);
    expect(client.isConnected()).toBe(true);
  });

  test("server maintains state after client disconnect", async () => {
    await client.connectToServer(server.getTransport()!);
    server.connectToClient(client);

    const tools = server["config"].tools;
    expect(tools?.length).toBe(3);

    await client.disconnect();

    // Server should still have tools
    const toolsAfter = server["config"].tools;
    expect(toolsAfter?.length).toBe(3);
  });

  test("can connect multiple times", async () => {
    for (let i = 0; i < 3; i++) {
      await client.connectToServer(server.getTransport()!);
      server.connectToClient(client);
      expect(client.isConnected()).toBe(true);

      await client.disconnect();
      expect(client.isConnected()).toBe(false);
    }
  });
});

describe("Transport - Multiple Connections", () => {
  let cleanup: CleanupManager;
  let server: TestMcpServer;
  let client1: TestMcpClient;
  let client2: TestMcpClient;

  beforeEach(async () => {
    cleanup = new CleanupManager();
    server = createBasicTestServer("transport-multi");
    client1 = createTestClient("transport-multi-client-1");
    client2 = createTestClient("transport-multi-client-2");

    registerServerCleanup(cleanup, server, "transport multi server");
    registerClientCleanup(cleanup, client1, "transport multi client 1");
    registerClientCleanup(cleanup, client2, "transport multi client 2");

    await server.start();
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("first client can connect", async () => {
    await client1.connectToServer(server.getTransport()!);
    server.connectToClient(client1);
    expect(client1.isConnected()).toBe(true);
  });

  test("second client can connect", async () => {
    await client1.connectToServer(server.getTransport()!);
    server.connectToClient(client1);
    await client2.connectToServer(server.getTransport()!);
    server.connectToClient(client2);

    expect(client1.isConnected()).toBe(true);
    expect(client2.isConnected()).toBe(true);
  });

  test("both clients can be connected simultaneously", async () => {
    await client1.connectToServer(server.getTransport()!);
    server.connectToClient(client1);
    await client2.connectToServer(server.getTransport()!);
    server.connectToClient(client2);

    expect(client1.isConnected()).toBe(true);
    expect(client2.isConnected()).toBe(true);
    expect(server.isRunning()).toBe(true);
  });
});

describe("Transport - Configuration Persistence", () => {
  let cleanup: CleanupManager;
  let server: TestMcpServer;

  beforeEach(async () => {
    cleanup = new CleanupManager();
    server = createBasicTestServer("transport-persist");
    registerServerCleanup(cleanup, server, "transport persist server");
    await server.start();
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("tools persist across restarts", async () => {
    const toolsBefore = server["config"].tools?.map((t) => t.name);

    await server.stop();
    await server.start();

    const toolsAfter = server["config"].tools?.map((t) => t.name);
    expect(toolsBefore).toEqual(toolsAfter);
  });

  test("resources persist across restarts", async () => {
    const resourcesBefore = server["config"].resources?.map((r) => r.uri);

    await server.stop();
    await server.start();

    const resourcesAfter = server["config"].resources?.map((r) => r.uri);
    expect(resourcesBefore).toEqual(resourcesAfter);
  });

  test("prompts persist across restarts", async () => {
    const promptsBefore = server["config"].prompts?.map((p) => p.name);

    await server.stop();
    await server.start();

    const promptsAfter = server["config"].prompts?.map((p) => p.name);
    expect(promptsBefore).toEqual(promptsAfter);
  });

  test("dynamic additions persist across restarts", async () => {
    server.addTool(
      "persist_test",
      "Test tool",
      { type: "object", properties: {}, required: [] },
      async () => ({ content: [{ type: "text", text: "test" }] }),
    );

    const toolsBefore = server["config"].tools?.map((t) => t.name);

    await server.stop();
    await server.start();

    const toolsAfter = server["config"].tools?.map((t) => t.name);
    expect(toolsAfter).toEqual(toolsBefore);
    expect(toolsAfter).toContain("persist_test");
  });
});
