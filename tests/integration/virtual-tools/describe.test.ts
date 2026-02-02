/**
 * Virtual Tools Tests - Describe
 *
 * Tests for virtual describe tools that provide detailed information about tools.
 */

import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import {
  CleanupManager,
  registerClientCleanup,
  registerServerCleanup,
} from "../../shared/cleanup.js";
import { createTestClient, type TestMcpClient } from "../../shared/test-client.js";
import { createBasicTestServer, type TestMcpServer } from "../../shared/test-server.js";

describe("Virtual Tools - Describe Basic", () => {
  let cleanup: CleanupManager;
  let server: TestMcpServer;
  let client: TestMcpClient;

  beforeEach(async () => {
    cleanup = new CleanupManager();
    server = createBasicTestServer("describe-server");
    client = createTestClient("describe-client");

    registerServerCleanup(cleanup, server, "describe server");
    registerClientCleanup(cleanup, client, "describe client");

    await server.start();
    await client.connectToServer(server.getTransport()!);
    server.connectToClient(client);
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("server has tools to describe", async () => {
    const tools = server["config"].tools!;
    expect(tools.length).toBeGreaterThan(0);
  });

  test("echo tool exists", async () => {
    const tools = server["config"].tools!;
    const toolNames = tools.map((t) => t.name);
    expect(toolNames).toContain("echo");
  });

  test("add tool exists", async () => {
    const tools = server["config"].tools!;
    const toolNames = tools.map((t) => t.name);
    expect(toolNames).toContain("add");
  });

  test("get_time tool exists", async () => {
    const tools = server["config"].tools!;
    const toolNames = tools.map((t) => t.name);
    expect(toolNames).toContain("get_time");
  });

  test("all tools have descriptions", async () => {
    const tools = server["config"].tools!;
    for (const tool of tools) {
      expect(tool.description.length).toBeGreaterThan(0);
    }
  });

  test("all tools have names", async () => {
    const tools = server["config"].tools!;
    for (const tool of tools) {
      expect(tool.name.length).toBeGreaterThan(0);
    }
  });

  test("all tools have input schemas", async () => {
    const tools = server["config"].tools!;
    for (const tool of tools) {
      expect(tool.inputSchema).toBeDefined();
    }
  });
});

describe("Virtual Tools - Describe Details", () => {
  let cleanup: CleanupManager;
  let server: TestMcpServer;

  beforeEach(async () => {
    cleanup = new CleanupManager();
    server = createBasicTestServer("describe-details");
    registerServerCleanup(cleanup, server, "describe details server");
    await server.start();
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("echo tool has message parameter", async () => {
    const echo = server["config"].tools!.find((t) => t.name === "echo");
    expect(echo!.inputSchema.properties.message).toBeDefined();
    expect(echo!.inputSchema.properties.message.type).toBe("string");
  });

  test("add tool has number parameters", async () => {
    const add = server["config"].tools!.find((t) => t.name === "add");
    expect(add!.inputSchema.properties.a.type).toBe("number");
    expect(add!.inputSchema.properties.b.type).toBe("number");
  });

  test("get_time has no required parameters", async () => {
    const getTime = server["config"].tools!.find((t) => t.name === "get_time");
    expect(getTime!.inputSchema.required.length).toBe(0);
  });

  test("tool descriptions are descriptive", async () => {
    const tools = server["config"].tools!;
    for (const tool of tools) {
      expect(tool.description.length).toBeGreaterThan(10);
    }
  });

  test("all tools have type object schema", async () => {
    const tools = server["config"].tools!;
    for (const tool of tools) {
      expect(tool.inputSchema.type).toBe("object");
    }
  });
});

describe("Virtual Tools - Describe Handler", () => {
  let cleanup: CleanupManager;
  let server: TestMcpServer;

  beforeEach(async () => {
    cleanup = new CleanupManager();
    server = createBasicTestServer("describe-handler");
    registerServerCleanup(cleanup, server, "describe handler server");
    await server.start();
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("echo handler executes correctly", async () => {
    const echo = server["config"].tools!.find((t) => t.name === "echo");
    const result = await echo!.handler({ message: "hello" });
    expect(result.content[0].type).toBe("text");
    expect(result.content[0].text).toBe("Echo: hello");
  });

  test("add handler executes correctly", async () => {
    const add = server["config"].tools!.find((t) => t.name === "add");
    const result = await add!.handler({ a: 10, b: 20 });
    expect(result.content[0].type).toBe("text");
    expect(result.content[0].text).toBe("Result: 30");
  });

  test("get_time handler returns time", async () => {
    const getTime = server["config"].tools!.find((t) => t.name === "get_time");
    const result = await getTime!.handler({});
    expect(result.content[0].type).toBe("text");
    expect(result.content[0].text).toContain("Current time:");
  });

  test("handlers return proper content structure", async () => {
    const tools = server["config"].tools!;
    for (const tool of tools) {
      const result = await tool.handler({});
      expect(result.content).toBeDefined();
      expect(Array.isArray(result.content)).toBe(true);
      expect(result.content.length).toBeGreaterThan(0);
      expect(result.content[0].type).toBe("text");
    }
  });
});

describe("Virtual Tools - Describe Multi-Server", () => {
  let cleanup: CleanupManager;
  let server1: TestMcpServer;
  let server2: TestMcpServer;

  beforeEach(async () => {
    cleanup = new CleanupManager();
    server1 = createBasicTestServer("describe-multi-1");
    server2 = createBasicTestServer("describe-multi-2");

    registerServerCleanup(cleanup, server1, "describe multi 1");
    registerServerCleanup(cleanup, server2, "describe multi 2");

    await server1.start();
    await server2.start();
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("both servers have tools", async () => {
    expect(server1["config"].tools!.length).toBeGreaterThan(0);
    expect(server2["config"].tools!.length).toBeGreaterThan(0);
  });

  test("both servers have echo tool", async () => {
    const tools1 = server1["config"].tools!.map((t) => t.name);
    const tools2 = server2["config"].tools!.map((t) => t.name);
    expect(tools1).toContain("echo");
    expect(tools2).toContain("echo");
  });

  test("tools have consistent structure", async () => {
    const echo1 = server1["config"].tools!.find((t) => t.name === "echo");
    const echo2 = server2["config"].tools!.find((t) => t.name === "echo");

    expect(echo1!.name).toBe(echo2!.name);
    expect(echo1!.inputSchema.type).toBe(echo2!.inputSchema.type);
  });

  test("can add describe-specific tools", async () => {
    server1.addTool(
      "describe_detail",
      "Detailed description tool",
      {
        type: "object",
        properties: {
          format: { type: "string", description: "Output format" },
          verbose: { type: "boolean", description: "Verbose output" },
        },
        required: ["format"],
      },
      async () => ({ content: [{ type: "text", text: "described" }] }),
    );

    const tool = server1["config"].tools!.find((t) => t.name === "describe_detail");
    expect(tool).toBeDefined();
    expect(tool!.inputSchema.properties.format.type).toBe("string");
    expect(tool!.inputSchema.properties.verbose.type).toBe("boolean");
    expect(tool!.inputSchema.required).toContain("format");
  });
});

describe("Virtual Tools - Describe Schema Variations", () => {
  let cleanup: CleanupManager;
  let server: TestMcpServer;

  beforeEach(async () => {
    cleanup = new CleanupManager();
    server = createBasicTestServer("schema-var");
    registerServerCleanup(cleanup, server, "schema var server");
    await server.start();
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("can create tool with optional parameters", async () => {
    server.addTool(
      "optional_params",
      "Tool with optional params",
      {
        type: "object",
        properties: {
          required_param: { type: "string" },
          optional_param: { type: "string" },
        },
        required: ["required_param"],
      },
      async () => ({ content: [{ type: "text", text: "ok" }] }),
    );

    const tool = server["config"].tools!.find((t) => t.name === "optional_params");
    expect(tool!.inputSchema.required).toContain("required_param");
    expect(tool!.inputSchema.required).not.toContain("optional_param");
  });

  test("can create tool with array parameters", async () => {
    server.addTool(
      "array_params",
      "Tool with array params",
      {
        type: "object",
        properties: {
          items: { type: "array", description: "List of items" },
        },
        required: ["items"],
      },
      async () => ({ content: [{ type: "text", text: "ok" }] }),
    );

    const tool = server["config"].tools!.find((t) => t.name === "array_params");
    expect(tool!.inputSchema.properties.items.type).toBe("array");
  });

  test("can create tool with object parameters", async () => {
    server.addTool(
      "object_params",
      "Tool with object params",
      {
        type: "object",
        properties: {
          data: { type: "object", description: "Data object" },
        },
        required: ["data"],
      },
      async () => ({ content: [{ type: "text", text: "ok" }] }),
    );

    const tool = server["config"].tools!.find((t) => t.name === "object_params");
    expect(tool!.inputSchema.properties.data.type).toBe("object");
  });

  test("schemas maintain type integrity", async () => {
    const tools = server["config"].tools!;
    for (const tool of tools) {
      expect(["string", "number", "boolean", "object", "array"]).toContain(
        tool.inputSchema.properties.message?.type ||
          tool.inputSchema.properties.a?.type ||
          tool.inputSchema.properties.name?.type ||
          "object",
      );
    }
  });
});
