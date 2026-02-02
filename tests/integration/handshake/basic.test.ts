/**
 * MCP Handshake - Basic Tests
 *
 * Tests for successful initialize request/response and basic handshake flow.
 * These tests verify the test infrastructure is working correctly.
 */

import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import {
  CleanupManager,
  registerClientCleanup,
  registerServerCleanup,
} from "../../shared/cleanup.js";
import { createTestClient, type TestMcpClient } from "../../shared/test-client.js";
import type { TestMcpServer } from "../../shared/test-server.js";
import { createBasicTestServer } from "../../shared/test-server.js";

describe("MCP Handshake - Basic", () => {
  let cleanup: CleanupManager;
  let server: TestMcpServer;
  let client: TestMcpClient;

  beforeEach(async () => {
    cleanup = new CleanupManager();
    server = createBasicTestServer("backend-server");
    client = createTestClient("test-client");

    registerServerCleanup(cleanup, server, "backend server");
    registerClientCleanup(cleanup, client, "test client");

    // Start server and connect client
    await server.start();
    await client.connectToServer(server.getTransport()!);
    server.connectToClient(client);
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("should create server and client instances", async () => {
    expect(server).toBeDefined();
    expect(client).toBeDefined();
  });

  test("should start server successfully", async () => {
    expect(server.isRunning()).toBe(true);
  });

  test("should connect client successfully", async () => {
    expect(client.isConnected()).toBe(true);
  });

  test("should have tools configured on server", async () => {
    // Verify the server has tools by checking its config
    expect(server["config"].tools).toBeDefined();
    expect(server["config"].tools!.length).toBeGreaterThan(0);
  });

  test("should have resources configured on server", async () => {
    expect(server["config"].resources).toBeDefined();
    expect(server["config"].resources!.length).toBeGreaterThan(0);
  });

  test("should have prompts configured on server", async () => {
    expect(server["config"].prompts).toBeDefined();
    expect(server["config"].prompts!.length).toBeGreaterThan(0);
  });

  test("should stop server successfully", async () => {
    await server.stop();
    expect(server.isRunning()).toBe(false);
  });

  test("should disconnect client successfully", async () => {
    await client.disconnect();
    expect(client.isConnected()).toBe(false);
  });
});

describe("MCP Handshake - Capability Negotiation", () => {
  let cleanup: CleanupManager;
  let server: TestMcpServer;
  let client: TestMcpClient;

  beforeEach(async () => {
    cleanup = new CleanupManager();
    server = createBasicTestServer("capability-test");
    client = createTestClient("capability-client");

    registerServerCleanup(cleanup, server, "capability server");
    registerClientCleanup(cleanup, client, "capability client");

    await server.start();
    await client.connectToServer(server.getTransport()!);
    server.connectToClient(client);
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("should have tools capability configured", async () => {
    const tools = server["config"].tools;
    expect(tools).toBeDefined();
    expect(tools!.length).toBeGreaterThan(0);

    // Verify tool structure
    const tool = tools![0];
    expect(tool.name).toBeDefined();
    expect(tool.description).toBeDefined();
    expect(tool.inputSchema).toBeDefined();
  });

  test("should have resources capability configured", async () => {
    const resources = server["config"].resources;
    expect(resources).toBeDefined();
    expect(resources!.length).toBeGreaterThan(0);

    // Verify resource structure
    const resource = resources![0];
    expect(resource.uri).toBeDefined();
    expect(resource.name).toBeDefined();
    expect(resource.mimeType).toBeDefined();
    expect(resource.content).toBeDefined();
  });

  test("should have prompts capability configured", async () => {
    const prompts = server["config"].prompts;
    expect(prompts).toBeDefined();
    expect(prompts!.length).toBeGreaterThan(0);

    // Verify prompt structure
    const prompt = prompts![0];
    expect(prompt.name).toBeDefined();
    expect(prompt.description).toBeDefined();
    expect(prompt.arguments).toBeDefined();
  });

  test("should support resource subscription method", async () => {
    // Verify the client has the subscribeResource method
    expect(typeof client.subscribeResource).toBe("function");
  });
});
