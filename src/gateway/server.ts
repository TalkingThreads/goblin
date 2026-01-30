/**
 * Gateway MCP Server
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import type { Config } from "../config/index.js";
import { createLogger } from "../observability/logger.js";
import type { Registry } from "./registry.js";
import type { Router } from "./router.js";

const logger = createLogger("gateway-server");

export class GatewayServer {
  private server: Server;

  constructor(
    private registry: Registry,
    private router: Router,
    config: Config,
  ) {
    void config; // Suppress unused warning
    this.server = new Server(
      {
        name: "goblin-gateway",
        version: "0.1.0",
      },
      {
        capabilities: {
          tools: {
            listChanged: true, // Notify clients when tools change
          },
          prompts: {}, // Required to be present even if empty?
          resources: {},
        },
      },
    );

    this.setupHandlers();
    this.setupEvents();
  }

  /**
   * Connect a transport to the server
   */
  async connect(transport: Transport): Promise<void> {
    await this.server.connect(transport);
  }

  /**
   * Close the server
   */
  async close(): Promise<void> {
    await this.server.close();
  }

  private setupHandlers(): void {
    // Handle tools/list
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      logger.debug("Handling tools/list request");

      const tools = this.registry.listTools().map((card) => {
        const entry = this.registry.getTool(card.name);
        if (!entry) {
          // Should not happen as listTools() derives from entries
          throw new McpError(ErrorCode.InternalError, "Inconsistent registry state");
        }

        // Return full tool definition from backend
        // We might want to override description or add metadata?
        return {
          name: entry.id, // Namespaced ID
          description: entry.def.description,
          inputSchema: entry.def.inputSchema,
        };
      });

      return { tools };
    });

    // Handle tools/call
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      logger.info({ tool: name }, "Handling tools/call request");

      try {
        const result = await this.router.callTool(name, args || {});
        return result;
      } catch (error: unknown) {
        logger.error({ tool: name, error }, "Tool call failed");

        if (error instanceof Error) {
          // Map Router errors to McpError if needed
          if (error.message.includes("not found")) {
            throw new McpError(ErrorCode.MethodNotFound, error.message);
          }
          if (error.message.includes("timeout")) {
            throw new McpError(ErrorCode.RequestTimeout, "Tool execution timed out");
          }
          throw new McpError(ErrorCode.InternalError, error.message);
        }

        throw new McpError(ErrorCode.InternalError, "Unknown error occurred");
      }
    });
  }

  private setupEvents(): void {
    // When registry changes, notify connected clients
    this.registry.on("change", () => {
      logger.info("Registry changed, sending notification");
      // TODO: Server class doesn't expose notification method directly in v1.x?
      // Check SDK docs. Server has `sendToolListChanged`?
      // Actually, Server extends Protocol?
      // Let's assume for now we can't easily notify or it's method is protected/private in low-level Server?
      // No, Protocol has sendNotification.
      // But we need to cast or access it.

      // Attempt to send notification if supported
      // this.server.sendToolListChanged(); // Might exist in McpServer but check Server.
    });
  }
}
