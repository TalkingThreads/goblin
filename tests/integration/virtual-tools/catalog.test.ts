/**
 * Virtual Tools Tests - Catalog
 *
 * Tests for virtual catalog tools that aggregate tools from multiple servers.
 */

import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import {
  CleanupManager,
  registerClientCleanup,
  registerServerCleanup,
} from "../../shared/cleanup.js";
import { createTestClient, type TestMcpClient } from "../../shared/test-client.js";
import { createBasicTestServer, type TestMcpServer } from "../../shared/test-server.js";

describe("Virtual Tools - Catalog Basic", () => {
  let cleanup: CleanupManager;
  let server: TestMcpServer;
  let client: TestMcpClient;

  beforeEach(async () => {
    cleanup = new CleanupManager();
    server = createBasicTestServer("virtual-catalog");
    client = createTestClient("virtual-catalog-client");

    registerServerCleanup(cleanup, server, "virtual catalog server");
    registerClientCleanup(cleanup, client, "virtual catalog client");

    await server.start();
    await client.connectToServer(server.getTransport()!);
    server.connectToClient(client);
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("server has initial tools configured", async () => {
    const tools = server["config"].tools!;
    expect(tools.length).toBeGreaterThan(0);
  });

  test("server has echo tool", async () => {
    const tools = server["config"].tools!;
    const toolNames = tools.map((t) => t.name);
    expect(toolNames).toContain("echo");
  });

  test("server has add tool", async () => {
    const tools = server["config"].tools!;
    const toolNames = tools.map((t) => t.name);
    expect(toolNames).toContain("add");
  });

  test("server has get_time tool", async () => {
    const tools = server["config"].tools!;
    const toolNames = tools.map((t) => t.name);
    expect(toolNames).toContain("get_time");
  });

  test("tools have valid names", async () => {
    const tools = server["config"].tools!;
    for (const tool of tools) {
      expect(tool.name.length).toBeGreaterThan(0);
      expect(typeof tool.name).toBe("string");
    }
  });

  test("tools have valid descriptions", async () => {
    const tools = server["config"].tools!;
    for (const tool of tools) {
      expect(tool.description.length).toBeGreaterThan(0);
      expect(typeof tool.description).toBe("string");
    }
  });

  test("tools have input schemas", async () => {
    const tools = server["config"].tools!;
    for (const tool of tools) {
      expect(tool.inputSchema).toBeDefined();
      expect(typeof tool.inputSchema).toBe("object");
    }
  });
});

describe("Virtual Tools - Catalog Aggregation", () => {
  let cleanup: CleanupManager;
  let server1: TestMcpServer;
  let server2: TestMcpServer;

  beforeEach(async () => {
    cleanup = new CleanupManager();
    server1 = createBasicTestServer("agg-server-1");
    server2 = createBasicTestServer("agg-server-2");

    registerServerCleanup(cleanup, server1, "agg server 1");
    registerServerCleanup(cleanup, server2, "agg server 2");

    await server1.start();
    await server2.start();
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("both servers have same tool count", async () => {
    expect(server1["config"].tools?.length).toBe(server2["config"].tools?.length);
  });

  test("servers have echo tool", async () => {
    const tools1 = server1["config"].tools?.map((t) => t.name);
    const tools2 = server2["config"].tools?.map((t) => t.name);
    expect(tools1).toContain("echo");
    expect(tools2).toContain("echo");
  });

  test("servers have add tool", async () => {
    const tools1 = server1["config"].tools?.map((t) => t.name);
    const tools2 = server2["config"].tools?.map((t) => t.name);
    expect(tools1).toContain("add");
    expect(tools2).toContain("add");
  });

  test("can add unique tools to each server", async () => {
    server1.addTool(
      "server1_unique",
      "Unique to server1",
      { type: "object", properties: {}, required: [] },
      async () => ({ content: [{ type: "text", text: "s1" }] }),
    );

    server2.addTool(
      "server2_unique",
      "Unique to server2",
      { type: "object", properties: {}, required: [] },
      async () => ({ content: [{ type: "text", text: "s2" }] }),
    );

    const tools1 = server1["config"].tools?.map((t) => t.name);
    const tools2 = server2["config"].tools?.map((t) => t.name);

    expect(tools1).toContain("server1_unique");
    expect(tools2).toContain("server2_unique");
    expect(tools1).not.toContain("server2_unique");
    expect(tools2).not.toContain("server1_unique");
  });

  test("combined tool count reflects all additions", async () => {
    const initialCount = server1["config"].tools?.length + server2["config"].tools?.length;

    server1.addTool(
      "s1_extra",
      "S1 extra",
      { type: "object", properties: {}, required: [] },
      async () => ({ content: [{ type: "text", text: "1" }] }),
    );
    server2.addTool(
      "s2_extra",
      "S2 extra",
      { type: "object", properties: {}, required: [] },
      async () => ({ content: [{ type: "text", text: "2" }] }),
    );

    const finalCount = server1["config"].tools?.length + server2["config"].tools?.length;
    expect(finalCount).toBe(initialCount + 2);
  });
});

describe("Virtual Tools - Catalog Schema", () => {
  let cleanup: CleanupManager;
  let server: TestMcpServer;

  beforeEach(async () => {
    cleanup = new CleanupManager();
    server = createBasicTestServer("schema-server");
    registerServerCleanup(cleanup, server, "schema server");
    await server.start();
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("echo tool has correct schema", async () => {
    const echo = server["config"].tools?.find((t) => t.name === "echo");
    expect(echo?.inputSchema.type).toBe("object");
    expect(echo?.inputSchema.properties.message.type).toBe("string");
    expect(echo?.inputSchema.required).toContain("message");
  });

  test("add tool has correct schema", async () => {
    const add = server["config"].tools?.find((t) => t.name === "add");
    expect(add?.inputSchema.type).toBe("object");
    expect(add?.inputSchema.properties.a.type).toBe("number");
    expect(add?.inputSchema.properties.b.type).toBe("number");
    expect(add?.inputSchema.required).toContain("a");
    expect(add?.inputSchema.required).toContain("b");
  });

  test("get_time tool has empty schema", async () => {
    const getTime = server["config"].tools?.find((t) => t.name === "get_time");
    expect(getTime?.inputSchema.type).toBe("object");
    expect(getTime?.inputSchema.properties).toEqual({});
    expect(getTime?.inputSchema.required).toEqual([]);
  });

  test("all tools have type object", async () => {
    const tools = server["config"].tools!;
    for (const tool of tools) {
      expect(tool.inputSchema.type).toBe("object");
    }
  });
});

describe("Virtual Tools - Catalog Dynamic", () => {
  let cleanup: CleanupManager;
  let server: TestMcpServer;

  beforeEach(async () => {
    cleanup = new CleanupManager();
    server = createBasicTestServer("dynamic-catalog");
    registerServerCleanup(cleanup, server, "dynamic catalog server");
    await server.start();
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("can add tool with complex schema", async () => {
    server.addTool(
      "complex_tool",
      "Complex schema tool",
      {
        type: "object",
        properties: {
          name: { type: "string", description: "Name" },
          age: { type: "number", description: "Age" },
          active: { type: "boolean", description: "Active" },
        },
        required: ["name"],
      },
      async () => ({ content: [{ type: "text", text: "ok" }] }),
    );

    const tool = server["config"].tools?.find((t) => t.name === "complex_tool");
    expect(tool?.inputSchema.properties.name.type).toBe("string");
    expect(tool?.inputSchema.properties.age.type).toBe("number");
    expect(tool?.inputSchema.properties.active.type).toBe("boolean");
    expect(tool?.inputSchema.required).toContain("name");
  });

  test("can add multiple tools", async () => {
    for (let i = 0; i < 5; i++) {
      server.addTool(
        `multi_tool_${i}`,
        `Tool ${i}`,
        { type: "object", properties: {}, required: [] },
        async () => ({ content: [{ type: "text", text: `result_${i}` }] }),
      );
    }

    expect(server["config"].tools?.length).toBe(3 + 5);
  });

  test("all dynamic tools are accessible", async () => {
    for (let i = 0; i < 3; i++) {
      server.addTool(
        `accessible_tool_${i}`,
        `Accessible ${i}`,
        { type: "object", properties: {}, required: [] },
        async () => ({ content: [{ type: "text", text: "ok" }] }),
      );
    }

    const tools = server["config"].tools!;
    for (let i = 0; i < 3; i++) {
      expect(tools.find((t) => t.name === `accessible_tool_${i}`)).toBeDefined();
    }
  });
});

describe("Virtual Tools - Catalog Handlers", () => {
  let cleanup: CleanupManager;
  let server: TestMcpServer;

  beforeEach(async () => {
    cleanup = new CleanupManager();
    server = createBasicTestServer("handler-server");
    registerServerCleanup(cleanup, server, "handler server");
    await server.start();
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("all tools have handlers", async () => {
    const tools = server["config"].tools!;
    for (const tool of tools) {
      expect(typeof tool.handler).toBe("function");
    }
  });

  test("echo handler returns text content", async () => {
    const echo = server["config"].tools?.find((t) => t.name === "echo");
    const result = await echo?.handler({ message: "test" });
    expect(result.content[0].type).toBe("text");
    expect(result.content[0].text).toBe("Echo: test");
  });

  test("add handler returns text content", async () => {
    const add = server["config"].tools?.find((t) => t.name === "add");
    const result = await add?.handler({ a: 5, b: 3 });
    expect(result.content[0].type).toBe("text");
    expect(result.content[0].text).toBe("Result: 8");
  });

  test("get_time handler returns text content", async () => {
    const getTime = server["config"].tools?.find((t) => t.name === "get_time");
    const result = await getTime?.handler({});
    expect(result.content[0].type).toBe("text");
    expect(result.content[0].text).toContain("Current time:");
  });
});
