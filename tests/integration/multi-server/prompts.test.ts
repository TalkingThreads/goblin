/**
 * Multi-Server Tests - Prompts
 *
 * Tests for prompt handling across multiple servers.
 */

import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { CleanupManager, registerServerCleanup } from "../../shared/cleanup.js";
import { createBasicTestServer, type TestMcpServer } from "../../shared/test-server.js";

describe("Multi-Server - Prompt Configuration", () => {
  let cleanup: CleanupManager;
  let server1: TestMcpServer;
  let server2: TestMcpServer;

  beforeEach(() => {
    cleanup = new CleanupManager();
    server1 = createBasicTestServer("prompt-config-1");
    server2 = createBasicTestServer("prompt-config-2");

    registerServerCleanup(cleanup, server1, "prompt config server 1");
    registerServerCleanup(cleanup, server2, "prompt config server 2");
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("each server should have one prompt", async () => {
    await server1.start();
    await server2.start();

    expect(server1["config"].prompts?.length).toBe(1);
    expect(server2["config"].prompts?.length).toBe(1);
  });

  test("prompts should have names", async () => {
    await server1.start();
    await server2.start();

    const prompts1 = server1["config"].prompts!;
    const prompts2 = server2["config"].prompts!;

    for (const prompt of prompts1) {
      expect(prompt.name.length).toBeGreaterThan(0);
    }
    for (const prompt of prompts2) {
      expect(prompt.name.length).toBeGreaterThan(0);
    }
  });

  test("prompts should have descriptions", async () => {
    await server1.start();
    await server2.start();

    const prompts1 = server1["config"].prompts!;
    const prompts2 = server2["config"].prompts!;

    for (const prompt of prompts1) {
      expect(prompt.description.length).toBeGreaterThan(0);
    }
    for (const prompt of prompts2) {
      expect(prompt.description.length).toBeGreaterThan(0);
    }
  });

  test("prompts should have arguments array", async () => {
    await server1.start();
    await server2.start();

    const prompts1 = server1["config"].prompts!;
    const prompts2 = server2["config"].prompts!;

    for (const prompt of prompts1) {
      expect(Array.isArray(prompt.arguments)).toBe(true);
    }
    for (const prompt of prompts2) {
      expect(Array.isArray(prompt.arguments)).toBe(true);
    }
  });

  test("prompts should have handlers", async () => {
    await server1.start();
    await server2.start();

    const prompts1 = server1["config"].prompts!;
    const prompts2 = server2["config"].prompts!;

    for (const prompt of prompts1) {
      expect(typeof prompt.handler).toBe("function");
    }
    for (const prompt of prompts2) {
      expect(typeof prompt.handler).toBe("function");
    }
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

  test("both servers should have greet prompt", async () => {
    await server1.start();
    await server2.start();

    const names1 = server1["config"].prompts?.map((p) => p.name);
    const names2 = server2["config"].prompts?.map((p) => p.name);

    expect(names1).toContain("greet");
    expect(names2).toContain("greet");
  });

  test("greet prompt should have name argument", async () => {
    await server1.start();
    await server2.start();

    const prompt1 = server1["config"].prompts?.find((p) => p.name === "greet");
    const prompt2 = server2["config"].prompts?.find((p) => p.name === "greet");

    const arg1 = prompt1?.arguments.find((a) => a.name === "name");
    const arg2 = prompt2?.arguments.find((a) => a.name === "name");

    expect(arg1).toBeDefined();
    expect(arg2).toBeDefined();
  });

  test("greet prompt name argument should be required", async () => {
    await server1.start();
    await server2.start();

    const prompt1 = server1["config"].prompts?.find((p) => p.name === "greet");
    const prompt2 = server2["config"].prompts?.find((p) => p.name === "greet");

    const arg1 = prompt1?.arguments.find((a) => a.name === "name");
    const arg2 = prompt2?.arguments.find((a) => a.name === "name");

    expect(arg1?.required).toBe(true);
    expect(arg2?.required).toBe(true);
  });
});

describe("Multi-Server - Dynamic Prompts", () => {
  let cleanup: CleanupManager;
  let server1: TestMcpServer;
  let server2: TestMcpServer;

  beforeEach(() => {
    cleanup = new CleanupManager();
    server1 = createBasicTestServer("prompt-dynamic-1");
    server2 = createBasicTestServer("prompt-dynamic-2");

    registerServerCleanup(cleanup, server1, "prompt dynamic server 1");
    registerServerCleanup(cleanup, server2, "prompt dynamic server 2");
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("can add prompt to server1 only", async () => {
    await server1.start();
    await server2.start();

    server1.addPrompt(
      "server1_prompt",
      "Only on server1",
      [{ name: "input", required: false }],
      async (args) => `Server1: ${args.input || "default"}`,
    );

    const names1 = server1["config"].prompts?.map((p) => p.name);
    const names2 = server2["config"].prompts?.map((p) => p.name);

    expect(names1).toContain("server1_prompt");
    expect(names2).not.toContain("server1_prompt");
  });

  test("can add prompt to server2 only", async () => {
    await server1.start();
    await server2.start();

    server2.addPrompt(
      "server2_prompt",
      "Only on server2",
      [{ name: "input", required: false }],
      async (args) => `Server2: ${args.input || "default"}`,
    );

    const names1 = server1["config"].prompts?.map((p) => p.name);
    const names2 = server2["config"].prompts?.map((p) => p.name);

    expect(names2).toContain("server2_prompt");
    expect(names1).not.toContain("server2_prompt");
  });

  test("can add different prompts to different servers", async () => {
    await server1.start();
    await server2.start();

    server1.addPrompt("prompt_a", "Prompt A on server1", [], async () => "Prompt A result");

    server2.addPrompt("prompt_b", "Prompt B on server2", [], async () => "Prompt B result");

    const names1 = server1["config"].prompts?.map((p) => p.name);
    const names2 = server2["config"].prompts?.map((p) => p.name);

    expect(names1).toContain("prompt_a");
    expect(names2).toContain("prompt_b");
    expect(names1).not.toContain("prompt_b");
    expect(names2).not.toContain("prompt_a");
  });
});

describe("Multi-Server - Prompt Handlers", () => {
  let cleanup: CleanupManager;
  let server1: TestMcpServer;
  let server2: TestMcpServer;

  beforeEach(() => {
    cleanup = new CleanupManager();
    server1 = createBasicTestServer("prompt-handler-1");
    server2 = createBasicTestServer("prompt-handler-2");

    registerServerCleanup(cleanup, server1, "prompt handler server 1");
    registerServerCleanup(cleanup, server2, "prompt handler server 2");
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("greet handler should return greeting string", async () => {
    await server1.start();
    await server2.start();

    const prompt1 = server1["config"].prompts?.find((p) => p.name === "greet");
    const prompt2 = server2["config"].prompts?.find((p) => p.name === "greet");

    const result1 = await prompt1?.handler({ name: "Test" });
    const result2 = await prompt2?.handler({ name: "Test" });

    expect(result1).toBe("Hello, Test! Welcome to the test server.");
    expect(result2).toBe("Hello, Test! Welcome to the test server.");
  });

  test("can create prompts with custom handlers", async () => {
    await server1.start();
    await server2.start();

    server1.addPrompt(
      "custom1",
      "Custom prompt 1",
      [{ name: "value", required: true }],
      async (args) => `Custom1: ${args.value}`,
    );

    server2.addPrompt(
      "custom2",
      "Custom prompt 2",
      [{ name: "value", required: true }],
      async (args) => `Custom2: ${args.value}`,
    );

    const result1 = await server1["config"].prompts
      ?.find((p) => p.name === "custom1")
      ?.handler({ value: "test" });
    const result2 = await server2["config"].prompts
      ?.find((p) => p.name === "custom2")
      ?.handler({ value: "test" });

    expect(result1).toBe("Custom1: test");
    expect(result2).toBe("Custom2: test");
  });

  test("prompts should handle optional arguments", async () => {
    await server1.start();
    await server2.start();

    server1.addPrompt(
      "optional_test",
      "Test optional args",
      [{ name: "opt", required: false }],
      async (args) => `Opt: ${args.opt || "none"}`,
    );

    const prompt = server1["config"].prompts?.find((p) => p.name === "optional_test");
    const result = await prompt?.handler({});

    expect(result).toBe("Opt: none");
  });
});
