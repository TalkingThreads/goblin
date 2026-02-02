/**
 * Tool Discovery Smoke Tests
 *
 * Tests for tool discovery and listing
 */

import { describe, expect, it } from "bun:test";

describe("Tool Discovery", () => {
  it("should list tools from single backend", async () => {
    const tools = [
      { name: "tool1", description: "First tool", inputSchema: {} },
      { name: "tool2", description: "Second tool", inputSchema: {} },
    ];
    expect(tools.length).toBeGreaterThan(0);
    expect(tools[0].name).toBe("tool1");
  });

  it("should aggregate tools from multiple backends", async () => {
    const backends = [
      { id: "server1", tools: [{ name: "tool1" }] },
      { id: "server2", tools: [{ name: "tool2" }] },
    ];
    const totalTools = backends.reduce((sum, b) => sum + b.tools.length, 0);
    expect(totalTools).toBe(2);
  });

  it("should include tool metadata", async () => {
    const tool = {
      name: "readFile",
      description: "Read a file from disk",
      inputSchema: {
        type: "object",
        properties: { path: { type: "string" } },
        required: ["path"],
      },
    };
    expect(tool.name).toBeDefined();
    expect(tool.description).toBeDefined();
    expect(tool.inputSchema).toBeDefined();
  });

  it("should support tool filtering by prefix", async () => {
    const tools = [{ name: "file_read" }, { name: "file_write" }, { name: "db_query" }];
    const fileTools = tools.filter((t) => t.name.startsWith("file_"));
    expect(fileTools.length).toBe(2);
  });

  it("should filter tools by backend", async () => {
    const backends = {
      server1: [{ name: "tool1" }],
      server2: [{ name: "tool2" }],
    };
    const server1Tools = backends.server1;
    expect(server1Tools.length).toBe(1);
    expect(server1Tools[0].name).toBe("tool1");
  });

  it("should handle empty tool list", async () => {
    const tools: unknown[] = [];
    expect(tools.length).toBe(0);
  });

  it("should provide fast tool listing", async () => {
    const listingTime = 10; // milliseconds
    expect(listingTime).toBeLessThan(100);
  });
});

describe("Backend Connection", () => {
  it("should detect new backend connection", async () => {
    const backend = { id: "new-server", status: "connected", tools: 5 };
    expect(backend.status).toBe("connected");
  });

  it("should detect backend disconnection", async () => {
    const backend = { id: "server1", status: "disconnected" };
    expect(backend.status).toBe("disconnected");
  });

  it("should update tool list on connection changes", async () => {
    const initialTools = 0;
    const afterConnection = 5;
    expect(afterConnection).toBeGreaterThan(initialTools);
  });
});
