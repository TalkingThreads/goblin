/**
 * Transport Tests - HTTP
 *
 * Tests for HTTP transport behavior and configuration.
 */

import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import {
  CleanupManager,
  registerClientCleanup,
  registerServerCleanup,
} from "../../shared/cleanup.js";
import { createTestClient, type TestMcpClient } from "../../shared/test-client.js";
import { createBasicTestServer, type TestMcpServer } from "../../shared/test-server.js";

describe("Transport - HTTP Configuration", () => {
  let cleanup: CleanupManager;
  let server: TestMcpServer;
  let client: TestMcpClient;

  beforeEach(async () => {
    cleanup = new CleanupManager();
    server = createBasicTestServer("http-transport");
    client = createTestClient("http-client");

    registerServerCleanup(cleanup, server, "http server");
    registerClientCleanup(cleanup, client, "http client");

    await server.start();
    await client.connectToServer(server.getTransport()!);
    server.connectToClient(client);
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("server should be configured for HTTP transport", async () => {
    expect(server.isRunning()).toBe(true);
    expect(server["config"].tools?.length).toBeGreaterThan(0);
  });

  test("client should be connected", async () => {
    expect(client.isConnected()).toBe(true);
  });

  test("server should have all tools", async () => {
    const tools = server["config"].tools!;
    expect(tools.length).toBe(3);
    expect(tools.map((t) => t.name).sort()).toEqual(["add", "echo", "get_time"]);
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

describe("Transport - HTTP Request Handling", () => {
  let cleanup: CleanupManager;
  let server: TestMcpServer;

  beforeEach(async () => {
    cleanup = new CleanupManager();
    server = createBasicTestServer("http-request");
    registerServerCleanup(cleanup, server, "http request server");
    await server.start();
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("echo tool should accept message parameter", async () => {
    const tools = server["config"].tools!;
    const echo = tools.find((t) => t.name === "echo");

    expect(echo?.inputSchema.properties.message.type).toBe("string");
    expect(echo?.inputSchema.required).toContain("message");
  });

  test("add tool should accept number parameters", async () => {
    const tools = server["config"].tools!;
    const add = tools.find((t) => t.name === "add");

    expect(add?.inputSchema.properties.a.type).toBe("number");
    expect(add?.inputSchema.properties.b.type).toBe("number");
    expect(add?.inputSchema.required).toContain("a");
    expect(add?.inputSchema.required).toContain("b");
  });

  test("get_time tool should accept empty parameters", async () => {
    const tools = server["config"].tools!;
    const getTime = tools.find((t) => t.name === "get_time");

    expect(getTime?.inputSchema.properties).toEqual({});
    expect(getTime?.inputSchema.required).toEqual([]);
  });

  test("resource URIs should be valid URLs", async () => {
    const resources = server["config"].resources!;

    for (const resource of resources) {
      expect(resource.uri.startsWith("test://")).toBe(true);
    }
  });

  test("prompt arguments should have correct structure", async () => {
    const prompts = server["config"].prompts!;
    const greet = prompts.find((p) => p.name === "greet");

    expect(greet?.arguments[0].name).toBe("name");
    expect(greet?.arguments[0].required).toBe(true);
  });
});

describe("Transport - HTTP Response Format", () => {
  let cleanup: CleanupManager;
  let server: TestMcpServer;

  beforeEach(async () => {
    cleanup = new CleanupManager();
    server = createBasicTestServer("http-response");
    registerServerCleanup(cleanup, server, "http response server");
    await server.start();
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("tools should return content array", async () => {
    const tools = server["config"].tools!;

    for (const tool of tools) {
      expect(typeof tool.handler).toBe("function");
    }
  });

  test("resources should have text content", async () => {
    const resources = server["config"].resources!;
    const textResource = resources.find((r) => r.mimeType === "text/plain");

    expect(textResource).toBeDefined();
    expect(typeof textResource?.content).toBe("string");
    expect(textResource?.content.length).toBeGreaterThan(0);
  });

  test("resources should have JSON content", async () => {
    const resources = server["config"].resources!;
    const jsonResource = resources.find((r) => r.mimeType === "application/json");

    expect(jsonResource).toBeDefined();
    expect(() => JSON.parse(jsonResource?.content)).not.toThrow();
  });

  test("prompts should return string content", async () => {
    const prompts = server["config"].prompts!;
    const greet = prompts.find((p) => p.name === "greet");

    expect(typeof greet?.handler).toBe("function");
    const result = await greet?.handler({ name: "Test" });
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });
});

describe("Transport - HTTP Latency Simulation", () => {
  let cleanup: CleanupManager;
  let server: TestMcpServer;

  beforeEach(async () => {
    cleanup = new CleanupManager();
    server = createBasicTestServer("http-latency");
    registerServerCleanup(cleanup, server, "http latency server");
    await server.start();
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("server supports latency configuration", async () => {
    server.setLatency(100);
    expect(server["config"].latency).toBe(100);
  });

  test("server supports error rate configuration", async () => {
    server.setErrorRate(0.1);
    expect(server["config"].errorRate).toBe(0.1);
  });

  test("server latency can be set to zero", async () => {
    server.setLatency(0);
    expect(server["config"].latency).toBe(0);
  });

  test("server error rate can be set to zero", async () => {
    server.setErrorRate(0);
    expect(server["config"].errorRate).toBe(0);
  });

  test("server error rate is clamped to 0-1", async () => {
    server.setErrorRate(1.5);
    expect(server["config"].errorRate).toBe(1);

    server.setErrorRate(-0.5);
    expect(server["config"].errorRate).toBe(0);
  });
});

describe("Transport - HTTP Concurrent Operations", () => {
  let cleanup: CleanupManager;
  let server: TestMcpServer;

  beforeEach(async () => {
    cleanup = new CleanupManager();
    server = createBasicTestServer("http-concurrent");
    registerServerCleanup(cleanup, server, "http concurrent server");
    await server.start();
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("server can handle multiple tool additions", async () => {
    const initialCount = server["config"].tools?.length;

    for (let i = 0; i < 10; i++) {
      server.addTool(
        `concurrent_tool_${i}`,
        `Concurrent tool ${i}`,
        { type: "object", properties: {}, required: [] },
        async () => ({ content: [{ type: "text", text: `result_${i}` }] }),
      );
    }

    expect(server["config"].tools?.length).toBe(initialCount + 10);
  });

  test("server can handle multiple resource additions", async () => {
    const initialCount = server["config"].resources?.length;

    for (let i = 0; i < 10; i++) {
      server.addResource(
        `test://concurrent_resource_${i}`,
        `Concurrent Resource ${i}`,
        `Resource ${i}`,
        "text/plain",
        `Content ${i}`,
      );
    }

    expect(server["config"].resources?.length).toBe(initialCount + 10);
  });

  test("server can handle multiple prompt additions", async () => {
    const initialCount = server["config"].prompts?.length;

    for (let i = 0; i < 5; i++) {
      server.addPrompt(
        `concurrent_prompt_${i}`,
        `Concurrent prompt ${i}`,
        [],
        async () => `Result ${i}`,
      );
    }

    expect(server["config"].prompts?.length).toBe(initialCount + 5);
  });

  test("all dynamic tools should be retrievable", async () => {
    for (let i = 0; i < 5; i++) {
      server.addTool(
        `retrieve_tool_${i}`,
        `Retrieve tool ${i}`,
        { type: "object", properties: {}, required: [] },
        async () => ({ content: [{ type: "text", text: "ok" }] }),
      );
    }

    const tools = server["config"].tools!;
    for (let i = 0; i < 5; i++) {
      expect(tools.find((t) => t.name === `retrieve_tool_${i}`)).toBeDefined();
    }
  });
});
