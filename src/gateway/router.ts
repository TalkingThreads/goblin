import {
  type CallToolResult,
  CallToolResultSchema,
  type GetPromptResult,
  GetPromptResultSchema,
  type ReadResourceResult,
} from "@modelcontextprotocol/sdk/types.js";
import type { Config, ServerConfig } from "../config/index.js";
import {
  ConnectionError,
  PromptNotFoundError,
  RequestTimeoutError,
  ResourceNotFoundError,
  ServerNotFoundError,
  ToolNotFoundError,
} from "../errors/types.js";
import { getRequestId } from "../observability/correlation.js";
import { createLogger, isDebugEnabled } from "../observability/logger.js";
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

  updateConfig(newConfig: Config): void {
    this.config = newConfig;
    this.rebuildServerMap();
  }

  /**
   * Route a tool call to the appropriate backend
   */
  async callTool(name: string, args: Record<string, unknown>): Promise<CallToolResult> {
    // 0. Check for local tool
    const localTool = this.registry.getLocalTool(name);
    if (localTool) {
      logger.info({ toolName: name, requestId: getRequestId() }, "Local tool execution started");
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
        mcpToolDuration.observe(duration, { server: "goblin", tool: name, status: "success" });

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
        logger.error(
          { toolName: name, error, requestId: getRequestId() },
          "Local tool execution failed",
        );
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

    logger.debug(
      { uri: rawUri, serverId, durationMs: duration, requestId: getRequestId() },
      "Resource read completed",
    );

    return result;
  }

  private async executeRequest<T>(
    type: string,
    id: string,
    lookupFn: () => { serverId: string; def?: { name?: string } } | undefined,
    // biome-ignore lint/suspicious/noExplicitAny: SDK Client type mismatch - requires SDK version alignment
    executeFn: (client: any, originalName: string, signal: AbortSignal) => Promise<T>,
  ): Promise<T> {
    const start = performance.now();
    const timeoutMs = this.config.policies.defaultTimeout;
    const debugMode = isDebugEnabled();

    if (debugMode) {
      logger.trace({ type, id, timeoutMs, requestId: getRequestId() }, "Request routing started");
    }

    try {
      // 1. Resolve target
      const entry = lookupFn();

      if (debugMode) {
        logger.trace({ type, id, serverId: entry?.serverId }, "Target resolved");
      }

      if (!entry) {
        // Use type-specific error classes
        switch (type) {
          case "tool":
            throw new ToolNotFoundError(id);
          case "prompt":
            throw new PromptNotFoundError(id);
          case "resource":
            throw new ResourceNotFoundError(id);
          default:
            throw new Error(`${type} not found: ${id}`);
        }
      }

      const { serverId, def } = entry;
      // Use name from definition if available, otherwise use ID (for resources uri)
      const originalName = def?.name || id;

      // Check if server is draining
      if (this.transportPool.isDraining(serverId)) {
        throw new ConnectionError(serverId, "Server is being drained");
      }

      // 2. Get transport
      const serverConfig = this.serverMap.get(serverId);
      if (!serverConfig) {
        throw new ServerNotFoundError(serverId);
      }

      const transport = await this.transportPool.getTransport(serverConfig);

      if (debugMode) {
        logger.trace({ type, id, serverId, transportType: transport.type }, "Transport acquired");
      }

      if (!transport.isConnected()) {
        throw new ConnectionError(serverId, "Transport not connected");
      }

      // Track active request
      this.transportPool.incrementActiveRequests(serverId);

      // 3. Execute with timeout
      logger.info({ type, id, serverId, requestId: getRequestId() }, "Request routed to backend");

      const client = transport.getClient();
      const abortController = new AbortController();
      const timeoutId = setTimeout(() => abortController.abort(), timeoutMs);

      let duration = 0;

      try {
        const startTool = performance.now();
        const result = await executeFn(client, originalName, abortController.signal);
        duration = (performance.now() - startTool) / 1000;

        mcpToolCallsTotal.inc({ server: serverId, tool: id, status: "success" });
        mcpToolDuration.observe(duration, { server: serverId, tool: id, status: "success" });

        logger.info(
          {
            type,
            id,
            server: serverId,
            durationMs: performance.now() - start,
            requestId: getRequestId(),
          },
          "Request successful",
        );

        return result;
      } finally {
        clearTimeout(timeoutId);
        this.transportPool.decrementActiveRequests(serverId);
      }
    } catch (error) {
      // Handle timeout errors specifically
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new RequestTimeoutError(timeoutMs, `${type}: ${id}`);
      }

      mcpToolCallsTotal.inc({ server: id.split("_")[0] || "unknown", tool: id, status: "error" });
      const durationMs = performance.now() - start;
      logger.error({ type, id, error, durationMs, requestId: getRequestId() }, "Request failed");
      throw error;
    }
  }
}
