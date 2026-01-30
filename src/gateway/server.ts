/**
 * Gateway MCP Server
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
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
            listChanged: true,
          },
          prompts: {
            listChanged: true,
          },
          resources: {
            listChanged: true,
            subscribe: false, // TODO: Support subscription proxying
          },
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
    // --- Tools ---
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      logger.debug("Handling tools/list request");
      const tools = this.registry.listTools().map((card) => {
        const entry = this.registry.getTool(card.name);
        if (!entry) throw new McpError(ErrorCode.InternalError, "Inconsistent registry state");
        return {
          name: entry.id,
          description: entry.def.description,
          inputSchema: entry.def.inputSchema,
        };
      });
      return { tools };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      logger.info({ tool: name }, "Handling tools/call request");
      try {
        return await this.router.callTool(name, args || {});
      } catch (error) {
        throw this.mapError(error);
      }
    });

    // --- Prompts ---
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => {
      logger.debug("Handling prompts/list request");
      const prompts = this.registry.listPrompts().map((entry) => ({
        name: entry.id,
        description: entry.def.description,
        arguments: entry.def.arguments,
      }));
      return { prompts };
    });

    this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      logger.info({ prompt: name }, "Handling prompts/get request");
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
      logger.debug("Handling resources/list request");
      const resources = this.registry.listResources().map((entry) => entry.def);
      return { resources };
    });

    this.server.setRequestHandler(ListResourceTemplatesRequestSchema, async () => {
      logger.debug("Handling resources/templates/list request");
      const resourceTemplates = this.registry.listResourceTemplates().map((entry) => entry.def);
      return { resourceTemplates };
    });

    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;
      logger.info({ uri }, "Handling resources/read request");
      try {
        return await this.router.readResource(uri);
      } catch (error) {
        throw this.mapError(error);
      }
    });
  }

  private setupEvents(): void {
    // Notify connected clients when registry changes
    this.registry.on("tool-change", () => {
      this.server.notification({ method: "notifications/tools/list_changed" });
    });

    this.registry.on("prompt-change", () => {
      this.server.notification({ method: "notifications/prompts/list_changed" });
    });

    this.registry.on("resource-change", () => {
      this.server.notification({ method: "notifications/resources/list_changed" });
    });
  }

  private mapError(error: unknown): McpError {
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
}
