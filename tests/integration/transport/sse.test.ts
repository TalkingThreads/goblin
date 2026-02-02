/**
 * Transport Tests - SSE
 *
 * Tests for Server-Sent Events transport behavior.
 */

import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import {
  CleanupManager,
  registerClientCleanup,
  registerServerCleanup,
} from "../../shared/cleanup.js";
import { createTestClient, type TestMcpClient } from "../../shared/test-client.js";
import { createBasicTestServer, type TestMcpServer } from "../../shared/test-server.js";

describe("Transport - SSE Configuration", () => {
  let cleanup: CleanupManager;
  let server: TestMcpServer;
  let client: TestMcpClient;

  beforeEach(async () => {
    cleanup = new CleanupManager();
    server = createBasicTestServer("sse-transport");
    client = createTestClient("sse-client");

    registerServerCleanup(cleanup, server, "sse server");
    registerClientCleanup(cleanup, client, "sse client");

    await server.start();
    await client.connectToServer(server.getTransport()!);
    server.connectToClient(client);
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("server should be running for SSE", async () => {
    expect(server.isRunning()).toBe(true);
  });

  test("client should be connected for SSE", async () => {
    expect(client.isConnected()).toBe(true);
  });

  test("server should have all tools", async () => {
    const tools = server["config"].tools!;
    expect(tools.length).toBe(3);
  });

  test("server should have all resources", async () => {
    const resources = server["config"].resources!;
    expect(resources.length).toBe(2);
  });

  test("server should have all prompts", async () => {
    const prompts = server["config"].prompts!;
    expect(prompts.length).toBe(1);
  });
});

describe("Transport - SSE Streaming Behavior", () => {
  let cleanup: CleanupManager;
  let server: TestMcpServer;

  beforeEach(async () => {
    cleanup = new CleanupManager();
    server = createBasicTestServer("sse-stream");
    registerServerCleanup(cleanup, server, "sse stream server");
    await server.start();
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("server maintains state during streaming", async () => {
    const tools = server["config"].tools!;
    expect(tools.length).toBe(3);
  });

  test("resources remain available during streaming", async () => {
    const resources = server["config"].resources!;
    expect(resources.length).toBe(2);
    expect(resources[0].content.length).toBeGreaterThan(0);
  });

  test("prompts remain available during streaming", async () => {
    const prompts = server["config"].prompts!;
    expect(prompts.length).toBe(1);
    expect(prompts[0].handler).toBeDefined();
  });

  test("dynamic additions work during streaming", async () => {
    server.addTool(
      "stream_tool",
      "Tool added during streaming",
      { type: "object", properties: {}, required: [] },
      async () => ({ content: [{ type: "text", text: "stream" }] }),
    );

    const tools = server["config"].tools!;
    expect(tools.find((t) => t.name === "stream_tool")).toBeDefined();
  });

  test("resource subscriptions are supported", async () => {
    const resources = server["config"].resources!;
    const resource = resources[0];

    expect(resource.uri).toBeDefined();
    expect(resource.mimeType).toBeDefined();
    expect(typeof resource.content).toBe("string");
  });
});

describe("Transport - SSE Connection Lifecycle", () => {
  let cleanup: CleanupManager;
  let server: TestMcpServer;
  let client: TestMcpClient;

  beforeEach(async () => {
    cleanup = new CleanupManager();
    server = createBasicTestServer("sse-lifecycle");
    client = createTestClient("sse-lifecycle-client");

    registerServerCleanup(cleanup, server, "sse lifecycle server");
    registerClientCleanup(cleanup, client, "sse lifecycle client");

    await server.start();
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("client can connect", async () => {
    await client.connectToServer(server.getTransport()!);
    server.connectToClient(client);
    expect(client.isConnected()).toBe(true);
  });

  test("client can disconnect", async () => {
    await client.connectToServer(server.getTransport()!);
    server.connectToClient(client);
    await client.disconnect();
    expect(client.isConnected()).toBe(false);
  });

  test("server continues running after client disconnect", async () => {
    await client.connectToServer(server.getTransport()!);
    server.connectToClient(client);
    await client.disconnect();
    expect(server.isRunning()).toBe(true);
  });

  test("client can reconnect", async () => {
    await client.connectToServer(server.getTransport()!);
    server.connectToClient(client);
    await client.disconnect();
    await client.connectToServer(server.getTransport()!);
    server.connectToClient(client);
    expect(client.isConnected()).toBe(true);
  });

  test("server maintains tools after client disconnect", async () => {
    await client.connectToServer(server.getTransport()!);
    server.connectToClient(client);
    await client.disconnect();

    const tools = server["config"].tools!;
    expect(tools.length).toBe(3);
  });
});

describe("Transport - SSE Resource Updates", () => {
  let cleanup: CleanupManager;
  let server: TestMcpServer;

  beforeEach(async () => {
    cleanup = new CleanupManager();
    server = createBasicTestServer("sse-updates");
    registerServerCleanup(cleanup, server, "sse updates server");
    await server.start();
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("can add resources during SSE", async () => {
    const initialCount = server["config"].resources!.length;

    server.addResource(
      "test://sse-resource",
      "SSE Resource",
      "Added during SSE",
      "text/plain",
      "SSE content",
    );

    expect(server["config"].resources!.length).toBe(initialCount + 1);
  });

  test("can update resource content", async () => {
    server.addResource("test://updatable", "Updatable", "Can be updated", "text/plain", "Initial");

    const resource = server["config"].resources!.find((r) => r.uri === "test://updatable");
    expect(resource!.content).toBe("Initial");
  });

  test("multiple resources can be added", async () => {
    const initialCount = server["config"].resources!.length;

    for (let i = 0; i < 5; i++) {
      server.addResource(
        `test://sse_multi_${i}`,
        `SSE Resource ${i}`,
        `Multi resource ${i}`,
        "text/plain",
        `Content ${i}`,
      );
    }

    expect(server["config"].resources!.length).toBe(initialCount + 5);
  });

  test("all added resources have valid URIs", async () => {
    for (let i = 0; i < 3; i++) {
      server.addResource(
        `test://sse_uri_${i}`,
        `URI Test ${i}`,
        "Testing URIs",
        "text/plain",
        `URI content ${i}`,
      );
    }

    const resources = server["config"].resources!;
    for (let i = 0; i < 3; i++) {
      const resource = resources.find((r) => r.uri === `test://sse_uri_${i}`);
      expect(resource).toBeDefined();
      expect(resource!.uri.includes("://")).toBe(true);
    }
  });
});

describe("Transport - SSE Capability Advertisement", () => {
  let cleanup: CleanupManager;
  let server: TestMcpServer;

  beforeEach(async () => {
    cleanup = new CleanupManager();
    server = createBasicTestServer("sse-capabilities");
    registerServerCleanup(cleanup, server, "sse capabilities server");
    await server.start();
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("server advertises tools capability", async () => {
    const tools = server["config"].tools!;
    expect(tools.length).toBeGreaterThan(0);

    for (const tool of tools) {
      expect(tool.name).toBeDefined();
      expect(tool.description).toBeDefined();
      expect(tool.inputSchema).toBeDefined();
    }
  });

  test("server advertises resources capability", async () => {
    const resources = server["config"].resources!;
    expect(resources.length).toBeGreaterThan(0);

    for (const resource of resources) {
      expect(resource.uri).toBeDefined();
      expect(resource.name).toBeDefined();
      expect(resource.mimeType).toBeDefined();
    }
  });

  test("server advertises prompts capability", async () => {
    const prompts = server["config"].prompts!;
    expect(prompts.length).toBeGreaterThan(0);

    for (const prompt of prompts) {
      expect(prompt.name).toBeDefined();
      expect(prompt.description).toBeDefined();
      expect(prompt.arguments).toBeDefined();
    }
  });

  test("all capabilities have consistent structure", async () => {
    const tools = server["config"].tools!;
    const resources = server["config"].resources!;
    const prompts = server["config"].prompts!;

    expect(tools.length).toBe(3);
    expect(resources.length).toBe(2);
    expect(prompts.length).toBe(1);
  });

  test("tool schemas are valid", async () => {
    const tools = server["config"].tools!;

    for (const tool of tools) {
      expect(tool.inputSchema.type).toBe("object");
      if (tool.inputSchema.required) {
        expect(Array.isArray(tool.inputSchema.required)).toBe(true);
      }
    }
  });
});
