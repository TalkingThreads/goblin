/**
 * Hot-Reload Tests - Configuration
 *
 * Tests for configuration hot-reload behavior.
 */

import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import {
  CleanupManager,
  registerClientCleanup,
  registerServerCleanup,
} from "../../shared/cleanup.js";
import { createTestClient, type TestMcpClient } from "../../shared/test-client.js";
import { createBasicTestServer, type TestMcpServer } from "../../shared/test-server.js";

describe("Hot-Reload - Configuration Updates", () => {
  let cleanup: CleanupManager;
  let server: TestMcpServer;
  let client: TestMcpClient;

  beforeEach(async () => {
    cleanup = new CleanupManager();
    server = createBasicTestServer("config-update");
    client = createTestClient("config-update-client");

    registerServerCleanup(cleanup, server, "config update server");
    registerClientCleanup(cleanup, client, "config update client");

    await server.start();
    await client.connectToServer(server.getTransport()!);
    server.connectToClient(client);
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("initial config is valid", async () => {
    expect(server["config"].tools!.length).toBe(3);
    expect(server["config"].resources!.length).toBe(2);
    expect(server["config"].prompts!.length).toBe(1);
  });

  test("config tools have valid structure", async () => {
    const tools = server["config"].tools!;

    for (const tool of tools) {
      expect(tool.name.length).toBeGreaterThan(0);
      expect(tool.description.length).toBeGreaterThan(0);
      expect(tool.inputSchema).toBeDefined();
    }
  });

  test("config resources have valid structure", async () => {
    const resources = server["config"].resources!;

    for (const resource of resources) {
      expect(resource.uri.length).toBeGreaterThan(0);
      expect(resource.name.length).toBeGreaterThan(0);
      expect(resource.mimeType.length).toBeGreaterThan(0);
      expect(resource.content.length).toBeGreaterThan(0);
    }
  });

  test("config prompts have valid structure", async () => {
    const prompts = server["config"].prompts!;

    for (const prompt of prompts) {
      expect(prompt.name.length).toBeGreaterThan(0);
      expect(prompt.description.length).toBeGreaterThan(0);
      expect(Array.isArray(prompt.arguments)).toBe(true);
      expect(typeof prompt.handler).toBe("function");
    }
  });

  test("updated config maintains valid structure", async () => {
    server.addTool(
      "update_test",
      "Update test tool",
      { type: "object", properties: { test: { type: "string" } }, required: ["test"] },
      async () => ({ content: [{ type: "text", text: "updated" }] }),
    );

    const tool = server["config"].tools!.find((t) => t.name === "update_test");
    expect(tool!.name).toBe("update_test");
    expect(tool!.inputSchema.properties.test).toBeDefined();
  });
});

describe("Hot-Reload - Latency Configuration", () => {
  let cleanup: CleanupManager;
  let server: TestMcpServer;

  beforeEach(async () => {
    cleanup = new CleanupManager();
    server = createBasicTestServer("latency-config");
    registerServerCleanup(cleanup, server, "latency config server");
    await server.start();
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("initial latency is zero", async () => {
    expect(server["config"].latency).toBe(0);
  });

  test("can update latency", async () => {
    server.setLatency(100);
    expect(server["config"].latency).toBe(100);
  });

  test("can update latency multiple times", async () => {
    server.setLatency(50);
    expect(server["config"].latency).toBe(50);

    server.setLatency(200);
    expect(server["config"].latency).toBe(200);

    server.setLatency(0);
    expect(server["config"].latency).toBe(0);
  });

  test("can update error rate", async () => {
    server.setErrorRate(0.1);
    expect(server["config"].errorRate).toBe(0.1);
  });

  test("error rate is clamped", async () => {
    server.setErrorRate(1.5);
    expect(server["config"].errorRate).toBe(1);

    server.setErrorRate(-0.1);
    expect(server["config"].errorRate).toBe(0);
  });

  test("latency and error rate can coexist", async () => {
    server.setLatency(100);
    server.setErrorRate(0.05);

    expect(server["config"].latency).toBe(100);
    expect(server["config"].errorRate).toBe(0.05);
  });
});

describe("Hot-Reload - Schema Validation", () => {
  let cleanup: CleanupManager;
  let server: TestMcpServer;

  beforeEach(async () => {
    cleanup = new CleanupManager();
    server = createBasicTestServer("schema-validation");
    registerServerCleanup(cleanup, server, "schema validation server");
    await server.start();
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("echo tool has valid input schema", async () => {
    const echo = server["config"].tools!.find((t) => t.name === "echo");
    expect(echo!.inputSchema.type).toBe("object");
    expect(echo!.inputSchema.properties.message.type).toBe("string");
    expect(echo!.inputSchema.required).toContain("message");
  });

  test("add tool has valid input schema", async () => {
    const add = server["config"].tools!.find((t) => t.name === "add");
    expect(add!.inputSchema.type).toBe("object");
    expect(add!.inputSchema.properties.a.type).toBe("number");
    expect(add!.inputSchema.properties.b.type).toBe("number");
    expect(add!.inputSchema.required).toContain("a");
    expect(add!.inputSchema.required).toContain("b");
  });

  test("get_time tool has valid input schema", async () => {
    const getTime = server["config"].tools!.find((t) => t.name === "get_time");
    expect(getTime!.inputSchema.type).toBe("object");
    expect(getTime!.inputSchema.properties).toEqual({});
    expect(getTime!.inputSchema.required).toEqual([]);
  });

  test("greet prompt has valid arguments", async () => {
    const greet = server["config"].prompts!.find((p) => p.name === "greet");
    expect(greet!.arguments.length).toBe(1);
    expect(greet!.arguments[0].name).toBe("name");
    expect(greet!.arguments[0].required).toBe(true);
  });

  test("dynamic tool maintains schema validation", async () => {
    server.addTool(
      "validated_tool",
      "Validated tool",
      {
        type: "object",
        properties: {
          param1: { type: "string" },
          param2: { type: "number" },
        },
        required: ["param1"],
      },
      async () => ({ content: [{ type: "text", text: "ok" }] }),
    );

    const tool = server["config"].tools!.find((t) => t.name === "validated_tool");
    expect(tool!.inputSchema.properties.param1.type).toBe("string");
    expect(tool!.inputSchema.properties.param2.type).toBe("number");
    expect(tool!.inputSchema.required).toContain("param1");
  });
});

describe("Hot-Reload - Mixed Updates", () => {
  let cleanup: CleanupManager;
  let server: TestMcpServer;

  beforeEach(async () => {
    cleanup = new CleanupManager();
    server = createBasicTestServer("mixed-updates");
    registerServerCleanup(cleanup, server, "mixed updates server");
    await server.start();
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("can mix tool and resource additions", async () => {
    const initialTools = server["config"].tools!.length;
    const initialResources = server["config"].resources!.length;

    server.addTool(
      "mixed_tool",
      "Mixed",
      { type: "object", properties: {}, required: [] },
      async () => ({ content: [{ type: "text", text: "ok" }] }),
    );
    server.addResource("test://mixed_resource", "Mixed", "Mixed", "text/plain", "content");

    expect(server["config"].tools!.length).toBe(initialTools + 1);
    expect(server["config"].resources!.length).toBe(initialResources + 1);
  });

  test("can mix all capability additions", async () => {
    const initialTools = server["config"].tools!.length;
    const initialResources = server["config"].resources!.length;
    const initialPrompts = server["config"].prompts!.length;

    server.addTool(
      "mix_tool",
      "Mix",
      { type: "object", properties: {}, required: [] },
      async () => ({ content: [{ type: "text", text: "ok" }] }),
    );
    server.addResource("test://mix_resource", "Mix", "Mix", "text/plain", "content");
    server.addPrompt("mix_prompt", "Mix", [], async () => "mix");

    expect(server["config"].tools!.length).toBe(initialTools + 1);
    expect(server["config"].resources!.length).toBe(initialResources + 1);
    expect(server["config"].prompts!.length).toBe(initialPrompts + 1);
  });

  test("all additions maintain independence", async () => {
    server.addTool(
      "ind_tool",
      "Ind Tool",
      { type: "object", properties: {}, required: [] },
      async () => ({ content: [{ type: "text", text: "tool" }] }),
    );
    server.addResource("test://ind_resource", "Ind Resource", "Ind", "text/plain", "resource");
    server.addPrompt("ind_prompt", "Ind Prompt", [], async () => "prompt");

    const tool = server["config"].tools!.find((t) => t.name === "ind_tool");
    const resource = server["config"].resources!.find((r) => r.uri === "test://ind_resource");
    const prompt = server["config"].prompts!.find((p) => p.name === "ind_prompt");

    expect(tool).toBeDefined();
    expect(resource).toBeDefined();
    expect(prompt).toBeDefined();
  });
});

describe("Hot-Reload - State Consistency", () => {
  let cleanup: CleanupManager;
  let server: TestMcpServer;

  beforeEach(async () => {
    cleanup = new CleanupManager();
    server = createBasicTestServer("state-consistency");
    registerServerCleanup(cleanup, server, "state consistency server");
    await server.start();
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("state remains consistent after additions", async () => {
    for (let i = 0; i < 5; i++) {
      server.addTool(
        `consistency_tool_${i}`,
        "Consistency",
        { type: "object", properties: {}, required: [] },
        async () => ({ content: [{ type: "text", text: "ok" }] }),
      );
    }

    const tools = server["config"].tools!;
    expect(tools.length).toBe(8); // 3 initial + 5 added

    for (let i = 0; i < 5; i++) {
      expect(tools.find((t) => t.name === `consistency_tool_${i}`)).toBeDefined();
    }
  });

  test("all tools have handlers", async () => {
    for (let i = 0; i < 3; i++) {
      server.addTool(
        `handler_tool_${i}`,
        "Handler",
        { type: "object", properties: {}, required: [] },
        async () => ({ content: [{ type: "text", text: `handler_${i}` }] }),
      );
    }

    const tools = server["config"].tools!;
    for (const tool of tools) {
      expect(typeof tool.handler).toBe("function");
    }
  });

  test("all resources have content", async () => {
    for (let i = 0; i < 3; i++) {
      server.addResource(
        `test://content_resource_${i}`,
        "Content",
        "Has content",
        "text/plain",
        `Content ${i}`,
      );
    }

    const resources = server["config"].resources!;
    for (const resource of resources) {
      expect(resource.content.length).toBeGreaterThan(0);
    }
  });

  test("all prompts have handlers", async () => {
    for (let i = 0; i < 2; i++) {
      server.addPrompt(`handler_prompt_${i}`, "Handler", [], async () => `prompt_${i}`);
    }

    const prompts = server["config"].prompts!;
    for (const prompt of prompts) {
      expect(typeof prompt.handler).toBe("function");
    }
  });

  test("can verify all additions are accessible", async () => {
    for (let i = 0; i < 5; i++) {
      server.addTool(
        `verify_tool_${i}`,
        "Verify",
        { type: "object", properties: {}, required: [] },
        async () => ({ content: [{ type: "text", text: "ok" }] }),
      );
    }

    const tools = server["config"].tools!;
    const toolNames = tools.map((t) => t.name);

    for (let i = 0; i < 5; i++) {
      expect(toolNames).toContain(`verify_tool_${i}`);
    }
  });
});
