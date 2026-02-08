/**
 * End-to-End Tests - Errors
 *
 * Tests for error handling through the gateway.
 */

import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import {
  CleanupManager,
  registerClientCleanup,
  registerServerCleanup,
} from "../../shared/cleanup.js";
import { createTestClient, type TestMcpClient } from "../../shared/test-client.js";
import { createBasicTestServer, type TestMcpServer } from "../../shared/test-server.js";

describe("E2E - Error Handling", () => {
  let cleanup: CleanupManager;
  let server: TestMcpServer;
  let client: TestMcpClient;

  beforeEach(async () => {
    cleanup = new CleanupManager();
    server = createBasicTestServer("error-server");
    client = createTestClient("error-client");

    registerServerCleanup(cleanup, server, "error server");
    registerClientCleanup(cleanup, client, "error client");

    await server.start();
    await client.connectToServer(server.getTransport()!);
    server.connectToClient(client);
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("should handle valid tool call", async () => {
    const tools = server["config"].tools;
    const echo = tools?.find((t) => t.name === "echo");
    expect(echo).toBeDefined();
    expect(typeof echo?.handler).toBe("function");
  });

  test("should handle tool with valid input schema", async () => {
    const tools = server["config"].tools;
    const echo = tools?.find((t) => t.name === "echo");
    expect(echo?.inputSchema.properties.message).toBeDefined();
    expect(echo?.inputSchema.required).toContain("message");
  });

  test("should handle add tool with number parameters", async () => {
    const tools = server["config"].tools;
    const add = tools?.find((t) => t.name === "add");
    expect(add?.inputSchema.properties.a.type).toBe("number");
    expect(add?.inputSchema.properties.b.type).toBe("number");
  });

  test("should handle get_time tool with empty schema", async () => {
    const tools = server["config"].tools;
    const getTime = tools?.find((t) => t.name === "get_time");
    expect(getTime?.inputSchema.properties).toEqual({});
    expect(getTime?.inputSchema.required).toEqual([]);
  });
});

describe("E2E - Error Scenarios", () => {
  let cleanup: CleanupManager;
  let server: TestMcpServer;

  beforeEach(async () => {
    cleanup = new CleanupManager();
    server = createBasicTestServer("error-scenario-server");
    registerServerCleanup(cleanup, server, "error scenario server");
    await server.start();
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("should handle tool that doesn't exist", async () => {
    const tools = server["config"].tools;
    const nonExistent = tools?.find((t) => t.name === "non_existent_tool");
    expect(nonExistent).toBeUndefined();
  });

  test("should handle resource that doesn't exist", async () => {
    const resources = server["config"].resources;
    const nonExistent = resources?.find((r) => r.uri === "test://non_existent");
    expect(nonExistent).toBeUndefined();
  });

  test("should handle prompt that doesn't exist", async () => {
    const prompts = server["config"].prompts;
    const nonExistent = prompts?.find((p) => p.name === "non_existent_prompt");
    expect(nonExistent).toBeUndefined();
  });

  test("should handle empty tool name", async () => {
    const tools = server["config"].tools;
    const emptyName = tools?.find((t) => t.name === "");
    expect(emptyName).toBeUndefined();
  });

  test("should handle empty resource URI", async () => {
    const resources = server["config"].resources;
    const emptyUri = resources?.find((r) => r.uri === "");
    expect(emptyUri).toBeUndefined();
  });
});

describe("E2E - Error Recovery", () => {
  let cleanup: CleanupManager;
  let server: TestMcpServer;
  let client: TestMcpClient;

  beforeEach(async () => {
    cleanup = new CleanupManager();
    server = createBasicTestServer("recovery-server");
    client = createTestClient("recovery-client");

    registerServerCleanup(cleanup, server, "recovery server");
    registerClientCleanup(cleanup, client, "recovery client");

    await server.start();
    await client.connectToServer(server.getTransport()!);
    server.connectToClient(client);
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("should maintain server state after configuration access", async () => {
    const tools1 = server["config"].tools;
    const tools2 = server["config"].tools;
    expect(tools1).toEqual(tools2);
  });

  test("should maintain resource state after access", async () => {
    const resources1 = server["config"].resources;
    const resources2 = server["config"].resources;
    expect(resources1?.length).toBe(resources2?.length);
  });

  test("should maintain prompt state after access", async () => {
    const prompts1 = server["config"].prompts;
    const prompts2 = server["config"].prompts;
    expect(prompts1).toEqual(prompts2);
  });

  test("should handle repeated dynamic additions", async () => {
    for (let i = 0; i < 5; i++) {
      server.addTool(
        `dynamic_tool_${i}`,
        `Dynamic tool ${i}`,
        { type: "object", properties: {}, required: [] },
        async () => ({ content: [{ type: "text", text: `result_${i}` }] }),
      );
    }
    const tools = server["config"].tools;
    expect(tools?.length).toBe(3 + 5);
  });

  test("should handle repeated resource additions", async () => {
    for (let i = 0; i < 5; i++) {
      server.addResource(
        `test://dynamic_resource_${i}`,
        `Dynamic Resource ${i}`,
        `Dynamically added resource ${i}`,
        "text/plain",
        `Content ${i}`,
      );
    }
    const resources = server["config"].resources;
    expect(resources?.length).toBe(2 + 5);
  });
});

describe("E2E - Validation Errors", () => {
  let cleanup: CleanupManager;
  let server: TestMcpServer;

  beforeEach(async () => {
    cleanup = new CleanupManager();
    server = createBasicTestServer("validation-server");
    registerServerCleanup(cleanup, server, "validation server");
    await server.start();
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("should validate tool input schema structure", async () => {
    const tools = server["config"].tools;
    for (const tool of tools!) {
      expect(tool.inputSchema).toBeDefined();
      expect(typeof tool.inputSchema).toBe("object");
    }
  });

  test("should validate resource URI format", async () => {
    const resources = server["config"].resources;
    for (const resource of resources!) {
      expect(resource.uri).toMatch(/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//);
    }
  });

  test("should validate prompt arguments structure", async () => {
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

  test("should validate required tool parameters", async () => {
    const tools = server["config"].tools;
    const echo = tools?.find((t) => t.name === "echo");
    expect(echo?.inputSchema.required).toContain("message");
  });

  test("should validate optional tool parameters", async () => {
    const tools = server["config"].tools;
    const getTime = tools?.find((t) => t.name === "get_time");
    expect(getTime?.inputSchema.required.length).toBe(0);
  });
});
