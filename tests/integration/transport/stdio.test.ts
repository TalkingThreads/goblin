/**
 * Transport Tests - STDIO
 *
 * Tests for STDIO transport behavior.
 */

import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import {
  CleanupManager,
  registerClientCleanup,
  registerServerCleanup,
} from "../../shared/cleanup.js";
import { createTestClient, type TestMcpClient } from "../../shared/test-client.js";
import { createBasicTestServer, type TestMcpServer } from "../../shared/test-server.js";

describe("Transport - STDIO Behavior", () => {
  let cleanup: CleanupManager;
  let server: TestMcpServer;
  let client: TestMcpClient;

  beforeEach(async () => {
    cleanup = new CleanupManager();
    server = createBasicTestServer("stdio-transport");
    client = createTestClient("stdio-client");

    registerServerCleanup(cleanup, server, "stdio server");
    registerClientCleanup(cleanup, client, "stdio client");

    await server.start();
    await client.connectToServer(server.getTransport()!);
    server.connectToClient(client);
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("server should have stdio-compatible tool structure", async () => {
    const tools = server["config"].tools!;

    for (const tool of tools) {
      expect(tool.name).toBeDefined();
      expect(typeof tool.name).toBe("string");
      expect(tool.description).toBeDefined();
      expect(typeof tool.description).toBe("string");
      expect(tool.inputSchema).toBeDefined();
      expect(typeof tool.inputSchema).toBe("object");
    }
  });

  test("echo tool should have message parameter", async () => {
    const tools = server["config"].tools!;
    const echo = tools.find((t) => t.name === "echo");

    expect(echo).toBeDefined();
    expect(echo!.inputSchema.properties.message).toBeDefined();
    expect(echo!.inputSchema.required).toContain("message");
  });

  test("add tool should have a and b parameters", async () => {
    const tools = server["config"].tools!;
    const add = tools.find((t) => t.name === "add");

    expect(add).toBeDefined();
    expect(add!.inputSchema.properties.a).toBeDefined();
    expect(add!.inputSchema.properties.b).toBeDefined();
    expect(add!.inputSchema.required).toContain("a");
    expect(add!.inputSchema.required).toContain("b");
  });

  test("get_time tool should have no required parameters", async () => {
    const tools = server["config"].tools!;
    const getTime = tools.find((t) => t.name === "get_time");

    expect(getTime).toBeDefined();
    expect(getTime!.inputSchema.required.length).toBe(0);
  });

  test("all tools should have type: object in schema", async () => {
    const tools = server["config"].tools!;

    for (const tool of tools) {
      expect(tool.inputSchema.type).toBe("object");
    }
  });
});

describe("Transport - STDIO Resource Handling", () => {
  let cleanup: CleanupManager;
  let server: TestMcpServer;

  beforeEach(async () => {
    cleanup = new CleanupManager();
    server = createBasicTestServer("stdio-resource");
    registerServerCleanup(cleanup, server, "stdio resource server");
    await server.start();
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("resources should have valid URIs", async () => {
    const resources = server["config"].resources!;

    for (const resource of resources) {
      expect(resource.uri.includes("://")).toBe(true);
    }
  });

  test("resources should have mime types", async () => {
    const resources = server["config"].resources!;

    for (const resource of resources) {
      expect(resource.mimeType.length).toBeGreaterThan(0);
    }
  });

  test("resources should have content", async () => {
    const resources = server["config"].resources!;

    for (const resource of resources) {
      expect(resource.content).toBeDefined();
      expect(typeof resource.content).toBe("string");
    }
  });

  test("first resource should be text/plain", async () => {
    const resources = server["config"].resources!;
    expect(resources[0].mimeType).toBe("text/plain");
  });

  test("second resource should be application/json", async () => {
    const resources = server["config"].resources!;
    expect(resources[1].mimeType).toBe("application/json");
  });

  test("json resource should contain valid JSON", async () => {
    const resources = server["config"].resources!;
    const jsonResource = resources.find((r) => r.mimeType === "application/json");

    expect(jsonResource).toBeDefined();
    expect(() => JSON.parse(jsonResource!.content)).not.toThrow();
    expect(JSON.parse(jsonResource!.content)).toEqual({ key: "value" });
  });
});

describe("Transport - STDIO Prompt Handling", () => {
  let cleanup: CleanupManager;
  let server: TestMcpServer;

  beforeEach(async () => {
    cleanup = new CleanupManager();
    server = createBasicTestServer("stdio-prompt");
    registerServerCleanup(cleanup, server, "stdio prompt server");
    await server.start();
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("prompts should have names", async () => {
    const prompts = server["config"].prompts!;

    for (const prompt of prompts) {
      expect(prompt.name.length).toBeGreaterThan(0);
    }
  });

  test("prompts should have descriptions", async () => {
    const prompts = server["config"].prompts!;

    for (const prompt of prompts) {
      expect(prompt.description.length).toBeGreaterThan(0);
    }
  });

  test("prompts should have arguments array", async () => {
    const prompts = server["config"].prompts!;

    for (const prompt of prompts) {
      expect(Array.isArray(prompt.arguments)).toBe(true);
    }
  });

  test("prompts should have handlers", async () => {
    const prompts = server["config"].prompts!;

    for (const prompt of prompts) {
      expect(typeof prompt.handler).toBe("function");
    }
  });

  test("greet prompt should have name argument", async () => {
    const prompts = server["config"].prompts!;
    const greet = prompts.find((p) => p.name === "greet");

    expect(greet).toBeDefined();
    const nameArg = greet!.arguments.find((a) => a.name === "name");
    expect(nameArg).toBeDefined();
    expect(nameArg!.required).toBe(true);
  });
});

describe("Transport - STDIO Dynamic Updates", () => {
  let cleanup: CleanupManager;
  let server: TestMcpServer;

  beforeEach(async () => {
    cleanup = new CleanupManager();
    server = createBasicTestServer("stdio-dynamic");
    registerServerCleanup(cleanup, server, "stdio dynamic server");
    await server.start();
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("can add tools dynamically", async () => {
    const initialCount = server["config"].tools!.length;

    server.addTool(
      "dynamic_stdio_tool",
      "Dynamic tool for stdio",
      { type: "object", properties: {}, required: [] },
      async () => ({ content: [{ type: "text", text: "dynamic" }] }),
    );

    expect(server["config"].tools!.length).toBe(initialCount + 1);
  });

  test("can add resources dynamically", async () => {
    const initialCount = server["config"].resources!.length;

    server.addResource(
      "test://stdio-dynamic-resource",
      "Dynamic Resource",
      "Added dynamically",
      "text/plain",
      "Dynamic content",
    );

    expect(server["config"].resources!.length).toBe(initialCount + 1);
  });

  test("can add prompts dynamically", async () => {
    const initialCount = server["config"].prompts!.length;

    server.addPrompt(
      "dynamic_stdio_prompt",
      "Dynamic prompt for stdio",
      [{ name: "input", required: false }],
      async (args) => `Dynamic: ${args.input || "default"}`,
    );

    expect(server["config"].prompts!.length).toBe(initialCount + 1);
  });

  test("dynamic tool should have valid schema", async () => {
    server.addTool(
      "schema_test",
      "Schema test tool",
      {
        type: "object",
        properties: {
          param1: { type: "string", description: "Parameter 1" },
          param2: { type: "number", description: "Parameter 2" },
        },
        required: ["param1"],
      },
      async () => ({ content: [{ type: "text", text: "ok" }] }),
    );

    const tool = server["config"].tools!.find((t) => t.name === "schema_test");
    expect(tool).toBeDefined();
    expect(tool!.inputSchema.properties.param1).toBeDefined();
    expect(tool!.inputSchema.required).toContain("param1");
  });
});
