/**
 * Test MCP Server
 *
 * A mock MCP server for integration testing.
 * Provides tools, resources, and prompts for testing gateway behavior.
 */

import { EventEmitter } from "node:events";

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface ResourceDefinition {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
  content: string;
}

export interface PromptDefinition {
  name: string;
  description: string;
  arguments: Array<{ name: string; description?: string; required?: boolean }>;
}

export interface ToolCallResult {
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}

export interface TestServerConfig {
  name: string;
  tools?: Array<
    ToolDefinition & { handler: (args: Record<string, unknown>) => Promise<ToolCallResult> }
  >;
  resources?: Array<ResourceDefinition>;
  prompts?: Array<
    PromptDefinition & { handler: (args: Record<string, unknown>) => Promise<string> }
  >;
  latency?: number;
  errorRate?: number;
}

/**
 * Mock transport for testing
 */
export class MockTransport extends EventEmitter implements AsyncIterable<unknown> {
  private connected = false;
  private messageQueue: unknown[] = [];
  private resolveRead: ((value: unknown) => void) | null = null;

  async start(): Promise<void> {
    this.connected = true;
  }

  async send(message: unknown): Promise<void> {
    // Emit event for test infrastructure to intercept responses
    this.emit("send", message);

    // Queue message for reading
    if (this.resolveRead) {
      this.resolveRead(message);
      this.resolveRead = null;
    } else {
      this.messageQueue.push(message);
    }
  }

  async next(): Promise<IteratorResult<unknown>> {
    if (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift()!;
      return { done: false, value: message };
    }

    return new Promise((resolve) => {
      this.resolveRead = (message) => {
        resolve({ done: false, value: message });
      };
    });
  }

  [Symbol.asyncIterator](): AsyncIterableIterator<unknown> {
    return this;
  }

  async close(): Promise<void> {
    this.connected = false;
    this.emit("close");
  }

  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Simulate receiving a response from client (for testing)
   */
  async receiveResponse(response: unknown): Promise<void> {
    this.emit("message", response);
  }
}

/**
 * Test MCP Server implementation
 */
export class TestMcpServer {
  private config: TestServerConfig;
  private transport: MockTransport | null = null;
  private running = false;
  private messageHandler: ((message: unknown) => Promise<unknown>) | null = null;

  constructor(config: TestServerConfig) {
    this.config = {
      name: config.name || "test-server",
      tools: config.tools || [],
      resources: config.resources || [],
      prompts: config.prompts || [],
      latency: config.latency || 0,
      errorRate: config.errorRate || 0,
    };
  }

  /**
   * Start the test MCP server
   */
  async start(): Promise<void> {
    if (this.running) {
      return;
    }

    this.transport = new MockTransport();

    // Set up message handler
    this.messageHandler = async (message: unknown): Promise<unknown> => {
      return this.handleMessage(message as { method: string; params?: Record<string, unknown> });
    };

    this.transport.on("message", async (data: unknown) => {
      if (this.messageHandler) {
        const response = await this.messageHandler(data);
        if (response && this.transport) {
          await this.transport.send(response);
        }
      }
    });

    this.running = true;
  }

