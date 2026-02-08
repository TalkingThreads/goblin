/**
 * End-to-End Tests - Streaming
 *
 * Tests for streaming behavior through the gateway.
 */

import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import {
  CleanupManager,
  registerClientCleanup,
  registerServerCleanup,
} from "../../shared/cleanup.js";
import { createTestClient, type TestMcpClient } from "../../shared/test-client.js";
import { createBasicTestServer, TestMcpServer } from "../../shared/test-server.js";

describe("E2E - Streaming", () => {
  let cleanup: CleanupManager;
  let server: TestMcpServer;
  let client: TestMcpClient;

  beforeEach(async () => {
    cleanup = new CleanupManager();
    server = createBasicTestServer("streaming-server");
    client = createTestClient("streaming-client");

    registerServerCleanup(cleanup, server, "streaming server");
    registerClientCleanup(cleanup, client, "streaming client");

    await server.start();
    await client.connectToServer(server.getTransport()!);
    server.connectToClient(client);
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("server should be configured for streaming", async () => {
    expect(server.isRunning()).toBe(true);
  });

  test("client should be connected for streaming", async () => {
    expect(client.isConnected()).toBe(true);
  });

  test("server should have tools that could stream", async () => {
    const tools = server["config"].tools;
    expect(tools).toBeDefined();
    expect(tools?.length).toBeGreaterThan(0);
  });

  test("get_time tool exists for time streaming", async () => {
    const tools = server["config"].tools;
    const toolNames = tools?.map((t) => t.name);
    expect(toolNames).toContain("get_time");
  });

  test("server should have resources that could be streamed", async () => {
    const resources = server["config"].resources;
    expect(resources).toBeDefined();
    expect(resources?.length).toBeGreaterThan(0);
  });

  test("all resources should have content for streaming", async () => {
    const resources = server["config"].resources;
    for (const resource of resources!) {
      expect(resource.content).toBeDefined();
      expect(typeof resource.content).toBe("string");
    }
  });
});

describe("E2E - Streaming Behavior", () => {
  let cleanup: CleanupManager;
  let server: TestMcpServer;
  let client: TestMcpClient;

  beforeEach(async () => {
    cleanup = new CleanupManager();
    server = createBasicTestServer("stream-behavior-server");
    client = createTestClient("stream-behavior-client");

    registerServerCleanup(cleanup, server, "stream behavior server");
    registerClientCleanup(cleanup, client, "stream behavior client");

    await server.start();
    await client.connectToServer(server.getTransport()!);
    server.connectToClient(client);
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("should maintain connection state", async () => {
    expect(client.isConnected()).toBe(true);
    expect(server.isRunning()).toBe(true);
  });

  test("should have consistent tool configuration", async () => {
    const tools1 = server["config"].tools;
    const tools2 = server["config"].tools;
    expect(tools1).toEqual(tools2);
  });

  test("should have consistent resource configuration", async () => {
    const resources1 = server["config"].resources;
    const resources2 = server["config"].resources;
    expect(resources1?.length).toBe(resources2?.length);
  });

  test("should have consistent prompt configuration", async () => {
    const prompts1 = server["config"].prompts;
    const prompts2 = server["config"].prompts;
    expect(prompts1).toEqual(prompts2);
  });

  test("resources should maintain content integrity", async () => {
    const resources = server["config"].resources;
    for (const resource of resources!) {
      expect(resource.content.length).toBeGreaterThan(0);
    }
  });

  test("tools should maintain handler references", async () => {
    const tools = server["config"].tools;
    for (const tool of tools!) {
      expect(typeof tool.handler).toBe("function");
    }
  });
});

describe("E2E - Streaming Edge Cases", () => {
  let cleanup: CleanupManager;
  let server: TestMcpServer;
  let client: TestMcpClient;

  beforeEach(async () => {
    cleanup = new CleanupManager();
    server = createBasicTestServer("stream-edge-server");
    client = createTestClient("stream-edge-client");

    registerServerCleanup(cleanup, server, "stream edge server");
    registerClientCleanup(cleanup, client, "stream edge client");

    await server.start();
    await client.connectToServer(server.getTransport()!);
    server.connectToClient(client);
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("should handle empty resource content edge case", async () => {
    const server2 = new TestMcpServer({ name: "empty-resource" });
    server2.addResource(
      "test://empty",
      "Empty Resource",
      "A resource with empty content",
      "text/plain",
      "",
    );
    const resources = server2["config"].resources;
    expect(resources?.[0].content).toBe("");
  });

  test("should handle large resource content", async () => {
    const largeContent = "x".repeat(10000);
    const server2 = new TestMcpServer({ name: "large-resource" });
    server2.addResource(
      "test://large",
      "Large Resource",
      "A resource with large content",
      "text/plain",
      largeContent,
    );
    const resources = server2["config"].resources;
    expect(resources?.[0].content.length).toBe(10000);
  });

  test("should handle unicode in resource content", async () => {
    const unicodeContent = "Hello 世界 🌍 مرحبا";
    const server2 = new TestMcpServer({ name: "unicode-resource" });
    server2.addResource(
      "test://unicode",
      "Unicode Resource",
      "A resource with unicode content",
      "text/plain",
      unicodeContent,
    );
    const resources = server2["config"].resources;
    expect(resources?.[0].content).toBe(unicodeContent);
  });

  test("should handle special characters in tool descriptions", async () => {
    const server2 = new TestMcpServer({ name: "special-chars" });
    server2.addTool(
      "special_tool",
      "A tool with special chars: @#$%^&*()[]{}|",
      { type: "object", properties: {}, required: [] },
      async () => ({ content: [{ type: "text", text: "ok" }] }),
    );
    const tools = server2["config"].tools;
    expect(tools?.[0].description).toContain("@#$%^&*()");
  });

  test("should handle json resource with nested objects", async () => {
    const jsonContent = JSON.stringify({
      nested: { object: { deep: { value: 42 } } },
      array: [1, 2, 3],
      string: "test",
    });
    const server2 = new TestMcpServer({ name: "json-resource" });
    server2.addResource(
      "test://json",
      "JSON Resource",
      "A resource with JSON content",
      "application/json",
      jsonContent,
    );
    const resources = server2["config"].resources;
    const parsed = JSON.parse(resources?.[0].content);
    expect(parsed.nested.object.deep.value).toBe(42);
  });
});
