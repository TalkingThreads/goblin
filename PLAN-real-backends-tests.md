# Real-Backends Test Implementation Plan

## Current State

The E2E real-backends tests for Streamable HTTP are **partially implemented**:
- Test infrastructure exists (`tests/e2e/shared/real-server.ts`, `environment.ts`)
- Basic Streamable HTTP E2E tests created (`tests/e2e/real-backends/streamable-http.test.ts`)
- Tests exist but require actual MCP servers to run

## Limitations

1. **Real MCP servers require external dependencies**:
   - `@modelcontextprotocol/server-filesystem` package
   - Valid temp directories accessible by the server process
   - Network connectivity for HTTP-based servers

2. **Current test status**:
   - 9 tests pass (configuration, infrastructure tests)
   - 3 tests fail (attempting to start real servers)

## Implementation Plan

### Option 1: Mock Streamable HTTP Server (Recommended)

Create a lightweight mock Streamable HTTP server for testing:

```typescript
// tests/e2e/shared/mock-streamable-http-server.ts

import { createServer } from "node:http";
import { crypto } from "node:crypto";

export class MockStreamableHttpServer {
  private server: ReturnType<typeof createServer>;
  private sessionIds: Map<string, { lastActivity: number }> = new Map();

  constructor(private port: number) {
    this.server = createServer(async (req, res) => {
      if (req.url === "/mcp" && req.method === "POST") {
        await this.handleMcpRequest(req, res);
      } else {
        res.writeHead(404);
        res.end();
      }
    });
  }

  async start(): Promise<void> {
    return new Promise((resolve) => {
      this.server.listen(this.port, () => resolve());
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve) => {
      this.server.close(() => resolve());
    });
  }

  private async handleMcpRequest(req: any, res: any): Promise<void> {
    const sessionId = req.headers["mcp-session-id"];
    let body = "";
    req.on("data", (chunk: Buffer) => (body += chunk.toString()));
    req.on("end", () => {
      const request = JSON.parse(body);
      if (request.method === "initialize") {
        const newSessionId = sessionId || crypto.randomUUID();
        this.sessionIds.set(newSessionId, { lastActivity: Date.now() });
        res.writeHead(200, {
          "Content-Type": "application/json",
          "mcp-session-id": newSessionId,
        });
        res.end(
          JSON.stringify({
            jsonrpc: "2.0",
            id: request.id,
            result: {
              protocolVersion: "2025-11-05",
              capabilities: { tools: {}, resources: {}, prompts: {} },
              serverInfo: { name: "mock-server", version: "1.0.0" },
            },
          }),
        );
      } else if (request.method === "ping") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ jsonrpc: "2.0", id: request.id, result: {} }));
      }
    });
  }
}
```

### Option 2: Enable Tests with Skip Conditions

Keep existing tests but mark them with proper skip conditions:

```typescript
describe("Real Backends - Streamable HTTP Transport", () => {
  let server: MockStreamableHttpServer;

  beforeAll(async () => {
    const { MockStreamableHttpServer } = await import("../shared/mock-server.js");
    server = new MockStreamableHttpServer(3005);
    await server.start();
  });

  afterAll(async () => {
    await server.stop();
  });

  test("can connect to streamablehttp server", async () => {
    const response = await fetch("http://localhost:3005/mcp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: { protocolVersion: "2025-11-05", capabilities: {}, clientInfo: { name: "test", version: "1.0" } },
      }),
    });
    expect(response.status).toBe(200);
    expect(response.headers.get("mcp-session-id")).toBeDefined();
  });
});
```

## Implementation Tasks

### Task 1: Create Mock Streamable HTTP Server
- Location: `tests/e2e/shared/mock-streamable-http-server.ts`
- Features:
  - Basic MCP protocol handling
  - Session creation and management
  - Ping/pong support
  - Configurable response delays

### Task 2: Update E2E Tests
- Location: `tests/e2e/real-backends/streamable-http.test.ts`
- Changes:
  - Replace real server spawning with mock server
  - Add tests for session lifecycle
  - Add tests for headers authentication
  - Add tests for multiple concurrent sessions

### Task 3: Integration Tests
- Location: `tests/integration/transport/streamable-http.test.ts`
- Add:
  - Gateway-to-mock-server integration tests
  - Full request/response cycle tests
  - Error handling tests

## Estimated Effort

| Task | Effort | Priority |
|------|--------|----------|
| Create mock server | 2-3 hours | High |
| Update E2E tests | 1-2 hours | High |
| Add integration tests | 1-2 hours | Medium |

## Alternative: Use SDK Test Fixtures

The MCP SDK may have built-in test utilities. Check `@modelcontextprotocol/sdk` for:
- `InMemoryStreamableHTTPServer`
- `test/http-utils.ts`
- Mock transport classes

If available, these would reduce implementation effort significantly.
