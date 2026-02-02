/**
 * Hot-Reload Tests - Server Lifecycle
 *
 * Tests for server lifecycle during hot-reload.
 */

import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import {
  CleanupManager,
  registerClientCleanup,
  registerServerCleanup,
} from "../../shared/cleanup.js";
import { createTestClient, type TestMcpClient } from "../../shared/test-client.js";
import { createBasicTestServer, type TestMcpServer } from "../../shared/test-server.js";

describe("Hot-Reload - Server Lifecycle", () => {
  let cleanup: CleanupManager;
  let server: TestMcpServer;
  let client: TestMcpClient;

  beforeEach(async () => {
    cleanup = new CleanupManager();
    server = createBasicTestServer("lifecycle-server");
    client = createTestClient("lifecycle-client");

    registerServerCleanup(cleanup, server, "lifecycle server");
    registerClientCleanup(cleanup, client, "lifecycle client");

    await server.start();
    await client.connectToServer(server.getTransport()!);
    server.connectToClient(client);
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("server is running initially", async () => {
    expect(server.isRunning()).toBe(true);
  });

  test("client is connected initially", async () => {
    expect(client.isConnected()).toBe(true);
  });

  test("server maintains tools during lifecycle", async () => {
    const tools = server["config"].tools!;
    expect(tools.length).toBe(3);
  });

  test("server maintains resources during lifecycle", async () => {
    const resources = server["config"].resources!;
    expect(resources.length).toBe(2);
  });

  test("server maintains prompts during lifecycle", async () => {
    const prompts = server["config"].prompts!;
    expect(prompts.length).toBe(1);
  });

  test("can add tools while server is running", async () => {
    server.addTool(
      "running_tool",
      "Added while running",
      { type: "object", properties: {}, required: [] },
      async () => ({ content: [{ type: "text", text: "ok" }] }),
    );

    expect(server["config"].tools!.length).toBe(4);
    expect(server.isRunning()).toBe(true);
  });
});

describe("Hot-Reload - Connection Persistence", () => {
  let cleanup: CleanupManager;
  let server: TestMcpServer;
  let client: TestMcpClient;

  beforeEach(async () => {
    cleanup = new CleanupManager();
    server = createBasicTestServer("persist-conn");
    client = createTestClient("persist-conn-client");

    registerServerCleanup(cleanup, server, "persist conn server");
    registerClientCleanup(cleanup, client, "persist conn client");

    await server.start();
    await client.connectToServer(server.getTransport()!);
    server.connectToClient(client);
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("client connection persists after tool addition", async () => {
    expect(client.isConnected()).toBe(true);

    server.addTool(
      "persist_conn_tool",
      "Tool after connection",
      { type: "object", properties: {}, required: [] },
      async () => ({ content: [{ type: "text", text: "ok" }] }),
    );

    expect(client.isConnected()).toBe(true);
  });

  test("client connection persists after resource addition", async () => {
    expect(client.isConnected()).toBe(true);

    server.addResource(
      "test://persist-conn-resource",
      "Persist Resource",
      "Resource after connection",
      "text/plain",
      "content",
    );

    expect(client.isConnected()).toBe(true);
  });

  test("client connection persists after prompt addition", async () => {
    expect(client.isConnected()).toBe(true);

    server.addPrompt("persist_conn_prompt", "Persist Prompt", [], async () => "Prompt");

    expect(client.isConnected()).toBe(true);
  });

  test("can disconnect and reconnect", async () => {
    expect(client.isConnected()).toBe(true);

    await client.disconnect();
    expect(client.isConnected()).toBe(false);

    await client.connectToServer(server.getTransport()!);
    server.connectToClient(client);
    expect(client.isConnected()).toBe(true);
  });

  test("server continues running after client disconnect", async () => {
    await client.disconnect();
    expect(server.isRunning()).toBe(true);
  });
});

describe("Hot-Reload - Multi-Server Hot-Reload", () => {
  let cleanup: CleanupManager;
  let server1: TestMcpServer;
  let server2: TestMcpServer;

  beforeEach(async () => {
    cleanup = new CleanupManager();
    server1 = createBasicTestServer("multi-hot-1");
    server2 = createBasicTestServer("multi-hot-2");

    registerServerCleanup(cleanup, server1, "multi hot server 1");
    registerServerCleanup(cleanup, server2, "multi hot server 2");

    await server1.start();
    await server2.start();
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("can hot-reload server1 independently", async () => {
    const initialTools1 = server1["config"].tools!.length;
    const initialTools2 = server2["config"].tools!.length;

    server1.addTool(
      "server1_hot",
      "Hot tool on server1",
      { type: "object", properties: {}, required: [] },
      async () => ({ content: [{ type: "text", text: "s1" }] }),
    );

    expect(server1["config"].tools!.length).toBe(initialTools1 + 1);
    expect(server2["config"].tools!.length).toBe(initialTools2);
  });

  test("can hot-reload server2 independently", async () => {
    const initialTools1 = server1["config"].tools!.length;
    const initialTools2 = server2["config"].tools!.length;

    server2.addTool(
      "server2_hot",
      "Hot tool on server2",
      { type: "object", properties: {}, required: [] },
      async () => ({ content: [{ type: "text", text: "s2" }] }),
    );

    expect(server2["config"].tools!.length).toBe(initialTools2 + 1);
    expect(server1["config"].tools!.length).toBe(initialTools1);
  });

  test("both servers can be hot-reloaded simultaneously", async () => {
    server1.addTool(
      "s1_tool",
      "S1",
      { type: "object", properties: {}, required: [] },
      async () => ({ content: [{ type: "text", text: "1" }] }),
    );
    server2.addTool(
      "s2_tool",
      "S2",
      { type: "object", properties: {}, required: [] },
      async () => ({ content: [{ type: "text", text: "2" }] }),
    );

    const tools1 = server1["config"].tools!.map((t) => t.name);
    const tools2 = server2["config"].tools!.map((t) => t.name);

    expect(tools1).toContain("s1_tool");
    expect(tools2).toContain("s2_tool");
    expect(tools1).not.toContain("s2_tool");
    expect(tools2).not.toContain("s1_tool");
  });

  test("servers maintain independent hot-reload state", async () => {
    for (let i = 0; i < 5; i++) {
      server1.addTool(
        `s1_dynamic_${i}`,
        "S1",
        { type: "object", properties: {}, required: [] },
        async () => ({ content: [{ type: "text", text: "1" }] }),
      );
    }

    expect(server1["config"].tools!.length).toBe(3 + 5);
    expect(server2["config"].tools!.length).toBe(3);
  });
});

describe("Hot-Reload - Resource Hot-Reload", () => {
  let cleanup: CleanupManager;
  let server: TestMcpServer;

  beforeEach(async () => {
    cleanup = new CleanupManager();
    server = createBasicTestServer("resource-hot");
    registerServerCleanup(cleanup, server, "resource hot server");
    await server.start();
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("can add resources while running", async () => {
    const initial = server["config"].resources!.length;

    server.addResource(
      "test://hot-resource",
      "Hot Resource",
      "Added while running",
      "text/plain",
      "content",
    );

    expect(server["config"].resources!.length).toBe(initial + 1);
  });

  test("resources have valid structure after hot-reload", async () => {
    server.addResource(
      "test://structured-resource",
      "Structured Resource",
      "With proper structure",
      "text/plain",
      "content",
    );

    const resource = server["config"].resources!.find(
      (r) => r.uri === "test://structured-resource",
    );
    expect(resource!.uri).toBe("test://structured-resource");
    expect(resource!.name).toBe("Structured Resource");
    expect(resource!.mimeType).toBe("text/plain");
    expect(resource!.content).toBe("content");
  });

  test("can add multiple resources in sequence", async () => {
    const initial = server["config"].resources!.length;

    for (let i = 0; i < 3; i++) {
      server.addResource(
        `test://sequence_resource_${i}`,
        `Sequence Resource ${i}`,
        `Resource ${i} in sequence`,
        "text/plain",
        `Content ${i}`,
      );
    }

    expect(server["config"].resources!.length).toBe(initial + 3);
  });
});

describe("Hot-Reload - Prompt Hot-Reload", () => {
  let cleanup: CleanupManager;
  let server: TestMcpServer;

  beforeEach(async () => {
    cleanup = new CleanupManager();
    server = createBasicTestServer("prompt-hot");
    registerServerCleanup(cleanup, server, "prompt hot server");
    await server.start();
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("can add prompts while running", async () => {
    const initial = server["config"].prompts!.length;

    server.addPrompt(
      "hot_prompt",
      "Hot Prompt",
      [{ name: "input", required: false }],
      async (args) => `Hot: ${args.input}`,
    );

    expect(server["config"].prompts!.length).toBe(initial + 1);
  });

  test("prompts have valid structure after hot-reload", async () => {
    server.addPrompt(
      "structured-prompt",
      "Structured Prompt",
      [
        { name: "arg1", required: true },
        { name: "arg2", required: false },
      ],
      async (args) => `Result: ${args.arg1}`,
    );

    const prompt = server["config"].prompts!.find((p) => p.name === "structured-prompt");
    expect(prompt!.name).toBe("structured-prompt");
    expect(prompt!.description).toBe("Structured Prompt");
    expect(prompt!.arguments.length).toBe(2);
    expect(typeof prompt!.handler).toBe("function");
  });

  test("prompt handler executes correctly", async () => {
    server.addPrompt(
      "handler-test",
      "Handler Test",
      [{ name: "value", required: true }],
      async (args) => `Handler received: ${args.value}`,
    );

    const prompt = server["config"].prompts!.find((p) => p.name === "handler-test");
    const result = await prompt!.handler({ value: "test-value" });
    expect(result).toBe("Handler received: test-value");
  });
});
