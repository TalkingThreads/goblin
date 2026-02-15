import { beforeEach, describe, expect, mock, test } from "bun:test";
import {
  CallToolRequestSchema,
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
  ListResourcesRequestSchema,
  ListResourceTemplatesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import type { Config } from "../../../src/config/schema.js";
import type { Registry } from "../../../src/gateway/registry.js";
import type { Router } from "../../../src/gateway/router.js";
import { GatewayServer } from "../../../src/gateway/server.js";

// Mock SDK Server
const mockSetRequestHandler = mock();
const mockConnect = mock();
const mockClose = mock();
const mockNotification = mock();
const mockSetNotificationHandler = mock();

mock.module("@modelcontextprotocol/sdk/server/index.js", () => ({
  Server: class {
    setRequestHandler = mockSetRequestHandler;
    connect = mockConnect;
    close = mockClose;
    notification = mockNotification;
    setNotificationHandler = mockSetNotificationHandler;
  },
}));

const testConfig: Config = {
  servers: [],
  gateway: { port: 3000, host: "127.0.0.1", transport: "both" },
  streamableHttp: { sseEnabled: true, sessionTimeout: 300000, maxSessions: 1000 },
  daemon: { lockPort: 12490 },
  auth: { mode: "dev" },
  policies: { outputSizeLimit: 65536, defaultTimeout: 30000 },
};

describe("GatewayServer", () => {
  beforeEach(() => {
    mockSetRequestHandler.mockClear();
    mockConnect.mockClear();
    mockClose.mockClear();
    mockNotification.mockClear();
    mockSetNotificationHandler.mockClear();
  });

  test("should initialize and register handlers", () => {
    const registry = { on: mock() } as unknown as Registry;
    new GatewayServer(registry, {} as Router, testConfig);

    const registeredSchemas = mockSetRequestHandler.mock.calls.map((call) => call[0]);
    expect(registeredSchemas).toContain(ListToolsRequestSchema);
    expect(registeredSchemas).toContain(CallToolRequestSchema);
    expect(registeredSchemas).toContain(ListPromptsRequestSchema);
    expect(registeredSchemas).toContain(GetPromptRequestSchema);
    expect(registeredSchemas).toContain(ListResourcesRequestSchema);
    expect(registeredSchemas).toContain(ListResourceTemplatesRequestSchema);
    expect(registeredSchemas).toContain(ReadResourceRequestSchema);
  });

  test("should handle tool list request", async () => {
    const registry = {
      listTools: mock(() => [{ name: "t1" }]),
      getAllTools: mock(() => [{ id: "t1", def: { description: "d", inputSchema: {} } }]),
      getAliasedTools: mock(() => [{ name: "t1", description: "d", inputSchema: {} }]),
      getTool: mock(() => ({ id: "t1", def: { description: "d", inputSchema: {} } })),
      on: mock(),
    } as unknown as Registry;

    new GatewayServer(registry, {} as Router, testConfig);

    const handler = mockSetRequestHandler.mock.calls.find(
      (call) => call[0] === ListToolsRequestSchema,
    )[1];

    const result = await handler();
    expect(result.tools).toHaveLength(1);
    expect(result.tools[0].name).toBe("t1");
  });

  test("should handle prompt list request", async () => {
    const registry = {
      listPrompts: mock(() => [
        { id: "p1", def: { name: "prompt1", description: "d1" }, serverId: "s1" },
      ]),
      getAllPrompts: mock(() => [
        { id: "p1", def: { name: "prompt1", description: "d1" }, serverId: "s1" },
      ]),
      on: mock(),
    } as unknown as Registry;

    new GatewayServer(registry, {} as Router, testConfig);

    const handler = mockSetRequestHandler.mock.calls.find(
      (call) => call[0] === ListPromptsRequestSchema,
    )[1];

    const result = await handler();
    expect(result.prompts).toHaveLength(1);
    expect(result.prompts[0].name).toBe("p1");
  });

  test("should handle prompt get request", async () => {
    const router = {
      getPrompt: mock(async () => ({ messages: [] })),
    } as unknown as Router;
    const registry = { on: mock() } as unknown as Registry;

    new GatewayServer(registry, router, testConfig);

    const handler = mockSetRequestHandler.mock.calls.find(
      (call) => call[0] === GetPromptRequestSchema,
    )[1];

    const result = await handler({ params: { name: "p1", arguments: { a: "1" } } });
    expect(router.getPrompt).toHaveBeenCalledWith("p1", { a: "1" });
    expect(result.messages).toEqual([]);
  });

  test("should handle resource list request", async () => {
    const registry = {
      listResources: mock(() => [{ def: { uri: "res://1", name: "r1" }, serverId: "s1" }]),
      getAllResources: mock(() => [{ def: { uri: "res://1", name: "r1" }, serverId: "s1" }]),
      getAllResourceTemplates: mock(() => []),
      on: mock(),
    } as unknown as Registry;

    new GatewayServer(registry, {} as Router, testConfig);

    const handler = mockSetRequestHandler.mock.calls.find(
      (call) => call[0] === ListResourcesRequestSchema,
    )[1];

    const result = await handler();
    expect(result.resources).toHaveLength(1);
    expect(result.resources[0].uri).toBe("res://1");
  });

  test("should handle resource read request", async () => {
    const router = {
      readResource: mock(async () => ({ contents: [] })),
    } as unknown as Router;
    const registry = { on: mock() } as unknown as Registry;

    new GatewayServer(registry, router, testConfig);

    const handler = mockSetRequestHandler.mock.calls.find(
      (call) => call[0] === ReadResourceRequestSchema,
    )[1];

    const result = await handler({ params: { uri: "res://1" } });
    expect(router.readResource).toHaveBeenCalledWith("res://1");
    expect(result.contents).toEqual([]);
  });

  test("should send notifications on registry changes", () => {
    const eventHandlers: Record<string, () => void> = {};
    const registryMock = {
      on: (event: string, handler: () => void) => {
        eventHandlers[event] = handler;
      },
    } as unknown as Registry;

    new GatewayServer(registryMock, {} as Router, testConfig);

    // Test tool-change
    eventHandlers["tool-change"]?.();
    expect(mockNotification).toHaveBeenCalledWith({ method: "notifications/tools/list_changed" });

    // Test prompt-change
    eventHandlers["prompt-change"]?.();
    expect(mockNotification).toHaveBeenCalledWith({ method: "notifications/prompts/list_changed" });

    // Test resource-change
    eventHandlers["resource-change"]?.();
    expect(mockNotification).toHaveBeenCalledWith({
      method: "notifications/resources/list_changed",
    });
  });
});
