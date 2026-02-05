/**
 * Real Backend Tests - Streamable HTTP Transport
 *
 * Tests against mock Streamable HTTP MCP server for authentic validation
 * without requiring external MCP server dependencies.
 */

import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { MockStreamableHttpServer } from "../shared/mock-streamable-http-server.js";

function getSessionId(response: Response): string | undefined {
  const header = response.headers.get("mcp-session-id");
  return header === null ? undefined : header;
}

function requireSessionId(response: Response): string {
  const sessionId = getSessionId(response);
  expect(sessionId).toBeTruthy();
  return sessionId as string;
}

describe("Real Backends - Streamable HTTP Transport", () => {
  let mockServer: MockStreamableHttpServer;

  beforeEach(async () => {
    mockServer = new MockStreamableHttpServer({ port: 0 });
    await mockServer.start();
  });

  afterEach(async () => {
    await mockServer.stop();
  });

  test("server can start and stop", async () => {
    expect(mockServer.portNumber).toBeGreaterThan(0);
    expect(mockServer.activeSessions).toBe(0);
    expect(mockServer.requestCountTotal).toBe(0);
  });

  test("server accepts initialize request", async () => {
    const response = await fetch(`http://localhost:${mockServer.portNumber}/mcp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2025-11-05",
          capabilities: {},
          clientInfo: { name: "test-client", version: "1.0.0" },
        },
      }),
    });

    expect(response.status).toBe(200);
    requireSessionId(response);

    const data = await response.json();
    expect(data.jsonrpc).toBe("2.0");
    expect(data.id).toBe(1);
    expect(data.result).toHaveProperty("protocolVersion", "2025-11-05");
    expect(data.result).toHaveProperty("serverInfo");
    expect(data.result.serverInfo.name).toBe("mock-mcp-server");
  });

  test("server creates unique session IDs", async () => {
    const response1 = await fetch(`http://localhost:${mockServer.portNumber}/mcp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2025-11-05",
          capabilities: {},
          clientInfo: { name: "test", version: "1.0" },
        },
      }),
    });

    const response2 = await fetch(`http://localhost:${mockServer.portNumber}/mcp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 2,
        method: "initialize",
        params: {
          protocolVersion: "2025-11-05",
          capabilities: {},
          clientInfo: { name: "test", version: "1.0" },
        },
      }),
    });

    const sessionId1 = getSessionId(response1);
    const sessionId2 = getSessionId(response2);

    expect(sessionId1).toBeTruthy();
    expect(sessionId2).toBeTruthy();
    expect(sessionId1).not.toBe(sessionId2);
    expect(mockServer.activeSessions).toBe(2);
  });

  test("server maintains session with mcp-session-id header", async () => {
    const initResponse = await fetch(`http://localhost:${mockServer.portNumber}/mcp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2025-11-05",
          capabilities: {},
          clientInfo: { name: "test", version: "1.0" },
        },
      }),
    });

    const sessionId = requireSessionId(initResponse);

    const pingResponse = await fetch(`http://localhost:${mockServer.portNumber}/mcp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "mcp-session-id": sessionId,
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 2,
        method: "ping",
        params: {},
      }),
    });

    expect(pingResponse.status).toBe(200);
    const pingData = await pingResponse.json();
    expect(pingData.jsonrpc).toBe("2.0");
    expect(pingData.id).toBe(2);
  });

  test("server returns tools list", async () => {
    const initResponse = await fetch(`http://localhost:${mockServer.portNumber}/mcp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2025-11-05",
          capabilities: {},
          clientInfo: { name: "test", version: "1.0" },
        },
      }),
    });

    const sessionId = requireSessionId(initResponse);

    const toolsResponse = await fetch(`http://localhost:${mockServer.portNumber}/mcp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "mcp-session-id": sessionId,
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 2,
        method: "tools/list",
        params: {},
      }),
    });

    expect(toolsResponse.status).toBe(200);
    const toolsData = await toolsResponse.json();
    expect(toolsData.result.tools).toBeInstanceOf(Array);
    expect(toolsData.result.tools.length).toBeGreaterThan(0);
    expect(toolsData.result.tools[0].name).toBe("mock_tool");
  });

  test("server handles tool calls", async () => {
    const initResponse = await fetch(`http://localhost:${mockServer.portNumber}/mcp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2025-11-05",
          capabilities: {},
          clientInfo: { name: "test", version: "1.0" },
        },
      }),
    });

    const sessionId = requireSessionId(initResponse);

    const callResponse = await fetch(`http://localhost:${mockServer.portNumber}/mcp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "mcp-session-id": sessionId,
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 2,
        method: "tools/call",
        params: {
          name: "mock_tool",
          arguments: { message: "Hello World" },
        },
      }),
    });

    expect(callResponse.status).toBe(200);
    const callData = await callResponse.json();
    expect(callData.result.content[0].text).toContain("Hello World");
  });

  test("server returns resources list", async () => {
    const initResponse = await fetch(`http://localhost:${mockServer.portNumber}/mcp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2025-11-05",
          capabilities: {},
          clientInfo: { name: "test", version: "1.0" },
        },
      }),
    });

    const sessionId = requireSessionId(initResponse);

    const resourcesResponse = await fetch(`http://localhost:${mockServer.portNumber}/mcp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "mcp-session-id": sessionId,
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 2,
        method: "resources/list",
        params: {},
      }),
    });

    expect(resourcesResponse.status).toBe(200);
    const resourcesData = await resourcesResponse.json();
    expect(resourcesData.result.resources).toBeInstanceOf(Array);
    expect(resourcesData.result.resources[0].uri).toBe("mock://resource/test");
  });

  test("server returns prompts list", async () => {
    const initResponse = await fetch(`http://localhost:${mockServer.portNumber}/mcp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2025-11-05",
          capabilities: {},
          clientInfo: { name: "test", version: "1.0" },
        },
      }),
    });

    const sessionId = requireSessionId(initResponse);

    const promptsResponse = await fetch(`http://localhost:${mockServer.portNumber}/mcp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "mcp-session-id": sessionId,
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 2,
        method: "prompts/list",
        params: {},
      }),
    });

    expect(promptsResponse.status).toBe(200);
    const promptsData = await promptsResponse.json();
    expect(promptsData.result.prompts).toBeInstanceOf(Array);
    expect(promptsData.result.prompts[0].name).toBe("mock_prompt");
  });

  test("server rejects invalid session", async () => {
    const pingResponse = await fetch(`http://localhost:${mockServer.portNumber}/mcp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "mcp-session-id": "invalid-session-id",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "ping",
        params: {},
      }),
    });

    expect(pingResponse.status).toBe(404);
  });
});

