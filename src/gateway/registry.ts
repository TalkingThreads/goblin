/**
 * Tool Registry
 */

import { EventEmitter } from "node:events";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { createLogger } from "../observability/logger.js";
import type { ToolCard, ToolEntry } from "./types.js";

const logger = createLogger("registry");

export class Registry extends EventEmitter {
  private tools = new Map<string, ToolEntry>();
  private serverTools = new Map<string, Set<string>>(); // serverId -> Set<toolId>

  /**
   * Add a server and sync its tools
   */
  async addServer(serverId: string, client: Client): Promise<void> {
    logger.info({ serverId }, "Adding server to registry");

    try {
      const tools = await this.fetchTools(client);

      const toolIds = new Set<string>();

      for (const tool of tools) {
        // Namespace tool to avoid collisions: serverId_toolName
        // TODO: Allow custom aliasing via config
        const id = `${serverId}_${tool.name}`;

        const entry: ToolEntry = {
          id,
          def: tool,
          serverId,
        };

        this.tools.set(id, entry);
        toolIds.add(id);
      }

      this.serverTools.set(serverId, toolIds);

      logger.info({ serverId, count: tools.length }, "Synced tools from server");
      this.emit("change");
    } catch (error) {
      logger.error({ serverId, error }, "Failed to sync tools from server");
      throw error;
    }
  }

  /**
   * Remove a server and its tools
   */
  removeServer(serverId: string): void {
    logger.info({ serverId }, "Removing server from registry");

    const toolIds = this.serverTools.get(serverId);
    if (!toolIds) {
      return;
    }

    for (const id of toolIds) {
      this.tools.delete(id);
    }

    this.serverTools.delete(serverId);
    this.emit("change");
  }

  /**
   * List all tools
   */
  listTools(): ToolCard[] {
    return Array.from(this.tools.values()).map((entry) => ({
      name: entry.id, // Exposed name is the namespaced ID
      description: entry.def.description,
      serverId: entry.serverId,
    }));
  }

  /**
   * Get full tool definition
   */
  getTool(id: string): ToolEntry | undefined {
    return this.tools.get(id);
  }

  /**
   * Fetch all tools from a client handling pagination
   */
  private async fetchTools(client: Client): Promise<Tool[]> {
    const tools: Tool[] = [];
    let cursor: string | undefined;

    do {
      const result = await client.listTools({ cursor });
      tools.push(...result.tools);
      cursor = result.nextCursor;
    } while (cursor);

    return tools;
  }
}
