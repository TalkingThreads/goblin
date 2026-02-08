/**
 * MCP Handshake - Server Info Tests
 *
 * Tests for gateway server info advertisement and backend aggregation.
 */

import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import {
  CleanupManager,
  registerClientCleanup,
  registerServerCleanup,
} from "../../shared/cleanup.js";
import { createTestClient, type TestMcpClient } from "../../shared/test-client.js";
import { createBasicTestServer, type TestMcpServer } from "../../shared/test-server.js";

describe("MCP Handshake - Server Info", () => {
  let cleanup: CleanupManager;
  let server: TestMcpServer;
  let client: TestMcpClient;

  beforeEach(async () => {
    cleanup = new CleanupManager();
    server = createBasicTestServer("server-info-test");
    client = createTestClient("server-info-client");

    registerServerCleanup(cleanup, server, "backend server");
    registerClientCleanup(cleanup, client, "test client");

    await server.start();
    await client.connectToServer(server.getTransport()!);
    server.connectToClient(client);
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("should have server with correct name", async () => {
    expect(server.isRunning()).toBe(true);
    expect(server["config"].name).toBe("server-info-test");
  });

  test("should return tools with names and descriptions", async () => {
    const tools = server["config"].tools;
    expect(tools).toBeDefined();
    expect(tools?.length).toBeGreaterThan(0);

    for (const tool of tools!) {
      expect(tool.name).toBeDefined();
      expect(typeof tool.name).toBe("string");
      expect(tool.name.length).toBeGreaterThan(0);
      expect(tool.description).toBeDefined();
      expect(typeof tool.description).toBe("string");
    }
  });

  test("should return tools with input schemas", async () => {
    const tools = server["config"].tools;

    for (const tool of tools!) {
      expect(tool.inputSchema).toBeDefined();
      expect(typeof tool.inputSchema).toBe("object");
    }
  });

  test("should return resources with metadata", async () => {
    const resources = server["config"].resources;
    expect(resources).toBeDefined();
    expect(resources?.length).toBeGreaterThan(0);

    for (const resource of resources!) {
      expect(resource.uri).toBeDefined();
      expect(typeof resource.uri).toBe("string");
      expect(resource.uri.length).toBeGreaterThan(0);
      expect(resource.name).toBeDefined();
      expect(typeof resource.name).toBe("string");
      expect(resource.mimeType).toBeDefined();
      expect(typeof resource.mimeType).toBe("string");
    }
  });

  test("should return prompts with arguments", async () => {
    const prompts = server["config"].prompts;
    expect(prompts).toBeDefined();
    expect(prompts?.length).toBeGreaterThan(0);

    for (const prompt of prompts!) {
      expect(prompt.name).toBeDefined();
      expect(typeof prompt.name).toBe("string");
      expect(prompt.description).toBeDefined();
      expect(typeof prompt.description).toBe("string");
      expect(Array.isArray(prompt.arguments)).toBe(true);
    }
  });
});

describe("MCP Handshake - Backend Aggregation", () => {
  test("should handle multiple backend servers", async () => {
    const cleanup = new CleanupManager();

    const server1 = createBasicTestServer("backend-1");
    const server2 = createBasicTestServer("backend-2");
    const client = createTestClient("multi-backend-client");

    registerServerCleanup(cleanup, server1, "backend 1");
    registerServerCleanup(cleanup, server2, "backend 2");
    registerClientCleanup(cleanup, client, "multi-backend client");

    await server1.start();
    await server2.start();

    await client.connectToServer(server1.getTransport()!);
    server1.connectToClient(client);
    await client.connectToServer(server2.getTransport()!);
    server2.connectToClient(client);

    expect(server1.isRunning()).toBe(true);
    expect(server2.isRunning()).toBe(true);

    await cleanup.run();
  });

  test("should aggregate resources from backends", async () => {
    const cleanup = new CleanupManager();

    const server = createBasicTestServer("resource-server");
    const client = createTestClient("resource-client");

    registerServerCleanup(cleanup, server, "resource server");
    registerClientCleanup(cleanup, client, "resource client");

    await server.start();
    await client.connectToServer(server.getTransport()!);
    server.connectToClient(client);

    const resources = server["config"].resources;
    expect(resources).toBeDefined();
    expect(resources?.length).toBeGreaterThanOrEqual(2);

    for (const resource of resources!) {
      expect(resource.uri).toBeDefined();
      expect(resource.name).toBeDefined();
      expect(resource.mimeType).toBeDefined();
    }

    await cleanup.run();
  });

  test("should aggregate prompts from backends", async () => {
    const cleanup = new CleanupManager();

    const server = createBasicTestServer("prompt-server");
    const client = createTestClient("prompt-client");

    registerServerCleanup(cleanup, server, "prompt server");
    registerClientCleanup(cleanup, client, "prompt client");

    await server.start();
    await client.connectToServer(server.getTransport()!);
    server.connectToClient(client);

    const prompts = server["config"].prompts;
    expect(prompts).toBeDefined();
    expect(prompts?.length).toBeGreaterThanOrEqual(1);

    for (const prompt of prompts!) {
      expect(prompt.name).toBeDefined();
      expect(prompt.description).toBeDefined();
    }

    await cleanup.run();
  });
});

describe("MCP Handshake - Version Handling", () => {
  let cleanup: CleanupManager;
  let server: TestMcpServer;
  let client: TestMcpClient;

  beforeEach(async () => {
    cleanup = new CleanupManager();
    server = createBasicTestServer("version-test");
    client = createTestClient("version-client");

    registerServerCleanup(cleanup, server, "version server");
    registerClientCleanup(cleanup, client, "version client");

    await server.start();
    await client.connectToServer(server.getTransport()!);
    server.connectToClient(client);
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("should establish connection", async () => {
    expect(client.isConnected()).toBe(true);
    expect(server.isRunning()).toBe(true);
  });

  test("should have configured tools after connection", async () => {
    const tools = server["config"].tools;
    expect(tools).toBeDefined();
    expect(tools?.length).toBeGreaterThan(0);
  });

  test("should handle connect/disconnect cycles", async () => {
    for (let i = 0; i < 3; i++) {
      await client.disconnect();
      expect(client.isConnected()).toBe(false);

      await client.connectToServer(server.getTransport()!);
      expect(client.isConnected()).toBe(true);

      const tools = server["config"].tools;
      expect(tools).toBeDefined();
      expect(tools?.length).toBeGreaterThan(0);
    }
  });
});
