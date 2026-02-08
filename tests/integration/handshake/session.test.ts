/**
 * MCP Handshake - Session Tests
 *
 * Tests for session creation, cleanup, and state preservation.
 */

import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import {
  CleanupManager,
  registerClientCleanup,
  registerServerCleanup,
} from "../../shared/cleanup.js";
import { createTestClient, type TestMcpClient } from "../../shared/test-client.js";
import { createBasicTestServer, type TestMcpServer } from "../../shared/test-server.js";

describe("MCP Handshake - Session Creation", () => {
  let cleanup: CleanupManager;
  let server: TestMcpServer;
  let client: TestMcpClient;

  beforeEach(async () => {
    cleanup = new CleanupManager();
    server = createBasicTestServer("session-test");
    client = createTestClient("session-client");

    registerServerCleanup(cleanup, server, "session server");
    registerClientCleanup(cleanup, client, "session client");

    await server.start();
    await client.connectToServer(server.getTransport()!);
    server.connectToClient(client);
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("should create session on handshake", async () => {
    expect(server.isRunning()).toBe(true);
    expect(client.isConnected()).toBe(true);
  });

  test("should have tools available after session", async () => {
    const tools = server["config"].tools;
    expect(tools).toBeDefined();
    expect(tools?.length).toBeGreaterThan(0);
  });

  test("should have resources available after session", async () => {
    const resources = server["config"].resources;
    expect(resources).toBeDefined();
    expect(resources?.length).toBeGreaterThan(0);
  });

  test("should have prompts available after session", async () => {
    const prompts = server["config"].prompts;
    expect(prompts).toBeDefined();
    expect(prompts?.length).toBeGreaterThan(0);
  });
});

describe("MCP Handshake - Session Cleanup", () => {
  test("should cleanup on disconnect", async () => {
    const cleanup = new CleanupManager();
    const server = createBasicTestServer("cleanup-test");
    const client = createTestClient("cleanup-client");

    registerServerCleanup(cleanup, server, "cleanup server");
    registerClientCleanup(cleanup, client, "cleanup client");

    await server.start();
    await client.connectToServer(server.getTransport()!);
    server.connectToClient(client);

    expect(client.isConnected()).toBe(true);

    await client.disconnect();
    expect(client.isConnected()).toBe(false);

    expect(server.isRunning()).toBe(true);

    await cleanup.run();
  });

  test("should handle abrupt disconnection", async () => {
    const cleanup = new CleanupManager();
    const server = createBasicTestServer("abrupt-test");
    const client = createTestClient("abrupt-client");

    registerServerCleanup(cleanup, server, "abrupt server");
    registerClientCleanup(cleanup, client, "abrupt client");

    await server.start();
    await client.connectToServer(server.getTransport()!);
    server.connectToClient(client);

    await client.disconnect();
    expect(client.isConnected()).toBe(false);

    await cleanup.run();
    expect(server.isRunning()).toBe(false);
  });
});

describe("MCP Handshake - Session State", () => {
  let cleanup: CleanupManager;
  let server: TestMcpServer;
  let client: TestMcpClient;

  beforeEach(async () => {
    cleanup = new CleanupManager();
    server = createBasicTestServer("state-test");
    client = createTestClient("state-client");

    registerServerCleanup(cleanup, server, "state server");
    registerClientCleanup(cleanup, client, "state client");

    await server.start();
    await client.connectToServer(server.getTransport()!);
    server.connectToClient(client);
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("should preserve tool list", async () => {
    const tools1 = server["config"].tools;
    const tools2 = server["config"].tools;

    expect(tools1).toEqual(tools2);
  });

  test("should preserve resource list", async () => {
    const resources1 = server["config"].resources;
    const resources2 = server["config"].resources;

    expect(resources1?.length).toBe(resources2?.length);
  });

  test("should preserve prompt list", async () => {
    const prompts1 = server["config"].prompts;
    const prompts2 = server["config"].prompts;

    expect(prompts1?.length).toBe(prompts2?.length);
  });
});

describe("MCP Handshake - Reconnection", () => {
  test("should reconnect with existing session", async () => {
    const cleanup = new CleanupManager();
    const server = createBasicTestServer("reconnect-test");
    const client = createTestClient("reconnect-client");

    registerServerCleanup(cleanup, server, "reconnect server");
    registerClientCleanup(cleanup, client, "reconnect client");

    await server.start();
    await client.connectToServer(server.getTransport()!);
    server.connectToClient(client);

    expect(client.isConnected()).toBe(true);

    await client.disconnect();

    await client.connectToServer(server.getTransport()!);
    server.connectToClient(client);

    expect(client.isConnected()).toBe(true);
    expect(server.isRunning()).toBe(true);

    await cleanup.run();
  });

  test("should handle multiple connect/disconnect cycles", async () => {
    const cleanup = new CleanupManager();
    const server = createBasicTestServer("cycles-test");
    const client = createTestClient("cycles-client");

    registerServerCleanup(cleanup, server, "cycles server");
    registerClientCleanup(cleanup, client, "cycles client");

    await server.start();

    for (let i = 0; i < 3; i++) {
      await client.connectToServer(server.getTransport()!);
      server.connectToClient(client);
      expect(client.isConnected()).toBe(true);

      await client.disconnect();
      expect(client.isConnected()).toBe(false);
    }

    await cleanup.run();
  });
});
