/**
 * MCP Handshake - Capabilities Tests
 *
 * Tests for capability negotiation, dynamic updates, and listChanged notifications.
 */

import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import {
  CleanupManager,
  registerClientCleanup,
  registerServerCleanup,
} from "../../shared/cleanup.js";
import { createTestClient, type TestMcpClient } from "../../shared/test-client.js";
import { createBasicTestServer, TestMcpServer } from "../../shared/test-server.js";

describe("MCP Handshake - Capabilities", () => {
  let cleanup: CleanupManager;
  let server: TestMcpServer;
  let client: TestMcpClient;

  beforeEach(async () => {
    cleanup = new CleanupManager();
    server = createBasicTestServer("capabilities-test");
    client = createTestClient("capabilities-client");

    registerServerCleanup(cleanup, server, "capabilities server");
    registerClientCleanup(cleanup, client, "capabilities client");

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
  });

  test("should have resources capability configured", async () => {
    const resources = server["config"].resources;
    expect(resources).toBeDefined();
    expect(resources!.length).toBeGreaterThan(0);
  });

  test("should have prompts capability configured", async () => {
    const prompts = server["config"].prompts;
    expect(prompts).toBeDefined();
    expect(prompts!.length).toBeGreaterThan(0);
  });
});

describe("MCP Handshake - Dynamic Capability Updates", () => {
  test("should add new tool dynamically", async () => {
    const cleanup = new CleanupManager();
    const server = new TestMcpServer({ name: "dynamic-tools" });
    const client = createTestClient("dynamic-tools-client");

    registerServerCleanup(cleanup, server, "dynamic tools server");
    registerClientCleanup(cleanup, client, "dynamic tools client");

    await server.start();
    await client.connectToServer(server.getTransport()!);
    server.connectToClient(client);

    const initialTools = server["config"].tools;
    const initialCount = initialTools ? initialTools.length : 0;

    server.addTool(
      "dynamic_tool",
      "A dynamically added tool",
      { type: "object", properties: { input: { type: "string" } }, required: ["input"] },
      async (args) => ({
        content: [{ type: "text", text: `Dynamic: ${args.input}` }],
      }),
    );

    const updatedTools = server["config"].tools;
    expect(updatedTools!.length).toBeGreaterThan(initialCount);

    const toolNames = updatedTools!.map((t) => t.name);
    expect(toolNames).toContain("dynamic_tool");

    await cleanup.run();
  });

  test("should add new resource dynamically", async () => {
    const cleanup = new CleanupManager();
    const server = new TestMcpServer({ name: "dynamic-resources" });
    const client = createTestClient("dynamic-resources-client");

    registerServerCleanup(cleanup, server, "dynamic resources server");
    registerClientCleanup(cleanup, client, "dynamic resources client");

    await server.start();
    await client.connectToServer(server.getTransport()!);
    server.connectToClient(client);

    const initialResources = server["config"].resources;
    const initialCount = initialResources ? initialResources.length : 0;

    server.addResource(
      "test://dynamic-resource",
      "Dynamic Resource",
      "A dynamically added resource",
      "text/plain",
      "Dynamic resource content",
    );

    const updatedResources = server["config"].resources;
    expect(updatedResources!.length).toBeGreaterThan(initialCount);

    const resourceUris = updatedResources!.map((r) => r.uri);
    expect(resourceUris).toContain("test://dynamic-resource");

    await cleanup.run();
  });

  test("should add new prompt dynamically", async () => {
    const cleanup = new CleanupManager();
    const server = new TestMcpServer({ name: "dynamic-prompts" });
    const client = createTestClient("dynamic-prompts-client");

    registerServerCleanup(cleanup, server, "dynamic prompts server");
    registerClientCleanup(cleanup, client, "dynamic prompts client");

    await server.start();
    await client.connectToServer(server.getTransport()!);
    server.connectToClient(client);

    const initialPrompts = server["config"].prompts;
    const initialCount = initialPrompts ? initialPrompts.length : 0;

    server.addPrompt(
      "dynamic_prompt",
      "A dynamically added prompt",
      [{ name: "input", description: "Input text", required: true }],
      async (args) => `Dynamic prompt response: ${args.input}`,
    );

    const updatedPrompts = server["config"].prompts;
    expect(updatedPrompts!.length).toBeGreaterThan(initialCount);

    const promptNames = updatedPrompts!.map((p) => p.name);
    expect(promptNames).toContain("dynamic_prompt");

    await cleanup.run();
  });
});

