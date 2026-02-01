import {
  type CallToolResult,
  CallToolResultSchema,
  type GetPromptResult,
  GetPromptResultSchema,
  type ReadResourceResult,
} from "@modelcontextprotocol/sdk/types.js";
import type { Config, ServerConfig } from "../config/index.js";
import { createLogger } from "../observability/logger.js";
import { mcpToolCallsTotal, mcpToolDuration } from "../observability/metrics.js";
import type { TransportPool } from "../transport/index.js";
import type { Registry } from "./registry.js";
import { parseNamespacedUri } from "./types.js";

const logger = createLogger("router");

export class Router {
  private serverMap = new Map<string, ServerConfig>();

  constructor(
    private registry: Registry,
    private transportPool: TransportPool,
    private config: Config,
  ) {
    this.rebuildServerMap();
  }

  private rebuildServerMap(): void {
    this.serverMap.clear();
    for (const server of this.config.servers) {
      this.serverMap.set(server.name, server);
    }
  }

  /**
   * Route a tool call to the appropriate backend
   */
  async callTool(name: string, args: Record<string, unknown>): Promise<CallToolResult> {
    // 0. Check for local tool
    const localTool = this.registry.getLocalTool(name);
    if (localTool) {
      logger.info({ tool: name }, "Executing local tool");
      try {
        const start = performance.now();
        // Execute local tool with context
        const result = await localTool.execute(args, {
          registry: this.registry,
          config: this.config,
          router: this,
        });
        const duration = (performance.now() - start) / 1000;

        mcpToolCallsTotal.inc({ server: "goblin", tool: name, status: "success" });
        mcpToolDuration.observe({ server: "goblin", tool: name, status: "success" }, duration);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        mcpToolCallsTotal.inc({ server: "goblin", tool: name, status: "error" });
        logger.error({ tool: name, error }, "Local tool execution failed");
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }

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
    // Handle both namespaced and raw URIs.
    const parsed = parseNamespacedUri(uri);
    const rawUri = parsed?.rawUri ?? uri;
    const serverId = parsed?.serverId ?? this.registry.findServerForResource(uri);

    if (!serverId) {
      throw new Error(`Resource not found: ${uri}`);
    }

    const serverConfig = this.serverMap.get(serverId);
    if (!serverConfig) {
      throw new Error(`Server configuration not found for: ${serverId}`);
    }

    const transport = await this.transportPool.getTransport(serverConfig);

    if (!transport.isConnected()) {
      throw new Error(`Transport not connected for server: ${serverId}`);
    }

    const client = transport.getClient();

    const start = performance.now();
    const result = await client.readResource({ uri: rawUri });
    const duration = performance.now() - start;

    logger.debug({ uri: rawUri, serverId, duration }, "Read resource");

    return result;
  }

  private async executeRequest<T>(
    type: string,
    id: string,
    lookupFn: () => { serverId: string; def?: { name?: string } } | undefined,
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
      const originalName = def?.name || id;

      // 2. Get transport
      const serverConfig = this.serverMap.get(serverId);
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
        const startTool = performance.now();
        const result = await executeFn(client, originalName, abortController.signal);
        const duration = (performance.now() - startTool) / 1000;

        mcpToolCallsTotal.inc({ server: serverId, tool: id, status: "success" });
        mcpToolDuration.observe({ server: serverId, tool: id, status: "success" }, duration);

        logger.info(
          { type, id, server: serverId, durationMs: performance.now() - start },
          "Request successful",
        );

        return result;
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error) {
      mcpToolCallsTotal.inc({ server: id.split("_")[0], tool: id, status: "error" });
      const durationMs = performance.now() - start;
      logger.error({ type, id, error, durationMs }, "Request failed");
      throw error;
    }
  }
}
