import { describe, expect, mock, test } from "bun:test";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { Registry } from "../../../src/gateway/registry.js";

describe("Registry", () => {
  test("should add server and sync tools with pagination", async () => {
    const registry = new Registry();

    // Mock Client with pagination
    const client = {
      listTools: mock(async (args: any) => {
        if (!args?.cursor) {
          return {
            tools: [{ name: "tool1", description: "desc1", inputSchema: {} }],
            nextCursor: "page2",
          };
        }
        if (args.cursor === "page2") {
          return {
            tools: [{ name: "tool2", description: "desc2", inputSchema: {} }],
          };
        }
        return { tools: [] };
      }),
    } as unknown as Client;

    await registry.addServer("server1", client);

    const tools = registry.listTools();
    expect(tools.length).toBe(2);

    // Check namespacing
    expect(tools.find((t) => t.name === "server1_tool1")).toBeDefined();
    expect(tools.find((t) => t.name === "server1_tool2")).toBeDefined();

    expect(client.listTools).toHaveBeenCalledTimes(2);
  });

  test("should remove server and its tools", async () => {
    const registry = new Registry();
    const client = {
      listTools: async () => ({
        tools: [{ name: "tool1", inputSchema: {} }],
      }),
    } as unknown as Client;

    await registry.addServer("server1", client);
    expect(registry.listTools().length).toBe(1);

    registry.removeServer("server1");
    expect(registry.listTools().length).toBe(0);
  });

  test("should get full tool definition", async () => {
    const registry = new Registry();
    const toolDef = { name: "tool1", inputSchema: { type: "object" } };
    const client = {
      listTools: async () => ({
        tools: [toolDef],
      }),
    } as unknown as Client;

    await registry.addServer("server1", client);

    const entry = registry.getTool("server1_tool1");
    expect(entry).toBeDefined();
    expect(entry?.def).toEqual(toolDef as any);
    expect(entry?.serverId).toBe("server1");
  });
});
