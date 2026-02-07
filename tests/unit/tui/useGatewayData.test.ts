import { describe, expect, test } from "bun:test";
import type { PromptEntry, ResourceEntry, ToolCard } from "../../../src/gateway/types.js";
import type { LogEntry, ServerStatus } from "../../../src/tui/hooks/useGatewayData.js";

/**
 * Pure filtering functions (extracted from hooks for testability)
 */
function filterTools(
  tools: ToolCard[],
  filterServer: string | null,
  searchQuery: string,
): ToolCard[] {
  let result = tools;

  if (filterServer) {
    result = result.filter((t) => t.serverId === filterServer);
  }

  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    result = result.filter(
      (t) =>
        t.name.toLowerCase().includes(query) ||
        (t.description?.toLowerCase().includes(query) ?? false),
    );
  }

  return result;
}

function filterPrompts(
  prompts: PromptEntry[],
  filterServer: string | null,
  searchQuery: string,
): PromptEntry[] {
  let result = prompts;

  if (filterServer) {
    result = result.filter((p) => p.serverId === filterServer);
  }

  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    result = result.filter(
      (p) =>
        p.id.toLowerCase().includes(query) ||
        (p.def.description?.toLowerCase().includes(query) ?? false),
    );
  }

  return result;
}

function filterResources(
  resources: ResourceEntry[],
  filterServer: string | null,
  filterMimeType: string | null,
  searchQuery: string,
): ResourceEntry[] {
  let result = resources;

  if (filterServer) {
    result = result.filter((r) => r.serverId === filterServer);
  }

  if (filterMimeType) {
    result = result.filter((r) => r.def.mimeType === filterMimeType);
  }

  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    result = result.filter(
      (r) =>
        (r.def.name?.toLowerCase().includes(query) ?? false) ||
        (r.def.description?.toLowerCase().includes(query) ?? false) ||
        r.def.uri.toLowerCase().includes(query),
    );
  }

  return result;
}

describe("filterTools", () => {
  const mockTools: ToolCard[] = [
    { name: "readFile", description: "Read a file from disk", serverId: "server1" },
    { name: "writeFile", description: "Write a file to disk", serverId: "server1" },
    { name: "searchWeb", description: "Search the web", serverId: "server2" },
    { name: "listDir", description: "List directory contents", serverId: "server1" },
  ];

  test("should return all tools when no filters applied", () => {
    const result = filterTools(mockTools, null, "");
    expect(result.length).toBe(4);
  });

  test("should filter tools by server", () => {
    const result = filterTools(mockTools, "server1", "");
    expect(result.length).toBe(3);
    expect(result.every((t) => t.serverId === "server1")).toBe(true);
  });

  test("should filter tools by search query", () => {
    const result = filterTools(mockTools, null, "file");
    expect(result.length).toBe(2);
    expect(result.every((t) => t.name.toLowerCase().includes("file"))).toBe(true);
  });

  test("should combine server and search filters", () => {
    const result = filterTools(mockTools, "server1", "read");
    expect(result.length).toBe(1);
    expect(result[0].name).toBe("readFile");
  });

  test("should return empty array when no matches", () => {
    const result = filterTools(mockTools, "server2", "file");
    expect(result.length).toBe(0);
  });

  test("should be case insensitive for search", () => {
    const result = filterTools(mockTools, null, "READ");
    expect(result.length).toBe(1);
    expect(result[0].name).toBe("readFile");
  });

  test("should search in description", () => {
    const result = filterTools(mockTools, null, "directory");
    expect(result.length).toBe(1);
    expect(result[0].name).toBe("listDir");
  });

  test("should handle tools without description", () => {
    const toolsWithNullDesc: ToolCard[] = [
      { name: "tool1", description: undefined, serverId: "server1" },
    ];
    const result = filterTools(toolsWithNullDesc, null, "tool1");
    expect(result.length).toBe(1);
  });
});