  /**
   * Handle incoming messages
   */
  private async handleMessage(message: {
    method: string;
    params?: Record<string, unknown>;
  }): Promise<unknown> {
    const { method, params } = message;

    // Simulate latency
    if (this.config.latency && this.config.latency > 0) {
      await this.delay(this.config.latency);
    }

    // Simulate errors
    if (
      this.config.errorRate &&
      this.config.errorRate > 0 &&
      Math.random() < this.config.errorRate
    ) {
      return {
        jsonrpc: "2.0",
        id: (params as Record<string, unknown>)?.id,
        error: {
          code: -32000,
          message: `Simulated error for method: ${method}`,
        },
      };
    }

    switch (method) {
      case "initialize":
        return {
          jsonrpc: "2.0",
          id: (params as Record<string, unknown>)?.id,
          result: {
            protocolVersion: "2025-11-05",
            capabilities: {
              tools: {},
              resources: { subscribe: true },
              prompts: {},
            },
            serverInfo: {
              name: this.config.name,
              version: "1.0.0-test",
            },
          },
        };

      case "tools/list":
        return {
          jsonrpc: "2.0",
          id: (params as Record<string, unknown>)?.id,
          result: {
            tools:
              this.config.tools?.map((t) => ({
                name: t.name,
                description: t.description,
                inputSchema: t.inputSchema,
              })) || [],
          },
        };

      case "tools/call": {
        const { name, arguments: args } =
          (params as { name: string; arguments?: Record<string, unknown> }) || {};
        const tool = this.config.tools?.find((t) => t.name === name);
        if (!tool) {
          return {
            jsonrpc: "2.0",
            id: (params as Record<string, unknown>)?.id,
            error: {
              code: -32602,
              message: `Unknown tool: ${name}`,
            },
          };
        }
        const result = await tool.handler(args || {});
        return {
          jsonrpc: "2.0",
          id: (params as Record<string, unknown>)?.id,
          result,
        };
      }

      case "resources/list":
        return {
          jsonrpc: "2.0",
          id: (params as Record<string, unknown>)?.id,
          result: {
            resources:
              this.config.resources?.map((r) => ({
                uri: r.uri,
                name: r.name,
                description: r.description,
                mimeType: r.mimeType,
              })) || [],
          },
        };

      case "resources/read": {
        const { uri } = (params as { uri: string }) || {};
        const resource = this.config.resources?.find((r) => r.uri === uri);
        if (!resource) {
          return {
            jsonrpc: "2.0",
            id: (params as Record<string, unknown>)?.id,
            error: {
              code: -32602,
              message: `Unknown resource: ${uri}`,
            },
          };
        }
        return {
          jsonrpc: "2.0",
          id: (params as Record<string, unknown>)?.id,
          result: {
            contents: [
              {
                uri: resource.uri,
                mimeType: resource.mimeType,
                text: resource.content,
              },
            ],
          },
        };
      }

      case "prompts/list":
        return {
          jsonrpc: "2.0",
          id: (params as Record<string, unknown>)?.id,
          result: {
            prompts:
              this.config.prompts?.map((p) => ({
                name: p.name,
                description: p.description,
                arguments: p.arguments,
              })) || [],
          },
        };

      case "prompts/get": {
        const { name, arguments: args } =
          (params as { name: string; arguments?: Record<string, unknown> }) || {};
        const prompt = this.config.prompts?.find((p) => p.name === name);
        if (!prompt) {
          return {
            jsonrpc: "2.0",
            id: (params as Record<string, unknown>)?.id,
            error: {
              code: -32602,
              message: `Unknown prompt: ${name}`,
            },
          };
        }
        const description = await prompt.handler(args || {});
        return {
          jsonrpc: "2.0",
          id: (params as Record<string, unknown>)?.id,
          result: {
            description: prompt.description,
            messages: [
              {
                role: "user",
                content: {
                  type: "text",
                  text: description,
                },
              },
            ],
          },
        };
      }

      default:
        return {
          jsonrpc: "2.0",
          id: (params as Record<string, unknown>)?.id,
          error: {
            code: -32601,
            message: `Method not found: ${method}`,
          },
        };
    }
  }

  /**
   * Stop the test MCP server
   */
  async stop(): Promise<void> {
    if (!this.running) {
      return;
    }

    if (this.transport) {
      await this.transport.close();
      this.transport = null;
    }

    this.messageHandler = null;
    this.running = false;
  }

  /**
   * Check if the server is running
   */
  isRunning(): boolean {
    return this.running;
  }

  /**
   * Get the transport for connection
   */
  getTransport(): MockTransport | null {
    return this.transport;
  }

