import { beforeEach, describe, expect, mock, test } from "bun:test";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import type { Registry } from "../../../src/gateway/registry.js";
import type { Router } from "../../../src/gateway/router.js";
import { GatewayServer } from "../../../src/gateway/server.js";

// Mock SDK Server
const mockSetRequestHandler = mock();
const mockConnect = mock();
const mockClose = mock();

mock.module("@modelcontextprotocol/sdk/server/index.js", () => ({
  Server: class {
    setRequestHandler = mockSetRequestHandler;
    connect = mockConnect;
    close = mockClose;
  },
}));

describe("GatewayServer", () => {
  beforeEach(() => {
    mockSetRequestHandler.mockClear();
    mockConnect.mockClear();
    mockClose.mockClear();
  });

  test("should initialize and register handlers", () => {
    const registry = { on: mock() } as unknown as Registry;
    const server = new GatewayServer(registry, {} as Router, {} as any);

    expect(mockSetRequestHandler).toHaveBeenCalledWith(
      ListToolsRequestSchema,
      expect.any(Function),
    );
    expect(mockSetRequestHandler).toHaveBeenCalledWith(CallToolRequestSchema, expect.any(Function));
  });

  test("should handle tool list request", async () => {
    const registry = {
      listTools: mock(() => [{ name: "t1" }]),
      getTool: mock(() => ({ id: "t1", def: { description: "d", inputSchema: {} } })),
      on: mock(),
    } as unknown as Registry;

    const server = new GatewayServer(registry, {} as Router, {} as any);

    // Extract handler
    const handler = mockSetRequestHandler.mock.calls.find(
      (call) => call[0] === ListToolsRequestSchema,
    )[1];

    const result = await handler();
    expect(result.tools).toHaveLength(1);
    expect(result.tools[0].name).toBe("t1");
  });

  test("should handle tool call request", async () => {
    const router = {
      callTool: mock(async () => ({ result: "ok" })),
    } as unknown as Router;

    const registry = { on: mock() } as unknown as Registry;

    const server = new GatewayServer(registry, router, {} as any);

    // Extract handler
    const handler = mockSetRequestHandler.mock.calls.find(
      (call) => call[0] === CallToolRequestSchema,
    )[1];

    const result = await handler({ params: { name: "t1", arguments: {} } });
    expect(router.callTool).toHaveBeenCalledWith("t1", {});
    expect(result).toEqual({ result: "ok" });
  });
});