describe("MCP Handshake - Capability Validation", () => {
  let cleanup: CleanupManager;
  let server: TestMcpServer;
  let client: TestMcpClient;

  beforeEach(async () => {
    cleanup = new CleanupManager();
    server = createBasicTestServer("validation-test");
    client = createTestClient("validation-client");

    registerServerCleanup(cleanup, server, "validation server");
    registerClientCleanup(cleanup, client, "validation client");

    await server.start();
    await client.connectToServer(server.getTransport()!);
    server.connectToClient(client);
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("should have valid tool input schemas", async () => {
    const tools = server["config"].tools;

    for (const tool of tools!) {
      expect(tool.inputSchema).toBeDefined();
      expect(typeof tool.inputSchema).toBe("object");

      if (tool.inputSchema.required && Array.isArray(tool.inputSchema.required)) {
        const properties = tool.inputSchema.properties || {};
        for (const requiredField of tool.inputSchema.required) {
          expect(properties[requiredField]).toBeDefined();
        }
      }
    }
  });

  test("should have valid resource URIs", async () => {
    const resources = server["config"].resources;

    for (const resource of resources!) {
      expect(resource.uri).toBeDefined();
      expect(typeof resource.uri).toBe("string");
      expect(resource.uri.length).toBeGreaterThan(0);
      expect(resource.uri.includes("://")).toBe(true);
    }
  });

  test("should have valid prompt arguments", async () => {
    const prompts = server["config"].prompts;

    for (const prompt of prompts!) {
      expect(prompt.arguments).toBeDefined();
      expect(Array.isArray(prompt.arguments)).toBe(true);

      for (const arg of prompt.arguments) {
        expect(arg.name).toBeDefined();
        expect(typeof arg.name).toBe("string");
      }
    }
  });
});

describe("MCP Handshake - List Changed Notifications", () => {
  test("should support tool list changes", async () => {
    const cleanup = new CleanupManager();
    const server = new TestMcpServer({ name: "list-changes" });
    const client = createTestClient("list-changes-client");

    registerServerCleanup(cleanup, server, "list changes server");
    registerClientCleanup(cleanup, client, "list changes client");

    await server.start();
    await client.connectToServer(server.getTransport()!);
    server.connectToClient(client);

    const tools1 = server["config"].tools;
    const count1 = tools1 ? tools1.length : 0;

    server.addTool(
      "new_tool",
      "New tool",
      { type: "object", properties: {}, required: [] },
      async () => ({ content: [{ type: "text", text: "new" }] }),
    );

    const tools2 = server["config"].tools;
    expect(tools2!.length).toBe(count1 + 1);

    const toolNames = tools2!.map((t) => t.name);
    expect(toolNames).toContain("new_tool");

    await cleanup.run();
  });

  test("should support resource list changes", async () => {
    const cleanup = new CleanupManager();
    const server = new TestMcpServer({ name: "resource-changes" });
    const client = createTestClient("resource-changes-client");

    registerServerCleanup(cleanup, server, "resource changes server");
    registerClientCleanup(cleanup, client, "resource changes client");

    await server.start();
    await client.connectToServer(server.getTransport()!);
    server.connectToClient(client);

    const resources1 = server["config"].resources;
    const count1 = resources1 ? resources1.length : 0;

    server.addResource(
      "test://new-resource",
      "New Resource",
      "A new resource",
      "text/plain",
      "New resource content",
    );

    const resources2 = server["config"].resources;
    expect(resources2!.length).toBe(count1 + 1);

    await cleanup.run();
  });

  test("should support prompt list changes", async () => {
    const cleanup = new CleanupManager();
    const server = new TestMcpServer({ name: "prompt-changes" });
    const client = createTestClient("prompt-changes-client");

    registerServerCleanup(cleanup, server, "prompt changes server");
    registerClientCleanup(cleanup, client, "prompt changes client");

    await server.start();
    await client.connectToServer(server.getTransport()!);
    server.connectToClient(client);

    const prompts1 = server["config"].prompts;
    const count1 = prompts1 ? prompts1.length : 0;

    server.addPrompt(
      "new_prompt",
      "New prompt",
      [{ name: "input", required: true }],
      async (args) => `New prompt: ${args.input}`,
    );

    const prompts2 = server["config"].prompts;
    expect(prompts2!.length).toBe(count1 + 1);

    await cleanup.run();
  });
});
