import {
  type CallToolResult,
  CallToolResultSchema,
  type GetPromptResult,
  GetPromptResultSchema,
  type ReadResourceResult,
  ReadResourceResultSchema,
} from "@modelcontextprotocol/sdk/types.js";
import type { Config } from "../config/index.js";
import { createLogger } from "../observability/logger.js";
import type { TransportPool } from "../transport/index.js";
import type { Registry } from "./registry.js";

const logger = createLogger("router");

export class Router {
  constructor(
    private registry: Registry,
    private transportPool: TransportPool,
    private config: Config,
  ) {}

  /**
   * Route a tool call to the appropriate backend
   */
  async callTool(name: string, args: Record<string, unknown>): Promise<CallToolResult> {
    return this.executeRequest(
      "tool",
      name,
      () => this.registry.getTool(name),
      (client, originalName, signal) =>
        client.callTool({ name: originalName, arguments: args }, CallToolResultSchema, {
          signal,
        }) as Promise<CallToolResult>,
    );
  }

  /**
   * Route a prompt retrieval
   */
  async getPrompt(name: string, args: Record<string, string> = {}): Promise<GetPromptResult> {
    return this.executeRequest(
      "prompt",
      name,
      () => this.registry.getPrompt(name),
      (client, originalName, signal) =>
        client.getPrompt({ name: originalName, arguments: args }, GetPromptResultSchema, {
          signal,
        }) as Promise<GetPromptResult>,
    );
  }

  /**
   * Route a resource read
   */
  async readResource(uri: string): Promise<ReadResourceResult> {
    // For resources, "name" is URI.
    // Registry lookup might need to handle templates in future.
    return this.executeRequest(
      "resource",
      uri,
      () => this.registry.getResource(uri),
      (client, _originalUri, signal) =>
        client.readResource({ uri }, ReadResourceResultSchema, {
          signal,
        }) as Promise<ReadResourceResult>,
    );
  }

  private async executeRequest<T>(
    type: string,
    id: string,
    lookupFn: () => { serverId: string; def: { name?: string } } | undefined,
    executeFn: (client: any, originalName: string, signal: AbortSignal) => Promise<T>,
  ): Promise<T> {
    const start = performance.now();

    try {
      // 1. Resolve target
      const entry = lookupFn();

      if (!entry) {
        throw new Error(`${type} not found: ${id}`);
      }

      const { serverId, def } = entry;
      // Use name from definition if available, otherwise use ID (for resources uri)
      const originalName = def.name || id;

      // 2. Get transport
      const serverConfig = this.config.servers.find((s) => s.name === serverId);
      if (!serverConfig) {
        throw new Error(`Server configuration not found for: ${serverId}`);
      }

      const transport = await this.transportPool.getTransport(serverConfig);

      if (!transport.isConnected()) {
        throw new Error(`Transport not connected for server: ${serverId}`);
      }

      // 3. Execute with timeout
      logger.info({ type, id, server: serverId }, `Routing ${type} request`);

      const client = transport.getClient();
      const timeoutMs = this.config.policies.defaultTimeout;
      const abortController = new AbortController();
      const timeoutId = setTimeout(() => abortController.abort(), timeoutMs);

      try {
        const result = await executeFn(client, originalName, abortController.signal);

        logger.info(
          { type, id, server: serverId, durationMs: performance.now() - start },
          "Request successful",
        );

        return result;
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error) {
      const durationMs = performance.now() - start;
      logger.error({ type, id, error, durationMs }, "Request failed");
      throw error;
    }
  }
}
