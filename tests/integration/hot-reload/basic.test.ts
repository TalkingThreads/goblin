/**
 * Hot-Reload Tests - Basic
 *
 * Tests for basic hot-reload functionality.
 */

import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import {
  CleanupManager,
  registerClientCleanup,
  registerServerCleanup,
} from "../../shared/cleanup.js";
import { createTestClient, type TestMcpClient } from "../../shared/test-client.js";
import { createBasicTestServer, type TestMcpServer } from "../../shared/test-server.js";

describe("Hot-Reload - Basic Functionality", () => {
  let cleanup: CleanupManager;
  let server: TestMcpServer;
  let client: TestMcpClient;

  beforeEach(async () => {
    cleanup = new CleanupManager();
    server = createBasicTestServer("hot-reload-basic");
    client = createTestClient("hot-reload-basic-client");

    registerServerCleanup(cleanup, server, "hot reload basic server");
    registerClientCleanup(cleanup, client, "hot reload basic client");

    await server.start();
    await client.connectToServer(server.getTransport()!);
    server.connectToClient(client);
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("server starts with initial tools", async () => {
    const tools = server["config"].tools!;
    expect(tools.length).toBe(3);
  });

  test("server starts with initial resources", async () => {
    const resources = server["config"].resources!;
    expect(resources.length).toBe(2);
  });

  test("server starts with initial prompts", async () => {
    const prompts = server["config"].prompts!;
    expect(prompts.length).toBe(1);
  });

  test("can add tools without restarting", async () => {
    const initialCount = server["config"].tools!.length;

    server.addTool(
      "hot_reload_tool",
      "Added without restart",
      { type: "object", properties: {}, required: [] },
      async () => ({ content: [{ type: "text", text: "hot" }] }),
    );

    expect(server["config"].tools!.length).toBe(initialCount + 1);
  });

  test("can add resources without restarting", async () => {
    const initialCount = server["config"].resources!.length;

    server.addResource(
      "test://hot-resource",
      "Hot Resource",
      "Added without restart",
      "text/plain",
      "Hot content",
    );

    expect(server["config"].resources!.length).toBe(initialCount + 1);
  });

  test("can add prompts without restarting", async () => {
    const initialCount = server["config"].prompts!.length;

    server.addPrompt(
      "hot_prompt",
      "Hot Prompt",
      [{ name: "input", required: false }],
      async (args) => `Hot: ${args.input || "default"}`,
    );

    expect(server["config"].prompts!.length).toBe(initialCount + 1);
  });
});

describe("Hot-Reload - Dynamic Updates", () => {
  let cleanup: CleanupManager;
  let server: TestMcpServer;

  beforeEach(async () => {
    cleanup = new CleanupManager();
    server = createBasicTestServer("hot-reload-dynamic");
    registerServerCleanup(cleanup, server, "hot reload dynamic server");
    await server.start();
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("can add multiple tools dynamically", async () => {
    const initialCount = server["config"].tools!.length;

    for (let i = 0; i < 5; i++) {
      server.addTool(
        `dynamic_tool_${i}`,
        `Dynamic tool ${i}`,
        { type: "object", properties: {}, required: [] },
        async () => ({ content: [{ type: "text", text: `tool_${i}` }] }),
      );
    }

    expect(server["config"].tools!.length).toBe(initialCount + 5);
  });

  test("can add multiple resources dynamically", async () => {
    const initialCount = server["config"].resources!.length;

    for (let i = 0; i < 5; i++) {
      server.addResource(
        `test://dynamic_resource_${i}`,
        `Dynamic Resource ${i}`,
        `Resource ${i}`,
        "text/plain",
        `Content ${i}`,
      );
    }

    expect(server["config"].resources!.length).toBe(initialCount + 5);
  });

  test("can add multiple prompts dynamically", async () => {
    const initialCount = server["config"].prompts!.length;

    for (let i = 0; i < 3; i++) {
      server.addPrompt(`dynamic_prompt_${i}`, `Dynamic prompt ${i}`, [], async () => `Prompt ${i}`);
    }

    expect(server["config"].prompts!.length).toBe(initialCount + 3);
  });

  test("all dynamic tools are accessible", async () => {
    for (let i = 0; i < 3; i++) {
      server.addTool(
        `accessible_tool_${i}`,
        `Accessible tool ${i}`,
        { type: "object", properties: {}, required: [] },
        async () => ({ content: [{ type: "text", text: "ok" }] }),
      );
    }

    const tools = server["config"].tools!;
    for (let i = 0; i < 3; i++) {
      expect(tools.find((t) => t.name === `accessible_tool_${i}`)).toBeDefined();
    }
  });

  test("all dynamic resources are accessible", async () => {
    for (let i = 0; i < 3; i++) {
      server.addResource(
        `test://accessible_resource_${i}`,
        `Accessible Resource ${i}`,
        `Resource ${i}`,
        "text/plain",
        `Content ${i}`,
      );
    }

    const resources = server["config"].resources!;
    for (let i = 0; i < 3; i++) {
      expect(resources.find((r) => r.uri === `test://accessible_resource_${i}`)).toBeDefined();
    }
  });
});

describe("Hot-Reload - Persistence", () => {
  let cleanup: CleanupManager;
  let server: TestMcpServer;

  beforeEach(async () => {
    cleanup = new CleanupManager();
    server = createBasicTestServer("hot-reload-persist");
    registerServerCleanup(cleanup, server, "hot reload persist server");
    await server.start();
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("initial tools persist", async () => {
    const initialTools = server["config"].tools!.map((t) => t.name);

    // Server continues running
    expect(server.isRunning()).toBe(true);

    const currentTools = server["config"].tools!.map((t) => t.name);
    expect(currentTools).toEqual(initialTools);
  });

  test("initial resources persist", async () => {
    const initialResources = server["config"].resources!.map((r) => r.uri);

    expect(server.isRunning()).toBe(true);

    const currentResources = server["config"].resources!.map((r) => r.uri);
    expect(currentResources).toEqual(initialResources);
  });

  test("initial prompts persist", async () => {
    const initialPrompts = server["config"].prompts!.map((p) => p.name);

    expect(server.isRunning()).toBe(true);

    const currentPrompts = server["config"].prompts!.map((p) => p.name);
    expect(currentPrompts).toEqual(initialPrompts);
  });

  test("dynamic additions persist while running", async () => {
    server.addTool(
      "persist_tool",
      "Persist tool",
      { type: "object", properties: {}, required: [] },
      async () => ({ content: [{ type: "text", text: "persist" }] }),
    );

    expect(server.isRunning()).toBe(true);

    const tools = server["config"].tools!.map((t) => t.name);
    expect(tools).toContain("persist_tool");
  });

  test("can add tools after extended running", async () => {
    // Simulate extended running by adding multiple tools
    for (let i = 0; i < 10; i++) {
      server.addTool(
        `extended_tool_${i}`,
        `Extended tool ${i}`,
        { type: "object", properties: {}, required: [] },
        async () => ({ content: [{ type: "text", text: "ok" }] }),
      );
    }

    expect(server["config"].tools!.length).toBe(3 + 10);
  });
});

describe("Hot-Reload - Server Identity", () => {
  let cleanup: CleanupManager;
  let server1: TestMcpServer;
  let server2: TestMcpServer;

  beforeEach(async () => {
    cleanup = new CleanupManager();
    server1 = createBasicTestServer("identity-server-1");
    server2 = createBasicTestServer("identity-server-2");

    registerServerCleanup(cleanup, server1, "identity server 1");
    registerServerCleanup(cleanup, server2, "identity server 2");

    await server1.start();
    await server2.start();
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("servers maintain unique identities", async () => {
    expect(server1["config"].name).not.toBe(server2["config"].name);
  });

  test("servers have independent configurations", async () => {
    server1.addTool(
      "server1_only",
      "Only on server1",
      { type: "object", properties: {}, required: [] },
      async () => ({ content: [{ type: "text", text: "s1" }] }),
    );

    const tools2 = server2["config"].tools!.map((t) => t.name);
    expect(tools2).not.toContain("server1_only");
  });

  test("both servers have same initial structure", async () => {
    expect(server1["config"].tools!.length).toBe(server2["config"].tools!.length);
    expect(server1["config"].resources!.length).toBe(server2["config"].resources!.length);
    expect(server1["config"].prompts!.length).toBe(server2["config"].prompts!.length);
  });
});
