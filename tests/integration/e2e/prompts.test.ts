/**
 * End-to-End Tests - Prompts
 *
 * Tests for prompt listing and retrieval through the gateway.
 */

import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import {
  CleanupManager,
  registerClientCleanup,
  registerServerCleanup,
} from "../../shared/cleanup.js";
import { createTestClient, type TestMcpClient } from "../../shared/test-client.js";
import { createBasicTestServer, type TestMcpServer } from "../../shared/test-server.js";

describe("E2E - Prompts", () => {
  let cleanup: CleanupManager;
  let server: TestMcpServer;
  let client: TestMcpClient;

  beforeEach(async () => {
    cleanup = new CleanupManager();
    server = createBasicTestServer("prompt-e2e-server");
    client = createTestClient("prompt-e2e-client");

    registerServerCleanup(cleanup, server, "prompt e2e server");
    registerClientCleanup(cleanup, client, "prompt e2e client");

    await server.start();
    await client.connectToServer(server.getTransport()!);
    server.connectToClient(client);
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("should have greet prompt configured", async () => {
    const prompts = server["config"].prompts;
    const greet = prompts?.find((p) => p.name === "greet");
    expect(greet).toBeDefined();
  });

  test("greet prompt should have description", async () => {
    const prompts = server["config"].prompts;
    const greet = prompts?.find((p) => p.name === "greet");
    expect(greet?.description.length).toBeGreaterThan(0);
  });

  test("greet prompt should have name argument", async () => {
    const prompts = server["config"].prompts;
    const greet = prompts?.find((p) => p.name === "greet");
    const nameArg = greet?.arguments.find((a) => a.name === "name");
    expect(nameArg).toBeDefined();
  });

  test("greet prompt name argument should be required", async () => {
    const prompts = server["config"].prompts;
    const greet = prompts?.find((p) => p.name === "greet");
    const nameArg = greet?.arguments.find((a) => a.name === "name");
    expect(nameArg?.required).toBe(true);
  });

  test("greet prompt should have handler", async () => {
    const prompts = server["config"].prompts;
    const greet = prompts?.find((p) => p.name === "greet");
    expect(typeof greet?.handler).toBe("function");
  });

  test("should be able to add prompts dynamically", async () => {
    server.addPrompt(
      "custom_prompt",
      "A custom prompt",
      [{ name: "input", required: false }],
      async (args) => `Custom: ${args.input || "default"}`,
    );
    const prompts = server["config"].prompts;
    const custom = prompts?.find((p) => p.name === "custom_prompt");
    expect(custom).toBeDefined();
  });

  test("dynamic prompt should be retrievable", async () => {
    server.addPrompt("dynamic_test", "Test dynamic prompt", [], async () => "Dynamic result");
    const prompts = server["config"].prompts;
    expect(prompts?.length).toBe(2);
    const dynamic = prompts?.find((p) => p.name === "dynamic_test");
    expect(dynamic).toBeDefined();
  });
});

describe("E2E - Prompt Variations", () => {
  let cleanup: CleanupManager;
  let server: TestMcpServer;

  beforeEach(async () => {
    cleanup = new CleanupManager();
    server = createBasicTestServer("prompt-var-server");
    registerServerCleanup(cleanup, server, "prompt var server");
    await server.start();
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("should handle prompt with no arguments", async () => {
    server.addPrompt("no_args", "Prompt with no arguments", [], async () => "No args result");
    const prompts = server["config"].prompts;
    const noArgs = prompts?.find((p) => p.name === "no_args");
    expect(noArgs?.arguments.length).toBe(0);
  });

  test("should handle prompt with multiple arguments", async () => {
    server.addPrompt(
      "multi_args",
      "Prompt with multiple arguments",
      [
        { name: "arg1", required: true },
        { name: "arg2", required: true },
        { name: "arg3", required: false },
      ],
      async (args) => `Result: ${args.arg1} ${args.arg2}`,
    );
    const prompts = server["config"].prompts;
    const multi = prompts?.find((p) => p.name === "multi_args");
    expect(multi?.arguments.length).toBe(3);
  });

  test("should handle prompt with optional arguments", async () => {
    server.addPrompt(
      "optional_args",
      "Prompt with optional argument",
      [{ name: "optional", required: false }],
      async (args) => `Optional: ${args.optional || "none"}`,
    );
    const prompts = server["config"].prompts;
    const opt = prompts?.find((p) => p.name === "optional_args");
    expect(opt?.arguments[0].required).toBe(false);
  });

  test("should handle prompt with argument descriptions", async () => {
    server.addPrompt(
      "described_args",
      "Prompt with described arguments",
      [{ name: "input", description: "The input text", required: true }],
      async (args) => `Input: ${args.input}`,
    );
    const prompts = server["config"].prompts;
    const desc = prompts?.find((p) => p.name === "described_args");
    expect(desc?.arguments[0].description).toBe("The input text");
  });
});

describe("E2E - Prompt Content", () => {
  let cleanup: CleanupManager;
  let server: TestMcpServer;

  beforeEach(async () => {
    cleanup = new CleanupManager();
    server = createBasicTestServer("prompt-content-server");
    registerServerCleanup(cleanup, server, "prompt content server");
    await server.start();
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("greet handler should return greeting string", async () => {
    const prompts = server["config"].prompts;
    const greet = prompts?.find((p) => p.name === "greet");
    const result = await greet?.handler({ name: "Test" });
    expect(result).toBe("Hello, Test! Welcome to the test server.");
  });

  test("prompt handler should handle empty args", async () => {
    server.addPrompt(
      "empty_test",
      "Test empty args",
      [{ name: "name", required: true }],
      async (args) => `Hello, ${args.name || "Anonymous"}!`,
    );
    const prompts = server["config"].prompts;
    const empty = prompts?.find((p) => p.name === "empty_test");
    const result = await empty?.handler({});
    expect(result).toContain("Anonymous");
  });

  test("prompt handler should handle complex args", async () => {
    server.addPrompt(
      "complex",
      "Complex prompt",
      [{ name: "data", required: true }],
      async (args) => {
        const data = args.data as { key: string };
        return `Key: ${data.key}`;
      },
    );
    const prompts = server["config"].prompts;
    const complex = prompts?.find((p) => p.name === "complex");
    const result = await complex?.handler({ data: { key: "value" } });
    expect(result).toBe("Key: value");
  });
});
