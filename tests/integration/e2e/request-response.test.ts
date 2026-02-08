/**
 * End-to-End Tests - Request/Response
 *
 * Tests for complete request/response cycles through the gateway.
 */

import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import {
  CleanupManager,
  registerClientCleanup,
  registerServerCleanup,
} from "../../shared/cleanup.js";
import { createTestClient, type TestMcpClient } from "../../shared/test-client.js";
import { createBasicTestServer, type TestMcpServer } from "../../shared/test-server.js";

describe("E2E - Request/Response", () => {
  let cleanup: CleanupManager;
  let server: TestMcpServer;
  let client: TestMcpClient;

  beforeEach(async () => {
    cleanup = new CleanupManager();
    server = createBasicTestServer("e2e-server");
    client = createTestClient("e2e-client");

    registerServerCleanup(cleanup, server, "e2e server");
    registerClientCleanup(cleanup, client, "e2e client");

    await server.start();
    await client.connectToServer(server.getTransport()!);
    server.connectToClient(client);
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("should have echo tool available", async () => {
    const tools = server["config"].tools;
    expect(tools).toBeDefined();
    const toolNames = tools?.map((t) => t.name);
    expect(toolNames).toContain("echo");
  });

  test("should have add tool available", async () => {
    const tools = server["config"].tools;
    expect(tools).toBeDefined();
    const toolNames = tools?.map((t) => t.name);
    expect(toolNames).toContain("add");
  });

  test("should have get_time tool available", async () => {
    const tools = server["config"].tools;
    expect(tools).toBeDefined();
    const toolNames = tools?.map((t) => t.name);
    expect(toolNames).toContain("get_time");
  });

  test("should have resources available", async () => {
    const resources = server["config"].resources;
    expect(resources).toBeDefined();
    expect(resources?.length).toBeGreaterThan(0);
  });

  test("should have prompts available", async () => {
    const prompts = server["config"].prompts;
    expect(prompts).toBeDefined();
    expect(prompts?.length).toBeGreaterThan(0);
  });

  test("should have first resource with correct URI", async () => {
    const resources = server["config"].resources;
    expect(resources?.[0].uri).toBe("test://resource1");
  });

  test("should have first resource with content", async () => {
    const resources = server["config"].resources;
    expect(resources?.[0].content).toBeDefined();
    expect(typeof resources?.[0].content).toBe("string");
  });

  test("should have greet prompt with arguments", async () => {
    const prompts = server["config"].prompts;
    const greet = prompts?.find((p) => p.name === "greet");
    expect(greet).toBeDefined();
    expect(greet?.arguments).toBeDefined();
    expect(greet?.arguments.length).toBeGreaterThan(0);
  });
});

describe("E2E - Tool Execution", () => {
  let cleanup: CleanupManager;
  let server: TestMcpServer;
  let client: TestMcpClient;

  beforeEach(async () => {
    cleanup = new CleanupManager();
    server = createBasicTestServer("tool-exec-server");
    client = createTestClient("tool-exec-client");

    registerServerCleanup(cleanup, server, "tool exec server");
    registerClientCleanup(cleanup, client, "tool exec client");

    await server.start();
    await client.connectToServer(server.getTransport()!);
    server.connectToClient(client);
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("echo tool should have message parameter", async () => {
    const tools = server["config"].tools;
    const echo = tools?.find((t) => t.name === "echo");
    expect(echo).toBeDefined();
    expect(echo?.inputSchema.properties).toBeDefined();
    expect(echo?.inputSchema.properties.message).toBeDefined();
    expect(echo?.inputSchema.required).toContain("message");
  });

  test("add tool should have a and b parameters", async () => {
    const tools = server["config"].tools;
    const add = tools?.find((t) => t.name === "add");
    expect(add).toBeDefined();
    expect(add?.inputSchema.properties.a).toBeDefined();
    expect(add?.inputSchema.properties.b).toBeDefined();
    expect(add?.inputSchema.required).toContain("a");
    expect(add?.inputSchema.required).toContain("b");
  });

  test("get_time tool should have no required parameters", async () => {
    const tools = server["config"].tools;
    const getTime = tools?.find((t) => t.name === "get_time");
    expect(getTime).toBeDefined();
    expect(getTime?.inputSchema.required).toBeDefined();
    expect(getTime?.inputSchema.required.length).toBe(0);
  });

  test("echo tool handler should return text content", async () => {
    const tools = server["config"].tools;
    const echo = tools?.find((t) => t.name === "echo");
    expect(echo).toBeDefined();
    expect(typeof echo?.handler).toBe("function");
  });

  test("add tool handler should return text content", async () => {
    const tools = server["config"].tools;
    const add = tools?.find((t) => t.name === "add");
    expect(add).toBeDefined();
    expect(typeof add?.handler).toBe("function");
  });
});

describe("E2E - Resource Access", () => {
  let cleanup: CleanupManager;
  let server: TestMcpServer;
  let client: TestMcpClient;

  beforeEach(async () => {
    cleanup = new CleanupManager();
    server = createBasicTestServer("resource-server");
    client = createTestClient("resource-client");

    registerServerCleanup(cleanup, server, "resource server");
    registerClientCleanup(cleanup, client, "resource client");

    await server.start();
    await client.connectToServer(server.getTransport()!);
    server.connectToClient(client);
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("should have two resources", async () => {
    const resources = server["config"].resources;
    expect(resources?.length).toBe(2);
  });

  test("first resource should be text/plain", async () => {
    const resources = server["config"].resources;
    expect(resources?.[0].mimeType).toBe("text/plain");
  });

  test("second resource should be application/json", async () => {
    const resources = server["config"].resources;
    expect(resources?.[1].mimeType).toBe("application/json");
  });

  test("json resource should have valid JSON content", async () => {
    const resources = server["config"].resources;
    expect(() => JSON.parse(resources?.[1].content)).not.toThrow();
  });

  test("all resources should have descriptions", async () => {
    const resources = server["config"].resources;
    for (const resource of resources!) {
      expect(resource.description).toBeDefined();
      expect(typeof resource.description).toBe("string");
    }
  });
});

describe("E2E - Prompt Retrieval", () => {
  let cleanup: CleanupManager;
  let server: TestMcpServer;
  let client: TestMcpClient;

  beforeEach(async () => {
    cleanup = new CleanupManager();
    server = createBasicTestServer("prompt-server");
    client = createTestClient("prompt-client");

    registerServerCleanup(cleanup, server, "prompt server");
    registerClientCleanup(cleanup, client, "prompt client");

    await server.start();
    await client.connectToServer(server.getTransport()!);
    server.connectToClient(client);
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("should have one prompt", async () => {
    const prompts = server["config"].prompts;
    expect(prompts?.length).toBe(1);
  });

  test("greet prompt should have name parameter", async () => {
    const prompts = server["config"].prompts;
    const greet = prompts?.find((p) => p.name === "greet");
    expect(greet).toBeDefined();
    const nameArg = greet?.arguments.find((a) => a.name === "name");
    expect(nameArg).toBeDefined();
    expect(nameArg?.required).toBe(true);
  });

  test("greet prompt handler should return string", async () => {
    const prompts = server["config"].prompts;
    const greet = prompts?.find((p) => p.name === "greet");
    expect(greet).toBeDefined();
    expect(typeof greet?.handler).toBe("function");
  });

  test("greet prompt description should be descriptive", async () => {
    const prompts = server["config"].prompts;
    const greet = prompts?.find((p) => p.name === "greet");
    expect(greet?.description.length).toBeGreaterThan(0);
  });
});