describe("filterPrompts", () => {
  const mockPrompts: PromptEntry[] = [
    {
      id: "server1_codeReview",
      def: { name: "codeReview", description: "Review code for bugs", arguments: [] },
      serverId: "server1",
    },
    {
      id: "server1_docGen",
      def: { name: "docGen", description: "Generate documentation", arguments: [] },
      serverId: "server1",
    },
    {
      id: "server2_prReview",
      def: { name: "prReview", description: "Review pull requests", arguments: [] },
      serverId: "server2",
    },
  ];

  test("should return all prompts when no filters applied", () => {
    const result = filterPrompts(mockPrompts, null, "");
    expect(result.length).toBe(3);
  });

  test("should filter prompts by server", () => {
    const result = filterPrompts(mockPrompts, "server1", "");
    expect(result.length).toBe(2);
    expect(result.every((p) => p.serverId === "server1")).toBe(true);
  });

  test("should filter prompts by search query", () => {
    const result = filterPrompts(mockPrompts, null, "review");
    expect(result.length).toBe(2);
  });

  test("should search in prompt description", () => {
    const result = filterPrompts(mockPrompts, null, "bugs");
    expect(result.length).toBe(1);
    expect(result[0].id).toBe("server1_codeReview");
  });

  test("should search in prompt ID", () => {
    const result = filterPrompts(mockPrompts, null, "prReview");
    expect(result.length).toBe(1);
    expect(result[0].serverId).toBe("server2");
  });

  test("should handle prompts without description", () => {
    const promptsWithNullDesc: PromptEntry[] = [
      {
        id: "server1_simple",
        def: { name: "simple", description: undefined, arguments: [] },
        serverId: "server1",
      },
    ];
    const result = filterPrompts(promptsWithNullDesc, null, "simple");
    expect(result.length).toBe(1);
  });
});

describe("filterResources", () => {
  const mockResources: ResourceEntry[] = [
    {
      def: {
        uri: "file:///readme.md",
        name: "README.md",
        description: "Project readme",
        mimeType: "text/markdown",
      },
      serverId: "server1",
    },
    {
      def: {
        uri: "file:///config.json",
        name: "config.json",
        description: "Configuration file",
        mimeType: "application/json",
      },
      serverId: "server1",
    },
    {
      def: {
        uri: "https://api.example.com",
        name: "API",
        description: "API endpoint",
        mimeType: "application/json",
      },
      serverId: "server2",
    },
    {
      def: {
        uri: "file:///data.csv",
        name: "data.csv",
        description: "CSV data",
        mimeType: "text/csv",
      },
      serverId: "server1",
    },
  ];

  test("should return all resources when no filters applied", () => {
    const result = filterResources(mockResources, null, null, "");
    expect(result.length).toBe(4);
  });

  test("should filter resources by server", () => {
    const result = filterResources(mockResources, "server1", null, "");
    expect(result.length).toBe(3);
    expect(result.every((r) => r.serverId === "server1")).toBe(true);
  });

  test("should filter resources by MIME type", () => {
    const result = filterResources(mockResources, null, "application/json", "");
    expect(result.length).toBe(2);
    expect(result.every((r) => r.def.mimeType === "application/json")).toBe(true);
  });

  test("should combine all filters", () => {
    const result = filterResources(mockResources, "server1", "text/markdown", "");
    expect(result.length).toBe(1);
    expect(result[0].def.name).toBe("README.md");
  });

  test("should filter by search query in name", () => {
    const result = filterResources(mockResources, null, null, "readme");
    expect(result.length).toBe(1);
    expect(result[0].def.name).toBe("README.md");
  });

  test("should filter by search query in URI", () => {
    const result = filterResources(mockResources, null, null, "api.example.com");
    expect(result.length).toBe(1);
    expect(result[0].serverId).toBe("server2");
  });

  test("should filter by search query in description", () => {
    const result = filterResources(mockResources, null, null, "configuration");
    expect(result.length).toBe(1);
    expect(result[0].def.name).toBe("config.json");
  });

  test("should filter resources even when name is short", () => {
    const resourcesShortName: ResourceEntry[] = [
      {
        def: { uri: "file:///a.md", name: "A", description: "Test", mimeType: "text/markdown" },
        serverId: "server1",
      },
    ];
    const result = filterResources(resourcesShortName, null, null, "a");
    expect(result.length).toBe(1);
  });
});

