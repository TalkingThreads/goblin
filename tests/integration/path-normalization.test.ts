import { describe, expect, mock, test } from "bun:test";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import type { Config } from "../../src/config/schema.js";
import { Registry } from "../../src/gateway/registry.js";
import { Router } from "../../src/gateway/router.js";
import { TransportPool } from "../../src/transport/pool.js";

describe("Path Normalization Integration", () => {
  test("should normalize Windows paths in tool arguments", async () => {
    const registry = new Registry();
    const config = {
      servers: [
        {
          name: "test-server",
          transport: "stdio", // Mocked anyway
          command: "test",
          normalizePaths: true,
        },
      ],
      gateway: { port: 0, host: "localhost", transport: "both" },
      auth: { mode: "dev" },
      policies: { defaultTimeout: 1000, outputSizeLimit: 1000, normalizePaths: true },
    } as unknown as Config;

    const transportPool = new TransportPool();
    // Mock getTransport to return a mocked client
    const mockCallTool = mock(async () => ({ content: [] }));
    const mockClient = {
      callTool: mockCallTool,
    } as unknown as Client;

    transportPool.getTransport = mock(
      async () =>
        ({
          isConnected: () => true,
          getClient: () => mockClient,
          type: "stdio",
          close: async () => {},
          connect: async () => {},
        }) as any,
    );

    const router = new Router(registry, transportPool, config);

    // Register a tool
    const toolDef = {
      name: "read_file",
      description: "Read file",
      inputSchema: {
        type: "object",
        properties: { path: { type: "string" } },
      },
    };
    await registry.addServer("test-server", {
      listTools: async () => ({ tools: [toolDef] }),
      listPrompts: async () => ({ prompts: [] }),
      listResources: async () => ({ resources: [] }),
      listResourceTemplates: async () => ({ resourceTemplates: [] }),
      setNotificationHandler: () => {},
    } as any);

    // Call the tool with a Windows path
    await router.callTool("test-server_read_file", { path: "C:\\Users\\test" });

    // Verify it was normalized
    expect(mockCallTool).toHaveBeenCalled();
    const callArgs = mockCallTool.mock.calls[0][0];
    if (!callArgs) throw new Error("callArgs undefined");
    expect(callArgs.arguments.path).toBe("C:/Users/test");
  });

  test("should respect opt-out via configuration", async () => {
    const registry = new Registry();
    const config = {
      servers: [
        {
          name: "no-norm-server",
          transport: "stdio",
          command: "test",
          normalizePaths: false, // Opt-out
        },
      ],
      gateway: { port: 0, host: "localhost", transport: "both" },
      auth: { mode: "dev" },
      policies: { defaultTimeout: 1000, outputSizeLimit: 1000, normalizePaths: true },
    } as unknown as Config;

    const transportPool = new TransportPool();
    const mockCallTool = mock(async () => ({ content: [] }));
    transportPool.getTransport = mock(
      async () =>
        ({
          isConnected: () => true,
          getClient: () => ({ callTool: mockCallTool }),
          type: "stdio",
        }) as any,
    );

    const router = new Router(registry, transportPool, config);

    // Register tool
    await registry.addServer("no-norm-server", {
      listTools: async () => ({ tools: [{ name: "t1", inputSchema: {} }] }),
      listPrompts: async () => ({ prompts: [] }),
      listResources: async () => ({ resources: [] }),
      listResourceTemplates: async () => ({ resourceTemplates: [] }),
      setNotificationHandler: () => {},
    } as any);

    // Call with Windows path
    await router.callTool("no-norm-server_t1", { path: "C:\\Users\\test" });

    // Verify NOT normalized
    expect(mockCallTool).toHaveBeenCalled();
    const callArgs = mockCallTool.mock.calls[0][0];
    if (!callArgs) throw new Error("callArgs undefined");
    expect(callArgs.arguments.path).toBe("C:\\Users\\test");
  });

  test("should normalize nested objects and arrays", async () => {
    const registry = new Registry();
    const config = {
      servers: [{ name: "s1", transport: "stdio", command: "t" }],
      gateway: { port: 0, host: "localhost", transport: "both" },
      auth: { mode: "dev" },
      policies: { defaultTimeout: 1000, outputSizeLimit: 1000, normalizePaths: true },
    } as unknown as Config;

    const transportPool = new TransportPool();
    const mockCallTool = mock(async () => ({ content: [] }));
    transportPool.getTransport = mock(
      async () =>
        ({
          isConnected: () => true,
          getClient: () => ({ callTool: mockCallTool }),
          type: "stdio",
        }) as any,
    );

    const router = new Router(registry, transportPool, config);

    await registry.addServer("s1", {
      listTools: async () => ({ tools: [{ name: "t1", inputSchema: {} }] }),
      listPrompts: async () => ({ prompts: [] }),
      listResources: async () => ({ resources: [] }),
      listResourceTemplates: async () => ({ resourceTemplates: [] }),
      setNotificationHandler: () => {},
    } as any);

    const args = {
      files: ["C:\\a", "C:\\b"],
      config: { root: "D:\\root" },
    };

    await router.callTool("s1_t1", args);

    const callArgs = mockCallTool.mock.calls[0][0];
    if (!callArgs) throw new Error("callArgs undefined");
    expect(callArgs.arguments.files).toEqual(["C:/a", "C:/b"]);
    expect(callArgs.arguments.config.root).toBe("D:/root");
  });
});
