/**
 * Mock Streamable HTTP Server for E2E Testing
 *
 * Provides a lightweight mock MCP server that implements the Streamable HTTP protocol
 * for testing without requiring external MCP server dependencies.
 */

import { randomUUID } from "node:crypto";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";

export interface MockServerConfig {
  port: number;
  responseDelay?: number;
  shouldFail?: boolean;
  failOnMethod?: string;
}

export interface SessionInfo {
  sessionId: string;
  lastActivity: number;
  capabilities: Record<string, unknown>;
}

export class MockStreamableHttpServer {
  private server: ReturnType<typeof createServer>;
  private port: number;
  private sessions: Map<string, SessionInfo> = new Map();
  private requestCount: number = 0;
  private started: boolean = false;
  private config: MockServerConfig;

  constructor(config: Partial<MockServerConfig> = {}) {
    this.port = config.port || 3005;
    this.config = {
      port: this.port,
      responseDelay: config.responseDelay || 0,
      shouldFail: config.shouldFail || false,
      failOnMethod: config.failOnMethod,
    };

    this.server = createServer((req, res) => {
      this.handleRequest(req, res);
    });
  }

  get portNumber(): number {
    return this.port;
  }

  get requestCountTotal(): number {
    return this.requestCount;
  }

  get activeSessions(): number {
    return this.sessions.size;
  }

  async start(): Promise<void> {
    if (this.started) {
      return;
    }

    return new Promise((resolve) => {
      this.server.listen(this.port, () => {
        this.started = true;
        console.log(`[MockStreamableHttpServer] Started on port ${this.port}`);
        resolve();
      });
    });
  }

  async stop(): Promise<void> {
    if (!this.started) {
      return;
    }

    return new Promise((resolve) => {
      this.server.close(() => {
        this.started = false;
        this.sessions.clear();
        console.log(`[MockStreamableHttpServer] Stopped`);
        resolve();
      });
    });
  }

  reset(): void {
    this.sessions.clear();
    this.requestCount = 0;
  }

  private async handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
    this.requestCount++;

    const url = req.url || "";
    const method = req.method || "GET";
    const sessionId = req.headers["mcp-session-id"] as string | undefined;

    console.log(`[MockStreamableHttpServer] ${method} ${url}, session: ${sessionId || "none"}`);