describe("ServerStatus interface", () => {
  test("should have correct structure for online server", () => {
    const server: ServerStatus = {
      id: "test-server",
      name: "Test Server",
      transport: "stdio",
      status: "online",
      tools: 5,
      enabled: true,
    };

    expect(server.id).toBe("test-server");
    expect(server.name).toBe("Test Server");
    expect(server.transport).toBe("stdio");
    expect(server.status).toBe("online");
    expect(server.tools).toBe(5);
    expect(server.enabled).toBe(true);
  });

  test("should support offline status", () => {
    const server: ServerStatus = {
      id: "test-server",
      name: "Test Server",
      transport: "sse",
      status: "offline",
      tools: 0,
      enabled: true,
    };

    expect(server.status).toBe("offline");
    expect(server.tools).toBe(0);
  });

  test("should support http transport type", () => {
    const server: ServerStatus = {
      id: "test-server",
      name: "Test Server",
      transport: "http",
      status: "online",
      tools: 10,
      enabled: true,
    };

    expect(server.transport).toBe("http");
  });

  test("should handle various tool counts", () => {
    const server1: ServerStatus = {
      id: "s1",
      name: "S1",
      transport: "stdio",
      status: "online",
      tools: 0,
      enabled: true,
    };
    const server2: ServerStatus = {
      id: "s2",
      name: "S2",
      transport: "stdio",
      status: "online",
      tools: 100,
      enabled: true,
    };

    expect(server1.tools).toBe(0);
    expect(server2.tools).toBe(100);
  });

  test("should support disabled servers", () => {
    const server: ServerStatus = {
      id: "disabled-server",
      name: "Disabled Server",
      transport: "stdio",
      status: "offline",
      tools: 5,
      enabled: false,
    };

    expect(server.enabled).toBe(false);
  });
});

describe("LogEntry interface", () => {
  test("should have correct structure for info level", () => {
    const log: LogEntry = {
      timestamp: new Date("2026-01-01T12:00:00Z"),
      message: "Server connected",
      level: "info",
    };

    expect(log.message).toBe("Server connected");
    expect(log.level).toBe("info");
    expect(log.timestamp.toISOString()).toBe("2026-01-01T12:00:00.000Z");
  });

  test("should support all log levels", () => {
    const levels: LogEntry["level"][] = ["info", "warn", "error", "debug"];

    levels.forEach((level) => {
      const log: LogEntry = {
        timestamp: new Date(),
        message: `Test ${level} message`,
        level,
      };
      expect(log.level).toBe(level);
    });
  });

  test("should handle warning level", () => {
    const log: LogEntry = {
      timestamp: new Date(),
      message: "High latency detected",
      level: "warn",
    };

    expect(log.level).toBe("warn");
  });

  test("should handle error level", () => {
    const log: LogEntry = {
      timestamp: new Date(),
      message: "Connection failed",
      level: "error",
    };

    expect(log.level).toBe("error");
  });

  test("should handle debug level", () => {
    const log: LogEntry = {
      timestamp: new Date(),
      message: "Debug information",
      level: "debug",
    };

    expect(log.level).toBe("debug");
  });

  test("should handle empty message", () => {
    const log: LogEntry = {
      timestamp: new Date(),
      message: "",
      level: "info",
    };

    expect(log.message).toBe("");
  });

  test("should handle very long messages", () => {
    const longMessage = "A".repeat(10000);
    const log: LogEntry = {
      timestamp: new Date(),
      message: longMessage,
      level: "info",
    };

    expect(log.message.length).toBe(10000);
  });
});
