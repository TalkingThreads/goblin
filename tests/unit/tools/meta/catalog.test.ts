import { describe, expect, mock, test } from "bun:test";
import type { ToolEntry } from "../../../../src/gateway/types.js";
import { catalogList, catalogSearch } from "../../../../src/tools/meta/catalog.js";
import type { MetaToolContext } from "../../../../src/tools/meta/types.js";

describe("catalogList", () => {
  const createMockContext = (tools: ToolEntry[] = []): MetaToolContext => {
    const mockRegistry = {
      getAllTools: mock(() => tools),
    } as unknown as MetaToolContext["registry"];

    return {
      registry: mockRegistry,
      config: {} as MetaToolContext["config"],
      router: {} as MetaToolContext["router"],
    } as MetaToolContext;
  };

  test("returns empty array when no tools", async () => {
    const ctx = createMockContext([]);
    const result = (await catalogList.execute({ serverId: undefined }, ctx)) as {
      tools: Array<{ name: string }>;
    };
    expect(result.tools).toEqual([]);
  });

  test("returns all tools when no serverId filter", async () => {
    const tools: ToolEntry[] = [
      {
        id: "server1_tool1",
        serverId: "server1",
        def: {
          name: "tool1",
          description: "A test tool",
          inputSchema: { type: "object", properties: { arg1: { type: "string" } } },
        },
      },
      {
        id: "server2_tool1",
        serverId: "server2",
        def: {
          name: "tool1",
          description: "Another test tool",
          inputSchema: { type: "object", properties: {} },
        },
      },
    ];

    const ctx = createMockContext(tools);
    const result = (await catalogList.execute({ serverId: undefined }, ctx)) as {
      tools: Array<{ name: string; serverId: string }>;
    };

    expect(result.tools).toHaveLength(2);
    expect(result.tools[0]?.name).toBe("server1_tool1");
    expect(result.tools[1]?.name).toBe("server2_tool1");
  });

  test("filters tools by serverId", async () => {
    const tools: ToolEntry[] = [
      {
        id: "server1_tool1",
        serverId: "server1",
        def: {
          name: "tool1",
          description: "A test tool",
          inputSchema: { type: "object", properties: { arg1: { type: "string" } } },
        },
      },
      {
        id: "server2_tool1",
        serverId: "server2",
        def: {
          name: "tool1",
          description: "Another test tool",
          inputSchema: { type: "object", properties: {} },
        },
      },
    ];

    const ctx = createMockContext(tools);
    const result = (await catalogList.execute({ serverId: "server1" }, ctx)) as {
      tools: Array<{ name: string; serverId: string }>;
    };

    expect(result.tools).toHaveLength(1);
    expect(result.tools[0]?.serverId).toBe("server1");
  });

  test("excludes meta-tools (goblin server)", async () => {
    const tools: ToolEntry[] = [
      {
        id: "goblin_tool1",
        serverId: "goblin",
        def: {
          name: "tool1",
          description: "A meta tool",
          inputSchema: { type: "object", properties: {} },
        },
      },
      {
        id: "server1_tool1",
        serverId: "server1",
        def: {
          name: "tool1",
          description: "A regular tool",
          inputSchema: { type: "object", properties: {} },
        },
      },
    ];

    const ctx = createMockContext(tools);
    const result = (await catalogList.execute({ serverId: undefined }, ctx)) as {
      tools: Array<{ name: string; serverId: string }>;
    };

    expect(result.tools).toHaveLength(1);
    expect(result.tools[0]?.serverId).toBe("server1");
  });

  test("includes args in response", async () => {
    const tools: ToolEntry[] = [
      {
        id: "server1_tool1",
        serverId: "server1",
        def: {
          name: "tool1",
          description: "A test tool",
          inputSchema: {
            type: "object",
            properties: {
              path: { type: "string" },
              content: { type: "string" },
            },
          },
        },
      },
    ];

    const ctx = createMockContext(tools);
    const result = (await catalogList.execute({ serverId: undefined }, ctx)) as {
      tools: Array<{ args: string[] }>;
    };

    expect(result.tools[0]?.args).toEqual(["path", "content"]);
  });
});

describe("catalogSearch", () => {
  const createMockContext = (
    searchResults: Array<{
      name: string;
      description: string;
      serverId: string;
      score: number;
    }> = [],
  ): MetaToolContext => {
    const mockRegistry = {
      searchTools: mock(() => searchResults),
    } as unknown as MetaToolContext["registry"];

    return {
      registry: mockRegistry,
      config: {} as MetaToolContext["config"],
      router: {} as MetaToolContext["router"],
    } as MetaToolContext;
  };

  test("returns empty array when no results", async () => {
    const ctx = createMockContext([]);
    const result = (await catalogSearch.execute({ query: "test" }, ctx)) as {
      tools: Array<{ name: string }>;
    };
    expect(result.tools).toEqual([]);
  });

  test("filters out meta-tools from results", async () => {
    const searchResults = [
      { name: "goblin_tool", description: "Meta tool", serverId: "goblin", score: 1.0 },
      { name: "server_tool", description: "Regular tool", serverId: "server1", score: 0.9 },
    ];

    const ctx = createMockContext(searchResults);
    const result = (await catalogSearch.execute({ query: "tool" }, ctx)) as {
      tools: Array<{ name: string; serverId: string }>;
    };

    expect(result.tools).toHaveLength(1);
    expect(result.tools[0]?.serverId).toBe("server1");
  });

  test("includes score in results", async () => {
    const searchResults = [
      { name: "tool1", description: "Description", serverId: "server1", score: 0.95 },
    ];

    const ctx = createMockContext(searchResults);
    const result = (await catalogSearch.execute({ query: "test" }, ctx)) as {
      tools: Array<{ score: number }>;
    };

    expect(result.tools[0]?.score).toBe(0.95);
  });

  test("handles empty query", async () => {
    const searchResults = [
      { name: "tool1", description: "Description", serverId: "server1", score: 1.0 },
    ];

    const ctx = createMockContext(searchResults);
    const result = (await catalogSearch.execute({ query: "" }, ctx)) as {
      tools: Array<{ name: string }>;
    };

    expect(result.tools).toHaveLength(1);
  });
});