describe("Real Backends - Streamable HTTP Configuration", () => {
  test("can create mock server with custom port", async () => {
    const mockServer = new MockStreamableHttpServer({ port: 9999 });
    await mockServer.start();
    expect(mockServer.portNumber).toBe(9999);
    await mockServer.stop();
  });

  test("can create mock server with response delay", async () => {
    const mockServer = new MockStreamableHttpServer({ port: 0, responseDelay: 100 });
    await mockServer.start();
    const start = Date.now();
    await fetch(`http://localhost:${mockServer.portNumber}/mcp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2025-11-05",
          capabilities: {},
          clientInfo: { name: "test", version: "1.0" },
        },
      }),
    });
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(100);
    await mockServer.stop();
  });

  test("mock server tracks request count", async () => {
    const mockServer = new MockStreamableHttpServer({ port: 0 });
    await mockServer.start();

    await fetch(`http://localhost:${mockServer.portNumber}/mcp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2025-11-05",
          capabilities: {},
          clientInfo: { name: "test", version: "1.0" },
        },
      }),
    });

    await fetch(`http://localhost:${mockServer.portNumber}/mcp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 2,
        method: "ping",
        params: {},
      }),
    });

    expect(mockServer.requestCountTotal).toBe(2);
    await mockServer.stop();
  });

  test("mock server reset clears sessions", async () => {
    const mockServer = new MockStreamableHttpServer({ port: 0 });
    await mockServer.start();

    const response = await fetch(`http://localhost:${mockServer.portNumber}/mcp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2025-11-05",
          capabilities: {},
          clientInfo: { name: "test", version: "1.0" },
        },
      }),
    });

    expect(response.status).toBe(200);
    expect(mockServer.activeSessions).toBe(1);

    mockServer.reset();

    expect(mockServer.activeSessions).toBe(0);
    await mockServer.stop();
  });
});

describe("Real Backends - Streamable HTTP Headers", () => {
  test("handles requests with Bearer token header", async () => {
    const mockServer = new MockStreamableHttpServer({ port: 0 });
    await mockServer.start();

    const response = await fetch(`http://localhost:${mockServer.portNumber}/mcp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer test-token-123",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2025-11-05",
          capabilities: {},
          clientInfo: { name: "test", version: "1.0" },
        },
      }),
    });

    expect(response.status).toBe(200);
    await mockServer.stop();
  });

  test("handles requests with multiple custom headers", async () => {
    const mockServer = new MockStreamableHttpServer({ port: 0 });
    await mockServer.start();

    const response = await fetch(`http://localhost:${mockServer.portNumber}/mcp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Custom-Header": "custom-value",
        "X-Request-ID": "req-12345",
        "X-Client-Version": "1.0.0",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2025-11-05",
          capabilities: {},
          clientInfo: { name: "test", version: "1.0" },
        },
      }),
    });

    expect(response.status).toBe(200);
    await mockServer.stop();
  });
});

describe("Real Backends - Streamable HTTP Calculator Tool", () => {
  test("calculator tool handles addition", async () => {
    const mockServer = new MockStreamableHttpServer({ port: 0 });
    await mockServer.start();

    const initResponse = await fetch(`http://localhost:${mockServer.portNumber}/mcp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2025-11-05",
          capabilities: {},
          clientInfo: { name: "test", version: "1.0" },
        },
      }),
    });

    const sessionId = requireSessionId(initResponse);

    const calcResponse = await fetch(`http://localhost:${mockServer.portNumber}/mcp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "mcp-session-id": sessionId,
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 2,
        method: "tools/call",
        params: {
          name: "mock_calculator",
          arguments: { a: 10, b: 5 },
        },
      }),
    });

    const calcData = await calcResponse.json();
    expect(calcData.result.content[0].text).toContain("15");
    await mockServer.stop();
  });
});
