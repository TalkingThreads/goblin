/**
 * Tool Router
 */

import { type CallToolResult, CallToolResultSchema } from "@modelcontextprotocol/sdk/types.js";
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
    const start = performance.now();

    try {
      // 1. Resolve tool from registry
      const toolEntry = this.registry.getTool(name);

      if (!toolEntry) {
        throw new Error(`Tool not found: ${name}`);
      }

      const { serverId, def } = toolEntry;
      const originalName = def.name;

      // 2. Get transport for server
      // We need to find the server config to get the transport
      // The registry only stores serverId.
      // We assume serverId matches config.name.
      // Ideally TransportPool has a method to get by ID if already active,
      // but TransportPool.getTransport takes ServerConfig.
      // However, TransportPool caches by name.
      // We can iterate config to find the server config.

      const serverConfig = this.config.servers.find((s) => s.name === serverId);
      if (!serverConfig) {
        throw new Error(`Server configuration not found for: ${serverId}`);
      }

      const transport = await this.transportPool.getTransport(serverConfig);

      if (!transport.isConnected()) {
        throw new Error(`Transport not connected for server: ${serverId}`);
      }

      // 3. Execute tool with timeout
      logger.info({ tool: name, server: serverId }, "Routing tool call");

      const client = transport.getClient();

      // Use config timeout or default
      const timeoutMs = this.config.policies.defaultTimeout;
      const abortController = new AbortController();
      const timeoutId = setTimeout(() => abortController.abort(), timeoutMs);

      try {
        const result = await client.callTool(
          {
            name: originalName,
            arguments: args,
          },
          CallToolResultSchema,
          { signal: abortController.signal },
        );

        logger.info(
          { tool: name, server: serverId, durationMs: performance.now() - start },
          "Tool call successful",
        );

        return result as CallToolResult;
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error) {
      const durationMs = performance.now() - start;
      logger.error({ tool: name, error, durationMs }, "Tool call failed");

      // Re-throw as is if it's already structured, or wrap?
      // SDK errors usually are good.
      throw error;
    }
  }
}
