/**
 * Test MCP Client
 *
 * A mock MCP client for integration testing with assertion helpers.
 */

import { EventEmitter } from "node:events";

export interface TestClientConfig {
  name?: string;
}

/**
 * Mock transport for testing
 */
class MockTransport extends EventEmitter implements AsyncIterable<unknown> {
  private connected = false;
  private messageQueue: unknown[] = [];
  private pendingRequests: Map<
    number,
    { resolve: (value: unknown) => void; reject: (error: Error) => void }
  > = new Map();
  private nextId = 1;

  async start(): Promise<void> {
    this.connected = true;
  }

  async send(message: unknown): Promise<void> {
    const msg = message as { id?: number; method?: string; params?: Record<string, unknown> };

    // Handle request
    if (msg.id && this.pendingRequests.has(msg.id)) {
      const pending = this.pendingRequests.get(msg.id)!;
      this.pendingRequests.delete(msg.id);
      // Emit for server to handle
      this.emit("message", message);
      return;
    }

    // Handle notification (no response expected)
    this.emit("message", message);
  }

  async request<T>(method: string, params?: Record<string, unknown>): Promise<T> {
    const id = this.nextId++;
    const message = { jsonrpc: "2.0", id, method, params };

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve: resolve as (value: unknown) => void, reject });
      this.send(message).catch(reject);

      // Timeout after 30 seconds
      const timeout = setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error(`Request timeout: ${method}`));
        }
      }, 30000);
    });
  }

  async next(): Promise<IteratorResult<unknown>> {
    return new Promise((resolve) => {
      const checkQueue = () => {
        if (this.messageQueue.length > 0) {
          const message = this.messageQueue.shift()!;
          resolve({ done: false, value: message });
        } else {
          setTimeout(checkQueue, 10);
        }
      };
      checkQueue();
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
   * Simulate receiving a response from server
   */
  async receiveResponse(response: unknown): Promise<void> {
    const resp = response as { id?: number };
    if (resp.id && this.pendingRequests.has(resp.id)) {
      const pending = this.pendingRequests.get(resp.id)!;
      this.pendingRequests.delete(resp.id);
      pending.resolve(response);
    }
  }

  /**
   * Simulate receiving a notification from server
   */
  receiveNotification(method: string, params?: Record<string, unknown>): void {
    this.emit("notification", { method, params });
  }
}

/**
 * Test MCP Client implementation
 */
export class TestMcpClient {
  private transport: MockTransport;
  private name: string;

  constructor(config: TestClientConfig = {}) {
    this.name = config.name || "test-client";
    this.transport = new MockTransport();
  }

  /**
   * Connect to a server
   */
  async connect(): Promise<void> {
    await this.transport.start();
    this.transport.on("message", async (message: unknown) => {
      await this.handleMessage(message as { method: string; params?: Record<string, unknown> });
    });
  }

  /**
   * Handle incoming messages from server
   */
  private async handleMessage(message: {
    method: string;
    params?: Record<string, unknown>;
  }): Promise<void> {
    // Handle notifications
    if (message.method?.startsWith("notifications/")) {
      // Notifications are handled by setting up handlers
    }
  }

  /**
   * Disconnect from the server
   */
  async disconnect(): Promise<void> {
    await this.transport.close();
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.transport.isConnected();
  }

  /**
   * Send initialize request
   */
  async initialize(): Promise<{
    protocolVersion: string;
    capabilities: Record<string, unknown>;
    serverInfo: { name: string; version: string };
  }> {
    return this.transport.request("initialize", {
      capabilities: {
        tools: {},
        resources: { subscribe: true },
        prompts: {},
      },
      clientInfo: {
        name: this.name,
        version: "1.0.0-test",
      },
    }) as Promise<{
      protocolVersion: string;
      capabilities: Record<string, unknown>;
      serverInfo: { name: string; version: string };
    }>;
  }

  /**
   * List available tools
   */
  async listTools(): Promise<
    Array<{ name: string; description: string; inputSchema: Record<string, unknown> }>
  > {
    const result = await this.transport.request("tools/list", {});
    return (
      result as {
        result: {
          tools: Array<{ name: string; description: string; inputSchema: Record<string, unknown> }>;
        };
      }
    ).result.tools;
  }

  /**
   * Call a tool
   */
  async callTool(
    name: string,
    args?: Record<string, unknown>,
  ): Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean }> {
    return this.transport.request("tools/call", { name, arguments: args }) as Promise<{
      content: Array<{ type: string; text: string }>;
      isError?: boolean;
    }>;
  }

  /**
   * List resources
   */
  async listResources(): Promise<
    Array<{ uri: string; name: string; description: string; mimeType: string }>
  > {
    const result = await this.transport.request("resources/list", {});
    return (
      result as {
        result: {
          resources: Array<{ uri: string; name: string; description: string; mimeType: string }>;
        };
      }
    ).result.resources;
  }

  /**
   * Read a resource
   */
  async readResource(uri: string): Promise<Array<{ uri: string; mimeType: string; text: string }>> {
    const result = await this.transport.request("resources/read", { uri });
    return (
      result as { result: { contents: Array<{ uri: string; mimeType: string; text: string }> } }
    ).result.contents;
  }

  /**
   * Subscribe to a resource
   */
  async subscribeResource(uri: string): Promise<void> {
    await this.transport.request("resources/subscribe", { uri });
  }

  /**
   * Unsubscribe from a resource
   */
  async unsubscribeResource(uri: string): Promise<void> {
    await this.transport.request("resources/unsubscribe", { uri });
  }

  /**
   * List prompts
   */
  async listPrompts(): Promise<
    Array<{
      name: string;
      description: string;
      arguments: Array<{ name: string; description?: string; required?: boolean }>;
    }>
  > {
    const result = await this.transport.request("prompts/list", {});
    return (
      result as {
        result: {
          prompts: Array<{
            name: string;
            description: string;
            arguments: Array<{ name: string; description?: string; required?: boolean }>;
          }>;
        };
      }
    ).result.prompts;
  }

  /**
   * Get a prompt
   */
  async getPrompt(
    name: string,
    args?: Record<string, string>,
  ): Promise<{
    description: string;
    messages: Array<{ role: string; content: { type: string; text: string } }>;
  }> {
    return this.transport.request("prompts/get", { name, arguments: args }) as Promise<{
      description: string;
      messages: Array<{ role: string; content: { type: string; text: string } }>;
    }>;
  }

  /**
   * Get the transport for advanced use
   */
  getTransport(): MockTransport {
    return this.transport;
  }
}

/**
 * Assertion helpers for tool results
 */
export class ToolResultAssertions {
  private result: { content: Array<{ type: string; text: string }>; isError?: boolean };

  constructor(result: { content: Array<{ type: string; text: string }>; isError?: boolean }) {
    this.result = result;
  }

  /**
   * Check that the result has a text content
   */
  hasText(): this {
    const hasText = this.result.content?.some((c) => c.type === "text");
    if (!hasText) {
      throw new Error(`Expected text content but got: ${JSON.stringify(this.result.content)}`);
    }
    return this;
  }

  /**
   * Check that the result has an error
   */
  hasError(): this {
    if (!this.result.isError) {
      throw new Error(`Expected error but result.isError is false`);
    }
    return this;
  }

  /**
   * Check that the result has no error
   */
  hasNoError(): this {
    if (this.result.isError) {
      throw new Error(`Expected no error but got error`);
    }
    return this;
  }

  /**
   * Get the text content
   */
  getText(): string {
    const textContent = this.result.content?.find((c) => c.type === "text");
    if (!textContent || textContent.type !== "text") {
      throw new Error("No text content found");
    }
    return textContent.text;
  }

  /**
   * Get the text content and check it matches a pattern
   */
  textMatches(pattern: string | RegExp): this {
    const text = this.getText();
    if (pattern instanceof RegExp) {
      if (!pattern.test(text)) {
        throw new Error(`Expected text to match ${pattern} but got: ${text}`);
      }
    } else {
      if (text !== pattern) {
        throw new Error(`Expected text "${pattern}" but got: ${text}`);
      }
    }
    return this;
  }

  /**
   * Get the text content and check it contains a string
   */
  textContains(substring: string): this {
    const text = this.getText();
    if (!text.includes(substring)) {
      throw new Error(`Expected text to contain "${substring}" but got: ${text}`);
    }
    return this;
  }
}

/**
 * Create a basic test client
 */
export function createTestClient(name: string = "test-client"): TestMcpClient {
  return new TestMcpClient({ name });
}
