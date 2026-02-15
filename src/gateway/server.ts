/**
 * Gateway MCP Server
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import type { Prompt, Resource, ResourceTemplate, Tool } from "@modelcontextprotocol/sdk/types.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
  ListResourcesRequestSchema,
  ListResourceTemplatesRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ReadResourceRequestSchema,
  SubscribeRequestSchema,
  UnsubscribeRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import type { Config } from "../config/index.js";
import { isGoblinError } from "../errors/types.js";
import { SERVER_NAME, SERVER_VERSION } from "../meta.js";
import { getRequestId } from "../observability/correlation.js";
import { createLogger } from "../observability/logger.js";
import {
  mcpActiveSessions,
  mcpCancellationsTotal,
  mcpInitializationDuration,
  mcpRequestDuration,
  mcpSessionDuration,
} from "../observability/metrics.js";
import type { Registry } from "./registry.js";
import type { Router } from "./router.js";
import { SubscriptionManager } from "./subscription-manager.js";

const logger = createLogger("gateway-server");

// MCP Protocol Version Support
export const SUPPORTED_PROTOCOL_VERSIONS = ["2025-11-25", "2024-11-05"];
export const DEFAULT_PROTOCOL_VERSION = "2025-11-25";

// Notification Schemas
const InitializedNotificationSchema = z.object({
  method: z.literal("notifications/initialized"),
});

const CancelledNotificationSchema = z.object({
  method: z.literal("notifications/cancelled"),
  params: z.object({
    requestId: z.union([z.string(), z.number()]),
    reason: z.optional(z.string()),
  }),
});

const PingRequestSchema = z.object({
  method: z.literal("ping"),
});

export class GatewayServer {
  private server: Server;
  private cachedToolList: Tool[] | null = null;
  private cachedPromptList: Prompt[] | null = null;
  private cachedResourceList: Resource[] | null = null;
  private cachedResourceTemplateList: ResourceTemplate[] | null = null;
  private subscriptionManager: SubscriptionManager;

  // MCP Protocol State
  private clientInitialized = false;
  private initializationStartTime: number | null = null;
  private activeRequests = new Map<string | number, AbortController>();
  private sessionStartTime: number;

  constructor(
    private registry: Registry,
    private router: Router,
    config: Config,
  ) {
    void config; // Suppress unused warning

    this.sessionStartTime = Date.now();
    this.subscriptionManager = new SubscriptionManager();

    this.server = new Server(
      {
        name: SERVER_NAME,
        version: SERVER_VERSION,
      },
      {
        capabilities: {
          tools: {
            listChanged: true,
          },
          prompts: {
            listChanged: true,
          },
          resources: {
            listChanged: true,
            subscribe: true,
          },
          logging: {},
        },
      },
    );

    this.setupProtocolHandlers();
    this.setupHandlers();
    this.setupEvents();
    this.setupBackendNotificationHandlers();
  }

  /**
   * Connect a transport to the server
   */
  async connect(transport: Transport): Promise<void> {
    await this.server.connect(transport);
  }

  /**
   * Validate that client has sent initialized notification
   */
  private validateClientInitialized(): void {
    if (!this.clientInitialized) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        "Client not initialized. Send 'notifications/initialized' before making requests.",
      );
    }
  }

  /**
   * Close the server
   */
  async close(): Promise<void> {
    const sessionDuration = (Date.now() - this.sessionStartTime) / 1000;
    mcpSessionDuration.observe(sessionDuration);
    mcpActiveSessions.dec();
    logger.info({ sessionDuration }, "MCP session ended");
    await this.server.close();
  }

  /**
   * Set up MCP protocol compliance handlers
   * These handlers manage initialization, ping/pong, and cancellation
   */
  private setupProtocolHandlers(): void {
    mcpActiveSessions.inc();

    // Handle initialized notification
    this.server.setNotificationHandler(InitializedNotificationSchema, async () => {
      this.clientInitialized = true;

      if (this.initializationStartTime) {
        const duration = (Date.now() - this.initializationStartTime) / 1000;
        mcpInitializationDuration.observe(duration);
        logger.info({ duration }, "Client initialized notification received");
      }
    });

    // Handle cancellation notifications
    this.server.setNotificationHandler(CancelledNotificationSchema, async (notification) => {
      const { requestId } = notification.params;
      const controller = this.activeRequests.get(requestId);

      if (controller) {
        controller.abort();
        mcpCancellationsTotal.inc();
        logger.info({ requestId }, "Request cancelled by client");
      } else {
        logger.debug({ requestId }, "Cancellation received for unknown request");
      }
    });

    // Handle ping requests
    this.server.setRequestHandler(PingRequestSchema, async () => {
      logger.debug({ requestId: getRequestId() }, "Ping received");
      return {}; // Empty response per MCP spec
    });
  }

  private setupHandlers(): void {
    // --- Tools ---
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      logger.debug({ requestId: getRequestId() }, "Tools listed");
      if (!this.cachedToolList) {
        this.cachedToolList = this.registry.getAliasedTools();
      }
      return { tools: this.cachedToolList };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      this.validateClientInitialized();
      const { name, arguments: args } = request.params;
      const requestId = getRequestId() ?? crypto.randomUUID();
      const startTime = performance.now();

      logger.info({ toolName: name, requestId }, "Tool called");

      try {
        const result = await this.router.callTool(name, args || {});
        const duration = (performance.now() - startTime) / 1000;
        mcpRequestDuration.observe(duration, { method: "tools/call" });
        return result;
      } catch (error) {
        throw this.mapError(error);
      }
    });

    // --- Prompts ---
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => {
      logger.debug({ requestId: getRequestId() }, "Prompts listed");
      if (!this.cachedPromptList) {
        this.cachedPromptList = this.registry.getAllPrompts().map((entry) => ({
          name: entry.id,
          description: entry.def.description,
          arguments: entry.def.arguments,
        }));
      }
      return { prompts: this.cachedPromptList };
    });

    this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      logger.info({ promptName: name, requestId: getRequestId() }, "Prompt requested");
      try {
        // Router needs to support getPrompt
        // We cast args to Record<string, string> as prompts use string args
        // If router expects unknown, we need to fix router or cast here.
        // Prompt args are string->string usually? No, SDK says arguments?: Record<string, string>.
        return await this.router.getPrompt(name, args as Record<string, string>);
      } catch (error) {
        throw this.mapError(error);
      }
    });

    // --- Resources ---
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      logger.debug({ requestId: getRequestId() }, "Resources listed");
      if (!this.cachedResourceList) {
        this.cachedResourceList = this.registry.getAllResources().map((entry) => entry.def);
      }
      return { resources: this.cachedResourceList };
    });

    this.server.setRequestHandler(ListResourceTemplatesRequestSchema, async () => {
      logger.debug({ requestId: getRequestId() }, "Resource templates listed");
      if (!this.cachedResourceTemplateList) {
        this.cachedResourceTemplateList = this.registry
          .getAllResourceTemplates()
          .map((entry) => entry.def);
      }
      return { resourceTemplates: this.cachedResourceTemplateList };
    });

    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;
      logger.info({ uri, requestId: getRequestId() }, "Resource read");
      try {
        return await this.router.readResource(uri);
      } catch (error) {
        throw this.mapError(error);
      }
    });

    // --- Resource Subscriptions ---
    this.server.setRequestHandler(SubscribeRequestSchema, async (request) => {
      const { uri } = request.params;
      logger.info({ uri, requestId: getRequestId() }, "Resource subscription created");

      // Validate that the resource exists
      const resource = this.registry.getResource(uri);
      if (!resource) {
        throw new McpError(ErrorCode.InvalidRequest, `Resource not found: ${uri}`);
      }

      // Subscribe (clientId will be set by the transport layer)
      // For now, we use a placeholder - actual clientId comes from connection context
      const clientId = this.getCurrentClientId();
      this.subscriptionManager.subscribe(clientId, uri, resource.serverId);

      return {};
    });

    this.server.setRequestHandler(UnsubscribeRequestSchema, async (request) => {
      const { uri } = request.params;
      logger.info({ uri, requestId: getRequestId() }, "Resource subscription removed");

      const clientId = this.getCurrentClientId();
      const unsubscribed = this.subscriptionManager.unsubscribe(clientId, uri);

      if (!unsubscribed) {
        throw new McpError(ErrorCode.InvalidRequest, `Not subscribed to resource: ${uri}`);
      }

      return {};
    });
  }

  /**
   * Get the current client ID from the connection context.
   * This is a placeholder - actual implementation depends on the transport layer.
   */
  private getCurrentClientId(): string {
    // TODO: Implement proper client ID extraction from connection context
    return "default-client";
  }

  private setupEvents(): void {
    // Notify connected clients when registry changes
    this.registry.on("tool-change", () => {
      this.cachedToolList = null;
      this.server.notification({ method: "notifications/tools/list_changed" });
    });

    this.registry.on("prompt-change", () => {
      this.cachedPromptList = null;
      this.server.notification({ method: "notifications/prompts/list_changed" });
    });

    this.registry.on("resource-change", () => {
      this.cachedResourceList = null;
      this.cachedResourceTemplateList = null;
      this.server.notification({ method: "notifications/resources/list_changed" });
    });

    // Handle resource updated notifications from backends
    this.registry.on("resource-updated", (serverId: string, uri: string) => {
      void this.handleResourceUpdated(serverId, uri);
    });
  }

  /**
   * Set up handlers for notifications from backend servers.
   * This should be called when a backend server connects.
   */
  private setupBackendNotificationHandlers(): void {
    // This method is called per-backend connection in the registry
    // The actual handler is set up in registry.ts when subscribing to backend notifications
  }

  /**
   * Handle resource updated notification from a backend server.
   * Routes the notification to all subscribed clients.
   */
  public async handleResourceUpdated(serverId: string, uri: string): Promise<void> {
    const subscribers = this.subscriptionManager.getSubscribers(uri);

    if (subscribers.length === 0) {
      logger.debug(
        { uri, serverId, requestId: getRequestId() },
        "Resource update skipped: no subscribers",
      );
      return;
    }

    logger.info(
      { uri, serverId, subscriberCount: subscribers.length, requestId: getRequestId() },
      "Resource update forwarded",
    );

    // Forward notification to all subscribed clients
    for (const clientId of subscribers) {
      try {
        await this.server.notification({
          method: "notifications/resources/updated",
          params: { uri },
        });
      } catch (error) {
        logger.warn(
          { clientId, uri, error, requestId: getRequestId() },
          "Resource update delivery failed",
        );
      }
    }
  }

  /**
   * Clean up subscriptions when a client disconnects.
   */
  public cleanupClient(clientId: string): void {
    const count = this.subscriptionManager.cleanupClient(clientId);
    logger.info(
      { clientId, subscriptionCount: count, requestId: getRequestId() },
      "Client subscriptions cleaned up",
    );
  }

  private mapError(error: unknown): McpError {
    // Handle GoblinError subclasses with type-safe error codes
    if (isGoblinError(error)) {
      // Use the statusCode from GoblinError which maps to MCP ErrorCode
      const mcpCode = this.mapToMcpErrorCode(error.statusCode);
      return new McpError(mcpCode, error.message, error.context);
    }

    // Fallback for standard Error objects
    if (error instanceof Error) {
      if (error.message.includes("not found")) {
        return new McpError(ErrorCode.MethodNotFound, error.message);
      }
      if (error.message.includes("timeout")) {
        return new McpError(ErrorCode.RequestTimeout, "Execution timed out");
      }
      // TODO: Handle user rejection etc
      return new McpError(ErrorCode.InternalError, error.message);
    }
    return new McpError(ErrorCode.InternalError, "Unknown error occurred");
  }

  /**
   * Map HTTP-style status codes to MCP ErrorCodes
   */
  private mapToMcpErrorCode(statusCode: number): ErrorCode {
    switch (statusCode) {
      case 400:
        return ErrorCode.InvalidRequest;
      case 401:
        return ErrorCode.InvalidRequest;
      case 403:
        return ErrorCode.InvalidRequest;
      case 404:
        return ErrorCode.MethodNotFound;
      case 408:
        return ErrorCode.RequestTimeout;
      case 503:
        return ErrorCode.RequestTimeout;
      default:
        return ErrorCode.InternalError;
    }
  }
}
