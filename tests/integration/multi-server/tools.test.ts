/**
 * Multi-Server Tests - Tool Routing
 *
 * Tests for routing tools across multiple servers.
 */

import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import {
  CleanupManager,
  registerClientCleanup,
  registerServerCleanup,
} from "../../shared/cleanup.js";
import { createTestClient, type TestMcpClient } from "../../shared/test-client.js";
import { createBasicTestServer, type TestMcpServer } from "../../shared/test-server.js";

describe("Multi-Server - Tool Routing", () => {
  let cleanup: CleanupManager;
  let server1: TestMcpServer;
  let server2: TestMcpServer;
  let client: TestMcpClient;

  beforeEach(() => {
    cleanup = new CleanupManager();
    server1 = createBasicTestServer("routing-1");
    server2 = createBasicTestServer("routing-2");
    client = createTestClient("routing-client");

    registerServerCleanup(cleanup, server1, "routing server 1");
    registerServerCleanup(cleanup, server2, "routing server 2");
    registerClientCleanup(cleanup, client, "routing client");
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("both servers have echo tool", async () => {
    await server1.start();
    await server2.start();

    const tools1 = server1["config"].tools!.map((t) => t.name);
    const tools2 = server2["config"].tools!.map((t) => t.name);

    expect(tools1).toContain("echo");
    expect(tools2).toContain("echo");
  });

  test("both servers have add tool", async () => {
    await server1.start();
    await server2.start();

    const tools1 = server1["config"].tools!.map((t) => t.name);
    const tools2 = server2["config"].tools!.map((t) => t.name);

    expect(tools1).toContain("add");
    expect(tools2).toContain("add");
  });

  test("both servers have get_time tool", async () => {
    await server1.start();
    await server2.start();

    const tools1 = server1["config"].tools!.map((t) => t.name);
    const tools2 = server2["config"].tools!.map((t) => t.name);

    expect(tools1).toContain("get_time");
    expect(tools2).toContain("get_time");
  });

  test("can add unique tools to each server", async () => {
    await server1.start();
    await server2.start();

    server1.addTool(
      "unique_tool_1",
      "Only on server1",
      { type: "object", properties: {}, required: [] },
      async () => ({ content: [{ type: "text", text: "from server1" }] }),
    );

    server2.addTool(
      "unique_tool_2",
      "Only on server2",
      { type: "object", properties: {}, required: [] },
      async () => ({ content: [{ type: "text", text: "from server2" }] }),
    );

    const tools1 = server1["config"].tools!.map((t) => t.name);
    const tools2 = server2["config"].tools!.map((t) => t.name);

    expect(tools1).toContain("unique_tool_1");
    expect(tools2).toContain("unique_tool_2");
    expect(tools1).not.toContain("unique_tool_2");
    expect(tools2).not.toContain("unique_tool_1");
  });

  test("tool input schemas match between servers", async () => {
    await server1.start();
    await server2.start();

    const echo1 = server1["config"].tools!.find((t) => t.name === "echo");
    const echo2 = server2["config"].tools!.find((t) => t.name === "echo");

    expect(echo1!.inputSchema).toEqual(echo2!.inputSchema);
  });
});

describe("Multi-Server - Tool Schema Validation", () => {
  let cleanup: CleanupManager;
  let server1: TestMcpServer;
  let server2: TestMcpServer;

  beforeEach(() => {
    cleanup = new CleanupManager();
    server1 = createBasicTestServer("schema-1");
    server2 = createBasicTestServer("schema-2");

    registerServerCleanup(cleanup, server1, "schema server 1");
    registerServerCleanup(cleanup, server2, "schema server 2");
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("echo tool should have message parameter", async () => {
    await server1.start();
    await server2.start();

    const echo1 = server1["config"].tools!.find((t) => t.name === "echo");
    const echo2 = server2["config"].tools!.find((t) => t.name === "echo");

    expect(echo1!.inputSchema.properties.message).toBeDefined();
    expect(echo2!.inputSchema.properties.message).toBeDefined();
  });

  test("add tool should have a and b parameters", async () => {
    await server1.start();
    await server2.start();

    const add1 = server1["config"].tools!.find((t) => t.name === "add");
    const add2 = server2["config"].tools!.find((t) => t.name === "add");

    expect(add1!.inputSchema.properties.a).toBeDefined();
    expect(add1!.inputSchema.properties.b).toBeDefined();
    expect(add2!.inputSchema.properties.a).toBeDefined();
    expect(add2!.inputSchema.properties.b).toBeDefined();
  });

  test("get_time tool should have no required parameters", async () => {
    await server1.start();
    await server2.start();

    const getTime1 = server1["config"].tools!.find((t) => t.name === "get_time");
    const getTime2 = server2["config"].tools!.find((t) => t.name === "get_time");

    expect(getTime1!.inputSchema.required.length).toBe(0);
    expect(getTime2!.inputSchema.required.length).toBe(0);
  });
});

describe("Multi-Server - Dynamic Tool Addition", () => {
  let cleanup: CleanupManager;
  let server1: TestMcpServer;
  let server2: TestMcpServer;

  beforeEach(() => {
    cleanup = new CleanupManager();
    server1 = createBasicTestServer("dynamic-1");
    server2 = createBasicTestServer("dynamic-2");

    registerServerCleanup(cleanup, server1, "dynamic server 1");
    registerServerCleanup(cleanup, server2, "dynamic server 2");
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("can add tool to server1 only", async () => {
    await server1.start();
    await server2.start();

    server1.addTool(
      "server1_dynamic",
      "Dynamic tool on server1",
      { type: "object", properties: {}, required: [] },
      async () => ({ content: [{ type: "text", text: "dynamic1" }] }),
    );

    const tools1 = server1["config"].tools!.map((t) => t.name);
    const tools2 = server2["config"].tools!.map((t) => t.name);

    expect(tools1).toContain("server1_dynamic");
    expect(tools2).not.toContain("server1_dynamic");
  });

  test("can add tool to server2 only", async () => {
    await server1.start();
    await server2.start();

    server2.addTool(
      "server2_dynamic",
      "Dynamic tool on server2",
      { type: "object", properties: {}, required: [] },
      async () => ({ content: [{ type: "text", text: "dynamic2" }] }),
    );

    const tools1 = server1["config"].tools!.map((t) => t.name);
    const tools2 = server2["config"].tools!.map((t) => t.name);

    expect(tools2).toContain("server2_dynamic");
    expect(tools1).not.toContain("server2_dynamic");
  });

  test("can add different tools to different servers", async () => {
    await server1.start();
    await server2.start();

    server1.addTool(
      "tool_a",
      "Tool A on server1",
      { type: "object", properties: {}, required: [] },
      async () => ({ content: [{ type: "text", text: "a" }] }),
    );

    server2.addTool(
      "tool_b",
      "Tool B on server2",
      { type: "object", properties: {}, required: [] },
      async () => ({ content: [{ type: "text", text: "b" }] }),
    );

    const tools1 = server1["config"].tools!.map((t) => t.name);
    const tools2 = server2["config"].tools!.map((t) => t.name);

    expect(tools1).toContain("tool_a");
    expect(tools2).toContain("tool_b");
    expect(tools1).not.toContain("tool_b");
    expect(tools2).not.toContain("tool_a");
  });
});

describe("Multi-Server - Tool Configuration", () => {
  let cleanup: CleanupManager;
  let server1: TestMcpServer;
  let server2: TestMcpServer;

  beforeEach(() => {
    cleanup = new CleanupManager();
    server1 = createBasicTestServer("config-1");
    server2 = createBasicTestServer("config-2");

    registerServerCleanup(cleanup, server1, "config server 1");
    registerServerCleanup(cleanup, server2, "config server 2");
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("tools should have descriptions", async () => {
    await server1.start();
    await server2.start();

    const tools1 = server1["config"].tools!;
    const tools2 = server2["config"].tools!;

    for (const tool of tools1) {
      expect(tool.description.length).toBeGreaterThan(0);
    }
    for (const tool of tools2) {
      expect(tool.description.length).toBeGreaterThan(0);
    }
  });

  test("tools should have valid inputSchema type", async () => {
    await server1.start();
    await server2.start();

    const tools1 = server1["config"].tools!;
    const tools2 = server2["config"].tools!;

    for (const tool of tools1) {
      expect(tool.inputSchema.type).toBe("object");
    }
    for (const tool of tools2) {
      expect(tool.inputSchema.type).toBe("object");
    }
  });
});
