import { describe, expect, mock, test } from "bun:test";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { Registry } from "../../../src/gateway/registry.js";

describe("Registry", () => {
  test("should add server and sync capabilities with pagination", async () => {
    const registry = new Registry();

    // Mock Client with pagination for tools, and simple for others
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
      listPrompts: mock(async () => ({
        prompts: [{ name: "prompt1", description: "p1" }],
      })),
      listResources: mock(async () => ({
        resources: [{ uri: "file:///test.txt", name: "res1", mimeType: "text/plain" }],
      })),
      listResourceTemplates: mock(async () => ({
        resourceTemplates: [{ uriTemplate: "file:///{path}", name: "tmpl1" }],
      })),
      setNotificationHandler: mock(),
    } as unknown as Client;

    await registry.addServer("server1", client);

    // Verify Tools
    const tools = registry.listTools();
    expect(tools.length).toBe(2);
    expect(tools.find((t) => t.name === "server1_tool1")).toBeDefined();
    expect(tools.find((t) => t.name === "server1_tool2")).toBeDefined();

    // Verify Prompts
    const prompts = registry.listPrompts();
    expect(prompts.length).toBe(1);
    expect(prompts[0].id).toBe("server1_prompt1");
    expect(registry.getPrompt("server1_prompt1")).toBeDefined();

    // Verify Resources
    const resources = registry.listResources();
    expect(resources.length).toBe(1);
    expect(resources[0].def.uri).toBe("file:///test.txt");
    expect(registry.getResource("file:///test.txt")).toBeDefined();

    // Verify Templates
    const templates = registry.listResourceTemplates();
    expect(templates.length).toBe(1);
    expect(templates[0].def.uriTemplate).toBe("file:///{path}");

    expect(client.listTools).toHaveBeenCalledTimes(2);
    expect(client.listPrompts).toHaveBeenCalledTimes(1);
    expect(client.listResources).toHaveBeenCalledTimes(1);
    expect(client.listResourceTemplates).toHaveBeenCalledTimes(1);
    expect(client.setNotificationHandler).toHaveBeenCalled();
  });

  test("should remove server and clear all capabilities", async () => {
    const registry = new Registry();
    const client = {
      listTools: async () => ({ tools: [{ name: "tool1", inputSchema: {} }] }),
      listPrompts: async () => ({ prompts: [{ name: "prompt1" }] }),
      listResources: async () => ({ resources: [{ uri: "res://1" }] }),
      listResourceTemplates: async () => ({ resourceTemplates: [{ uriTemplate: "tmpl://1" }] }),
      setNotificationHandler: () => {},
    } as unknown as Client;

    await registry.addServer("server1", client);
    expect(registry.listTools().length).toBe(1);
    expect(registry.listPrompts().length).toBe(1);
    expect(registry.listResources().length).toBe(1);
    expect(registry.listResourceTemplates().length).toBe(1);

    registry.removeServer("server1");
    expect(registry.listTools().length).toBe(0);
    expect(registry.listPrompts().length).toBe(0);
    expect(registry.listResources().length).toBe(0);
    expect(registry.listResourceTemplates().length).toBe(0);
  });

  test("should get full definitions", async () => {
    const registry = new Registry();
    const toolDef = { name: "tool1", inputSchema: { type: "object" } };
    const promptDef = { name: "prompt1", description: "p1" };
    const resourceDef = { uri: "res://1", name: "r1" };

    const client = {
      listTools: async () => ({ tools: [toolDef] }),
      listPrompts: async () => ({ prompts: [promptDef] }),
      listResources: async () => ({ resources: [resourceDef] }),
      listResourceTemplates: async () => ({ resourceTemplates: [] }),
      setNotificationHandler: () => {},
    } as unknown as Client;

    await registry.addServer("server1", client);

    const toolEntry = registry.getTool("server1_tool1");
    expect(toolEntry?.def).toEqual(toolDef as any);

    const promptEntry = registry.getPrompt("server1_prompt1");
    expect(promptEntry?.def).toEqual(promptDef as any);

    const resourceEntry = registry.getResource("res://1");
    expect(resourceEntry?.def).toEqual(resourceDef as any);
  });
});