    if (url !== "/mcp" || method !== "POST") {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({ jsonrpc: "2.0", error: { code: -32600, message: "Not Found" }, id: null }),
      );
      return;
    }

    let body = "";
    req.on("data", (chunk: Buffer) => {
      body += chunk.toString();
    });

    return new Promise((resolve) => {
      req.on("end", async () => {
        try {
          const request = JSON.parse(body);
          await this.processMcpRequest(request, sessionId, res);
        } catch {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              jsonrpc: "2.0",
              error: { code: -32700, message: "Parse error" },
              id: null,
            }),
          );
        }
        resolve();
      });
    });
  }

  private async processMcpRequest(
    request: { id: number | string; method: string; params?: Record<string, unknown> },
    providedSessionId: string | undefined,
    res: ServerResponse,
  ): Promise<void> {
    const { id, method, params } = request;

    if (this.config.shouldFail && method === this.config.failOnMethod) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          jsonrpc: "2.0",
          error: { code: -32000, message: "Server error" },
          id,
        }),
      );
      return;
    }

    await this.delay(this.config.responseDelay || 0);

    switch (method) {
      case "initialize": {
        const newSessionId = providedSessionId || randomUUID();
        const capabilities = {
          tools: { listChanged: true },
          resources: { subscribe: true, listChanged: true },
          prompts: { listChanged: true },
        };

        this.sessions.set(newSessionId, {
          sessionId: newSessionId,
          lastActivity: Date.now(),
          capabilities,
        });

        console.log(`[MockStreamableHttpServer] Session created: ${newSessionId}`);

        res.writeHead(200, {
          "Content-Type": "application/json",
          "mcp-session-id": newSessionId,
        });
        res.end(
          JSON.stringify({
            jsonrpc: "2.0",
            id,
            result: {
              protocolVersion: "2025-11-05",
              capabilities,
              serverInfo: { name: "mock-mcp-server", version: "1.0.0" },
            },
          }),
        );
        break;
      }

      case "ping": {
        if (providedSessionId && !this.sessions.has(providedSessionId)) {
          res.writeHead(404, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              jsonrpc: "2.0",
              error: { code: -32000, message: "Session not found" },
              id,
            }),
          );
          return;
        }

        if (providedSessionId) {
          const session = this.sessions.get(providedSessionId);
          if (session) {
            session.lastActivity = Date.now();
          }
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ jsonrpc: "2.0", id, result: {} }));
        break;
      }

      case "notifications/initialized": {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ jsonrpc: "2.0", id: null }));
        break;
      }

      case "tools/list": {
        if (providedSessionId && !this.sessions.has(providedSessionId)) {
          res.writeHead(404, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              jsonrpc: "2.0",
              error: { code: -32000, message: "Session not found" },
              id,
            }),
          );
          return;
        }

        if (providedSessionId) {
          const session = this.sessions.get(providedSessionId);
          if (session) {
            session.lastActivity = Date.now();
          }
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            jsonrpc: "2.0",
            id,
            result: {
              tools: [
                {
                  name: "mock_tool",
                  description: "A mock tool for testing",
                  inputSchema: {
                    type: "object",
                    properties: {
                      message: { type: "string", description: "Message to echo" },
                    },
                    required: ["message"],
                  },
                },
                {
                  name: "mock_calculator",
                  description: "A simple calculator tool",
                  inputSchema: {
                    type: "object",
                    properties: {
                      a: { type: "number", description: "First number" },
                      b: { type: "number", description: "Second number" },
                    },
                    required: ["a", "b"],
                  },
                },
              ],
            },
          }),
        );
        break;
      }

      case "tools/call": {
        if (providedSessionId && !this.sessions.has(providedSessionId)) {
          res.writeHead(404, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              jsonrpc: "2.0",
              error: { code: -32000, message: "Session not found" },
              id,
            }),
          );
          return;
        }

        const toolName = (params as Record<string, unknown>)?.name as string;
        const arguments_ = (params as Record<string, unknown>)?.arguments as
          | Record<string, unknown>
          | undefined;

        if (providedSessionId) {
          const session = this.sessions.get(providedSessionId);
          if (session) {
            session.lastActivity = Date.now();
          }
        }

        let content: Array<{ type: string; text: string }> = [];

        if (toolName === "mock_tool") {
          const message = (arguments_?.message as string) || "Hello from mock tool";
          content = [{ type: "text", text: `Mock tool response: ${message}` }];
        } else if (toolName === "mock_calculator") {
          const a = Number(arguments_?.a) || 0;
          const b = Number(arguments_?.b) || 0;
          content = [{ type: "text", text: `Calculator: ${a} + ${b} = ${a + b}` }];
        } else {
          content = [{ type: "text", text: `Unknown tool: ${toolName}` }];
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            jsonrpc: "2.0",
            id,
            result: { content },
          }),
        );
        break;
      }

      case "resources/list": {
        if (providedSessionId && !this.sessions.has(providedSessionId)) {
          res.writeHead(404, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              jsonrpc: "2.0",
              error: { code: -32000, message: "Session not found" },
              id,
            }),
          );
          return;
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            jsonrpc: "2.0",
            id,
            result: {
              resources: [
                {
                  uri: "mock://resource/test",
                  name: "Test Resource",
                  description: "A mock resource for testing",
                  mimeType: "text/plain",
                },
              ],
            },
          }),
        );
        break;
      }

      case "prompts/list": {
        if (providedSessionId && !this.sessions.has(providedSessionId)) {
          res.writeHead(404, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              jsonrpc: "2.0",
              error: { code: -32000, message: "Session not found" },
              id,
            }),
          );
          return;
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            jsonrpc: "2.0",
            id,
            result: {
              prompts: [
                {
                  name: "mock_prompt",
                  description: "A mock prompt for testing",
                  arguments: [
                    {
                      name: "topic",
                      description: "Topic to discuss",
                      required: false,
                    },
                  ],
                },
              ],
            },
          }),
        );
        break;
      }

      case "sessions/list": {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            jsonrpc: "2.0",
            id,
            result: {
              sessions: Array.from(this.sessions.values()).map((s) => ({
                sessionId: s.sessionId,
                lastActivity: s.lastActivity,
              })),
            },
          }),
        );
        break;
      }

      default:
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            jsonrpc: "2.0",
            error: { code: -32601, message: `Method not found: ${method}` },
            id,
          }),
        );
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export function createMockServerConfig(port: number): MockServerConfig {
  return {
    port,
    responseDelay: 0,
    shouldFail: false,
  };
}
