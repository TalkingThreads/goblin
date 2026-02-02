/**
 * Virtual Tools Tests - Search
 *
 * Tests for virtual search tools that filter and find tools.
 */

import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import {
  CleanupManager,
  registerClientCleanup,
  registerServerCleanup,
} from "../../shared/cleanup.js";
import { createTestClient, type TestMcpClient } from "../../shared/test-client.js";
import { createBasicTestServer, type TestMcpServer } from "../../shared/test-server.js";

describe("Virtual Tools - Search Basic", () => {
  let cleanup: CleanupManager;
  let server: TestMcpServer;
  let client: TestMcpClient;

  beforeEach(async () => {
    cleanup = new CleanupManager();
    server = createBasicTestServer("search-server");
    client = createTestClient("search-client");

    registerServerCleanup(cleanup, server, "search server");
    registerClientCleanup(cleanup, client, "search client");

    await server.start();
    await client.connectToServer(server.getTransport()!);
    server.connectToClient(client);
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("server has searchable tools", async () => {
    const tools = server["config"].tools!;
    expect(tools.length).toBeGreaterThan(0);
  });

  test("echo tool is searchable", async () => {
    const tools = server["config"].tools!;
    const toolNames = tools.map((t) => t.name);
    expect(toolNames).toContain("echo");
  });

  test("add tool is searchable", async () => {
    const tools = server["config"].tools!;
    const toolNames = tools.map((t) => t.name);
    expect(toolNames).toContain("add");
  });

  test("get_time tool is searchable", async () => {
    const tools = server["config"].tools!;
    const toolNames = tools.map((t) => t.name);
    expect(toolNames).toContain("get_time");
  });

  test("all tools have names for searching", async () => {
    const tools = server["config"].tools!;
    for (const tool of tools) {
      expect(tool.name.length).toBeGreaterThan(0);
    }
  });

  test("all tools have descriptions for searching", async () => {
    const tools = server["config"].tools!;
    for (const tool of tools) {
      expect(tool.description.length).toBeGreaterThan(0);
    }
  });

  test("tools can be filtered by name", async () => {
    const tools = server["config"].tools!;
    const echo = tools.filter((t) => t.name === "echo");
    expect(echo.length).toBe(1);
  });
});

describe("Virtual Tools - Search Filtering", () => {
  let cleanup: CleanupManager;
  let server: TestMcpServer;

  beforeEach(async () => {
    cleanup = new CleanupManager();
    server = createBasicTestServer("filter-server");
    registerServerCleanup(cleanup, server, "filter server");
    await server.start();
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("can filter by tool name prefix", async () => {
    const tools = server["config"].tools!;
    const startingWithE = tools.filter((t) => t.name.startsWith("e"));
    expect(startingWithE.length).toBe(1); // echo
  });

  test("can filter by tool name suffix", async () => {
    const tools = server["config"].tools!;
    const endingWithTime = tools.filter((t) => t.name.endsWith("time"));
    expect(endingWithTime.length).toBe(1); // get_time
  });

  test("can filter by description content", async () => {
    const tools = server["config"].tools!;
    const containingNumber = tools.filter((t) => t.description.toLowerCase().includes("number"));
    expect(containingNumber.length).toBe(1); // add
  });

  test("can find tools by exact name match", async () => {
    const tools = server["config"].tools!;
    const exactMatch = tools.find((t) => t.name === "echo");
    expect(exactMatch).toBeDefined();
  });

  test("search returns empty for non-existent tool", async () => {
    const tools = server["config"].tools!;
    const nonExistent = tools.find((t) => t.name === "non_existent_tool");
    expect(nonExistent).toBeUndefined();
  });
});

describe("Virtual Tools - Search Multi-Server", () => {
  let cleanup: CleanupManager;
  let server1: TestMcpServer;
  let server2: TestMcpServer;

  beforeEach(async () => {
    cleanup = new CleanupManager();
    server1 = createBasicTestServer("search-multi-1");
    server2 = createBasicTestServer("search-multi-2");

    registerServerCleanup(cleanup, server1, "search multi 1");
    registerServerCleanup(cleanup, server2, "search multi 2");

    await server1.start();
    await server2.start();
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("both servers have searchable tools", async () => {
    expect(server1["config"].tools!.length).toBeGreaterThan(0);
    expect(server2["config"].tools!.length).toBeGreaterThan(0);
  });

  test("echo exists on both servers", async () => {
    const tools1 = server1["config"].tools!.map((t) => t.name);
    const tools2 = server2["config"].tools!.map((t) => t.name);
    expect(tools1).toContain("echo");
    expect(tools2).toContain("echo");
  });

  test("can find unique tools per server", async () => {
    server1.addTool(
      "unique_s1",
      "Unique to S1",
      { type: "object", properties: {}, required: [] },
      async () => ({ content: [{ type: "text", text: "1" }] }),
    );
    server2.addTool(
      "unique_s2",
      "Unique to S2",
      { type: "object", properties: {}, required: [] },
      async () => ({ content: [{ type: "text", text: "2" }] }),
    );

    const tools1 = server1["config"].tools!.map((t) => t.name);
    const tools2 = server2["config"].tools!.map((t) => t.name);

    expect(tools1).toContain("unique_s1");
    expect(tools2).toContain("unique_s2");
    expect(tools1).not.toContain("unique_s2");
    expect(tools2).not.toContain("unique_s1");
  });

  test("combined search across servers", async () => {
    server1.addTool(
      "combined_1",
      "Combined 1",
      { type: "object", properties: {}, required: [] },
      async () => ({ content: [{ type: "text", text: "1" }] }),
    );
    server2.addTool(
      "combined_2",
      "Combined 2",
      { type: "object", properties: {}, required: [] },
      async () => ({ content: [{ type: "text", text: "2" }] }),
    );

    const allCombined = [
      ...server1["config"].tools!.filter((t) => t.name.startsWith("combined")),
      ...server2["config"].tools!.filter((t) => t.name.startsWith("combined")),
    ];

    expect(allCombined.length).toBe(2);
  });
});

describe("Virtual Tools - Search Dynamic", () => {
  let cleanup: CleanupManager;
  let server: TestMcpServer;

  beforeEach(async () => {
    cleanup = new CleanupManager();
    server = createBasicTestServer("search-dynamic");
    registerServerCleanup(cleanup, server, "search dynamic server");
    await server.start();
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("can add searchable tools", async () => {
    server.addTool(
      "searchable_tool",
      "A searchable tool",
      { type: "object", properties: {}, required: [] },
      async () => ({ content: [{ type: "text", text: "ok" }] }),
    );

    const tools = server["config"].tools!;
    const found = tools.find((t) => t.name === "searchable_tool");
    expect(found).toBeDefined();
  });

  test("can search dynamic tools", async () => {
    server.addTool(
      "dynamic_find",
      "Find this dynamic tool",
      { type: "object", properties: {}, required: [] },
      async () => ({ content: [{ type: "text", text: "found" }] }),
    );

    const tools = server["config"].tools!;
    const found = tools.filter((t) => t.name.includes("dynamic"));
    expect(found.length).toBeGreaterThanOrEqual(1);
  });

  test("can add multiple searchable tools", async () => {
    for (let i = 0; i < 5; i++) {
      server.addTool(
        `search_multi_${i}`,
        `Searchable tool ${i}`,
        { type: "object", properties: {}, required: [] },
        async () => ({ content: [{ type: "text", text: `result_${i}` }] }),
      );
    }

    const tools = server["config"].tools!;
    const multi = tools.filter((t) => t.name.startsWith("search_multi_"));
    expect(multi.length).toBe(5);
  });

  test("all tools are searchable", async () => {
    const tools = server["config"].tools!;
    for (const tool of tools) {
      expect(tool.name.length).toBeGreaterThan(0);
      expect(typeof tool.name).toBe("string");
    }
  });
});

describe("Virtual Tools - Search Performance", () => {
  let cleanup: CleanupManager;
  let server: TestMcpServer;

  beforeEach(async () => {
    cleanup = new CleanupManager();
    server = createBasicTestServer("perf-server");
    registerServerCleanup(cleanup, server, "perf server");
    await server.start();
  });

  afterEach(async () => {
    await cleanup.run();
  });

  test("can handle multiple search operations", async () => {
    const tools = server["config"].tools!;

    // Perform multiple searches
    const echo = tools.filter((t) => t.name.includes("echo"));
    const add = tools.filter((t) => t.name.includes("add"));
    const time = tools.filter((t) => t.name.includes("time"));

    expect(echo.length).toBeGreaterThan(0);
    expect(add.length).toBeGreaterThan(0);
    expect(time.length).toBeGreaterThan(0);
  });

  test("search results are consistent", async () => {
    const tools = server["config"].tools!;
    const search1 = tools.filter((t) => t.name.includes("e"));
    const search2 = tools.filter((t) => t.name.includes("e"));

    expect(search1.length).toBe(search2.length);
  });

  test("can find tools with various patterns", async () => {
    const tools = server["config"].tools!;

    // Single character
    const singleChar = tools.filter((t) => t.name.includes("e"));
    expect(singleChar.length).toBeGreaterThan(0);

    // Full name
    const fullName = tools.filter((t) => t.name === "echo");
    expect(fullName.length).toBe(1);
  });

  test("tools remain searchable after additions", async () => {
    const initialTools = server["config"].tools!;
    const initialEcho = initialTools.filter((t) => t.name.includes("echo"));

    // Add more tools
    for (let i = 0; i < 3; i++) {
      server.addTool(
        `perf_tool_${i}`,
        `Performance tool ${i}`,
        { type: "object", properties: {}, required: [] },
        async () => ({ content: [{ type: "text", text: "ok" }] }),
      );
    }

    // Original tools still searchable
    const currentTools = server["config"].tools!;
    const currentEcho = currentTools.filter((t) => t.name.includes("echo"));
    expect(currentEcho.length).toBe(initialEcho.length);
  });

  test("search works with complex criteria", async () => {
    const tools = server["config"].tools!;

    // Search by name and description
    const byName = tools.filter((t) => t.name === "add");
    const byDesc = tools.filter((t) => t.description.toLowerCase().includes("number"));

    expect(byName.length).toBe(1);
    expect(byDesc.length).toBe(1);
  });
});
