import { describe, test, expect } from "bun:test";
import type { ToolCard } from "../../../src/gateway/types.js";

const mockTools: ToolCard[] = [
  {
    name: "get_time",
    description: "Get the current time",
    serverId: "time-server",
  },
  {
    name: "read_file",
    description: "Read a file from disk",
    serverId: "filesystem",
  },
  {
    name: "search",
    description: "Search for content",
    serverId: "search-server",
  },
];

describe("ToolCard type", () => {
  test("tool with all properties", () => {
    const tool: ToolCard = {
      name: "test-tool",
      description: "A test tool",
      serverId: "test-server",
    };

    expect(tool.name).toBe("test-tool");
    expect(tool.description).toBe("A test tool");
    expect(tool.serverId).toBe("test-server");
  });

  test("tool without description", () => {
    const tool: ToolCard = {
      name: "minimal-tool",
      serverId: "minimal-server",
    };

    expect(tool.name).toBe("minimal-tool");
    expect(tool.description).toBeUndefined();
    expect(tool.serverId).toBe("minimal-server");
  });
});

describe("Mock tools data", () => {
  test("mockTools array has correct length", () => {
    expect(mockTools.length).toBe(3);
  });

  test("mockTools contains get_time tool", () => {
    const getTimeTool = mockTools.find((t) => t.name === "get_time");
    expect(getTimeTool).toBeDefined();
    expect(getTimeTool?.description).toBe("Get the current time");
    expect(getTimeTool?.serverId).toBe("time-server");
  });

  test("mockTools contains read_file tool", () => {
    const readFileTool = mockTools.find((t) => t.name === "read_file");
    expect(readFileTool).toBeDefined();
    expect(readFileTool?.description).toBe("Read a file from disk");
    expect(readFileTool?.serverId).toBe("filesystem");
  });

  test("mockTools contains search tool", () => {
    const searchTool = mockTools.find((t) => t.name === "search");
    expect(searchTool).toBeDefined();
    expect(searchTool?.description).toBe("Search for content");
    expect(searchTool?.serverId).toBe("search-server");
  });

  test("all tools have unique names", () => {
    const names = mockTools.map((t) => t.name);
    const uniqueNames = new Set(names);
    expect(uniqueNames.size).toBe(names.length);
  });

  test("tools span multiple servers", () => {
    const servers = new Set(mockTools.map((t) => t.serverId));
    expect(servers.size).toBeGreaterThan(1);
  });
});

describe("Tool invocation validation", () => {
  test("valid JSON args parse correctly", () => {
    const validArgs = '{"path": "/etc/hosts"}';
    const parsed = JSON.parse(validArgs);
    expect(parsed.path).toBe("/etc/hosts");
  });

  test("empty object args parse correctly", () => {
    const emptyArgs = "{}";
    const parsed = JSON.parse(emptyArgs);
    expect(Object.keys(parsed)).toHaveLength(0);
  });

  test("invalid JSON throws error", () => {
    const invalidArgs = "{invalid json}";
    expect(() => JSON.parse(invalidArgs)).toThrow();
  });

  test("nested JSON args parse correctly", () => {
    const nestedArgs = '{"query": "test", "options": {"limit": 10, "offset": 0}}';
    const parsed = JSON.parse(nestedArgs);
    expect(parsed.query).toBe("test");
    expect(parsed.options.limit).toBe(10);
    expect(parsed.options.offset).toBe(0);
  });
});

describe("Tool selection state", () => {
  test("initial selection is first tool", () => {
    const initialIndex = 0;
    expect(mockTools[initialIndex].name).toBe("get_time");
  });

  test("navigation wraps around at boundaries", () => {
    const length = mockTools.length;

    const nextIndex = (current: number) => (current < length - 1 ? current + 1 : 0);
    const prevIndex = (current: number) => (current > 0 ? current - 1 : length - 1);

    expect(nextIndex(0)).toBe(1);
    expect(nextIndex(length - 1)).toBe(0);
    expect(prevIndex(0)).toBe(length - 1);
    expect(prevIndex(length - 1)).toBe(length - 2);
  });
});