  /**
   * Connect this server's transport to a client's transport for testing
   */
  connectToClient(client: {
    getTransport: () => { receiveResponse: (response: unknown) => Promise<void> };
  }): void {
    if (!this.transport) {
      throw new Error("Server must be started before connecting to client");
    }

    const clientTransport = client.getTransport();

    // When server sends a response, deliver it to the client
    this.transport.on("send", async (data: unknown) => {
      await clientTransport.receiveResponse(data);
    });
  }

  /**
   * Add a tool to the server
   */
  addTool(
    name: string,
    description: string,
    inputSchema: Record<string, unknown>,
    handler: (args: Record<string, unknown>) => Promise<ToolCallResult>,
  ): void {
    if (!this.config.tools) {
      this.config.tools = [];
    }

    this.config.tools.push({
      name,
      description,
      inputSchema,
      handler,
    });
  }

  /**
   * Add a resource to the server
   */
  addResource(
    uri: string,
    name: string,
    description: string,
    mimeType: string,
    content: string,
  ): void {
    if (!this.config.resources) {
      this.config.resources = [];
    }

    this.config.resources.push({
      uri,
      name,
      description,
      mimeType,
      content,
    });
  }

  /**
   * Add a prompt to the server
   */
  addPrompt(
    name: string,
    description: string,
    arguments_: Array<{ name: string; description?: string; required?: boolean }>,
    handler: (args: Record<string, unknown>) => Promise<string>,
  ): void {
    if (!this.config.prompts) {
      this.config.prompts = [];
    }

    this.config.prompts.push({
      name,
      description,
      arguments: arguments_,
      handler,
    });
  }

  /**
   * Set simulated latency for all operations
   */
  setLatency(ms: number): void {
    this.config.latency = ms;
  }

  /**
   * Set error rate for operations (0-1)
   */
  setErrorRate(rate: number): void {
    this.config.errorRate = Math.max(0, Math.min(1, rate));
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Create a simple test server with basic tools
 */
export function createBasicTestServer(name: string = "test-server"): TestMcpServer {
  const server = new TestMcpServer({
    name,
    tools: [
      {
        name: "echo",
        description: "Echo the input arguments",
        inputSchema: {
          type: "object",
          properties: {
            message: { type: "string", description: "Message to echo" },
          },
          required: ["message"],
        },
        handler: async (args) => {
          return {
            content: [
              {
                type: "text",
                text: `Echo: ${args.message}`,
              },
            ],
          };
        },
      },
      {
        name: "add",
        description: "Add two numbers",
        inputSchema: {
          type: "object",
          properties: {
            a: { type: "number", description: "First number" },
            b: { type: "number", description: "Second number" },
          },
          required: ["a", "b"],
        },
        handler: async (args) => {
          const result = Number(args.a) + Number(args.b);
          return {
            content: [
              {
                type: "text",
                text: `Result: ${result}`,
              },
            ],
          };
        },
      },
      {
        name: "get_time",
        description: "Get the current server time",
        inputSchema: {
          type: "object",
          properties: {},
        },
        handler: async () => {
          return {
            content: [
              {
                type: "text",
                text: `Current time: ${new Date().toISOString()}`,
              },
            ],
          };
        },
      },
    ],
    resources: [
      {
        uri: "test://resource1",
        name: "Test Resource 1",
        description: "A test resource",
        mimeType: "text/plain",
        content: "This is test resource content 1",
      },
      {
        uri: "test://resource2",
        name: "Test Resource 2",
        description: "Another test resource",
        mimeType: "application/json",
        content: '{"key": "value"}',
      },
    ],
    prompts: [
      {
        name: "greet",
        description: "Generate a greeting",
        arguments: [{ name: "name", description: "Name to greet", required: true }],
        handler: async (args) => {
          return `Hello, ${args.name}! Welcome to the test server.`;
        },
      },
    ],
  });

  return server;
}
