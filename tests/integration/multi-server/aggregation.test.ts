/**
 * Multi-Server Tests - Aggregation
 *
 * Tests for aggregating tools, resources, and prompts from multiple servers.
 */

import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { CleanupManager, registerServerCleanup } from "../../shared/cleanup.js";
import { createBasicTestServer, type TestMcpServer } from "../../shared/test-server.js";

describe("Multi-Server - Tool Aggregation", () => {
  let cleanup: CleanupManager;
  let server1: TestMcpServer;
  let server2: TestMcpServer;

  beforeEach(() => {
    cleanup = new CleanupManager();
    server1 = createBasicTestServer("tool-agg-1");
    server2 = createBasicTestServer("tool-agg-2");

    registerServerCleanup(cleanup, server1, "tool agg server 1");
    registerServerCleanup(cleanup, server2, "tool agg server 2");
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("each server should have echo tool", async () => {
    await server1.start();
    await server2.start();

    const tools1 = server1["config"].tools?.map((t) => t.name);
    const tools2 = server2["config"].tools?.map((t) => t.name);

    expect(tools1).toContain("echo");
    expect(tools2).toContain("echo");
  });

  test("each server should have add tool", async () => {
    await server1.start();
    await server2.start();

    const tools1 = server1["config"].tools?.map((t) => t.name);
    const tools2 = server2["config"].tools?.map((t) => t.name);

    expect(tools1).toContain("add");
    expect(tools2).toContain("add");
  });

  test("each server should have get_time tool", async () => {
    await server1.start();
    await server2.start();

    const tools1 = server1["config"].tools?.map((t) => t.name);
    const tools2 = server2["config"].tools?.map((t) => t.name);

    expect(tools1).toContain("get_time");
    expect(tools2).toContain("get_time");
  });

  test("servers should have same tool count", async () => {
    await server1.start();
    await server2.start();

    expect(server1["config"].tools?.length).toBe(server2["config"].tools?.length);
  });

  test("can add unique tools to different servers", async () => {
    await server1.start();
    await server2.start();

    server1.addTool(
      "server1_special",
      "Special to server1",
      { type: "object", properties: {}, required: [] },
      async () => ({ content: [{ type: "text", text: "server1" }] }),
    );

    server2.addTool(
      "server2_special",
      "Special to server2",
      { type: "object", properties: {}, required: [] },
      async () => ({ content: [{ type: "text", text: "server2" }] }),
    );

    const tools1 = server1["config"].tools?.map((t) => t.name);
    const tools2 = server2["config"].tools?.map((t) => t.name);

    expect(tools1).toContain("server1_special");
    expect(tools2).toContain("server2_special");
    expect(tools1).not.toContain("server2_special");
    expect(tools2).not.toContain("server1_special");
  });
});

describe("Multi-Server - Resource Aggregation", () => {
  let cleanup: CleanupManager;
  let server1: TestMcpServer;
  let server2: TestMcpServer;

  beforeEach(() => {
    cleanup = new CleanupManager();
    server1 = createBasicTestServer("resource-agg-1");
    server2 = createBasicTestServer("resource-agg-2");

    registerServerCleanup(cleanup, server1, "resource agg server 1");
    registerServerCleanup(cleanup, server2, "resource agg server 2");
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("each server should have two resources", async () => {
    await server1.start();
    await server2.start();

    expect(server1["config"].resources?.length).toBe(2);
    expect(server2["config"].resources?.length).toBe(2);
  });

  test("resources should have same mime types", async () => {
    await server1.start();
    await server2.start();

    const mimeTypes1 = server1["config"].resources?.map((r) => r.mimeType);
    const mimeTypes2 = server2["config"].resources?.map((r) => r.mimeType);

    expect(mimeTypes1).toEqual(mimeTypes2);
  });

  test("can add unique resources to different servers", async () => {
    await server1.start();
    await server2.start();

    server1.addResource(
      "test://server1-resource",
      "Server1 Resource",
      "Only on server1",
      "text/plain",
      "Server1 content",
    );

    server2.addResource(
      "test://server2-resource",
      "Server2 Resource",
      "Only on server2",
      "text/plain",
      "Server2 content",
    );

    const uris1 = server1["config"].resources?.map((r) => r.uri);
    const uris2 = server2["config"].resources?.map((r) => r.uri);

    expect(uris1).toContain("test://server1-resource");
    expect(uris2).toContain("test://server2-resource");
    expect(uris1).not.toContain("test://server2-resource");
    expect(uris2).not.toContain("test://server1-resource");
  });
});

describe("Multi-Server - Prompt Aggregation", () => {
  let cleanup: CleanupManager;
  let server1: TestMcpServer;
  let server2: TestMcpServer;

  beforeEach(() => {
    cleanup = new CleanupManager();
    server1 = createBasicTestServer("prompt-agg-1");
    server2 = createBasicTestServer("prompt-agg-2");

    registerServerCleanup(cleanup, server1, "prompt agg server 1");
    registerServerCleanup(cleanup, server2, "prompt agg server 2");
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("each server should have greet prompt", async () => {
    await server1.start();
    await server2.start();

    const prompts1 = server1["config"].prompts?.map((p) => p.name);
    const prompts2 = server2["config"].prompts?.map((p) => p.name);

    expect(prompts1).toContain("greet");
    expect(prompts2).toContain("greet");
  });

  test("each server should have same prompt count", async () => {
    await server1.start();
    await server2.start();

    expect(server1["config"].prompts?.length).toBe(server2["config"].prompts?.length);
  });

  test("prompts should have same arguments", async () => {
    await server1.start();
    await server2.start();

    const prompt1 = server1["config"].prompts?.find((p) => p.name === "greet");
    const prompt2 = server2["config"].prompts?.find((p) => p.name === "greet");

    expect(prompt1?.arguments).toEqual(prompt2?.arguments);
  });

  test("can add unique prompts to different servers", async () => {
    await server1.start();
    await server2.start();

    server1.addPrompt(
      "server1_prompt",
      "Only on server1",
      [{ name: "input", required: false }],
      async (args) => `Server1: ${args.input || "default"}`,
    );

    server2.addPrompt(
      "server2_prompt",
      "Only on server2",
      [{ name: "input", required: false }],
      async (args) => `Server2: ${args.input || "default"}`,
    );

    const names1 = server1["config"].prompts?.map((p) => p.name);
    const names2 = server2["config"].prompts?.map((p) => p.name);

    expect(names1).toContain("server1_prompt");
    expect(names2).toContain("server2_prompt");
    expect(names1).not.toContain("server2_prompt");
    expect(names2).not.toContain("server1_prompt");
  });
});

describe("Multi-Server - Combined Aggregation", () => {
  let cleanup: CleanupManager;
  let server1: TestMcpServer;
  let server2: TestMcpServer;

  beforeEach(() => {
    cleanup = new CleanupManager();
    server1 = createBasicTestServer("combined-1");
    server2 = createBasicTestServer("combined-2");

    registerServerCleanup(cleanup, server1, "combined server 1");
    registerServerCleanup(cleanup, server2, "combined server 2");
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("both servers should have all capability types", async () => {
    await server1.start();
    await server2.start();

    expect(server1["config"].tools?.length).toBeGreaterThan(0);
    expect(server1["config"].resources?.length).toBeGreaterThan(0);
    expect(server1["config"].prompts?.length).toBeGreaterThan(0);

    expect(server2["config"].tools?.length).toBeGreaterThan(0);
    expect(server2["config"].resources?.length).toBeGreaterThan(0);
    expect(server2["config"].prompts?.length).toBeGreaterThan(0);
  });

  test("capability counts should match between servers", async () => {
    await server1.start();
    await server2.start();

    expect(server1["config"].tools?.length).toBe(server2["config"].tools?.length);
    expect(server1["config"].resources?.length).toBe(server2["config"].resources?.length);
    expect(server1["config"].prompts?.length).toBe(server2["config"].prompts?.length);
  });
});
