import { describe, expect, mock, test } from "bun:test";
import type { Config } from "../../../src/config/schema.js";
import type { Registry } from "../../../src/gateway/registry.js";
import { Router } from "../../../src/gateway/router.js";
import type { TransportPool } from "../../../src/transport/pool.js";

describe("Router", () => {
  test("should route tool call to correct server", async () => {
    // Mock Config
    const config: Config = {
      servers: [{ name: "server1", transport: "stdio", command: "echo", enabled: true }],
      gateway: {} as any,
      auth: {} as any,
      policies: { defaultTimeout: 1000 } as any,
    };

    // Mock Client
    const mockClient = {
      callTool: mock(async () => ({
        content: [{ type: "text", text: "success" }],
      })),
    };

    // Mock Transport
    const mockTransport = {
      isConnected: () => true,
      getClient: () => mockClient,
    };

    // Mock Pool
    const mockPool = {
      getTransport: mock(async () => mockTransport),
    } as unknown as TransportPool;

    // Mock Registry
    const mockRegistry = {
      getTool: mock((name: string) => {
        if (name === "server1_tool1") {
          return {
            serverId: "server1",
            def: { name: "tool1", inputSchema: {} },
            id: "server1_tool1",
          };
        }
        return undefined;
      }),
      getLocalTool: mock(() => undefined),
    } as unknown as Registry;

    const router = new Router(mockRegistry, mockPool, config);

    const result = await router.callTool("server1_tool1", { arg: 1 });

    expect(mockRegistry.getTool).toHaveBeenCalledWith("server1_tool1");
    expect(mockPool.getTransport).toHaveBeenCalled();
    expect(mockClient.callTool).toHaveBeenCalled();
    expect(result).toEqual({ content: [{ type: "text", text: "success" }] } as any);
  });

  test("should throw if tool not found", async () => {
    const config: Config = {
      servers: [],
      gateway: {} as any,
      auth: {} as any,
      policies: {} as any,
    };
    const router = new Router(
      { getTool: () => undefined, getLocalTool: () => undefined } as any,
      {} as any,
      config,
    );

    expect(router.callTool("unknown", {})).rejects.toThrow("Tool not found: unknown");
  });

  test("should throw if server config not found", async () => {
    const config: Config = {
      servers: [],
      gateway: {} as any,
      auth: {} as any,
      policies: {} as any,
    };
    const registry = {
      getTool: () => ({ serverId: "missing", def: { name: "tool" } }),
      getLocalTool: () => undefined,
    } as any;

    const router = new Router(registry, {} as any, config);

    expect(router.callTool("t1", {})).rejects.toThrow("Server not found: missing");
  });
});
