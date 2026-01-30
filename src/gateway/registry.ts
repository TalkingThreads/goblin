/**
 * Tool Registry
 */

import { EventEmitter } from "node:events";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { createLogger } from "../observability/logger.js";
import type { ToolCard, ToolEntry } from "./types.js";

const logger = createLogger("registry");

// Schema for tool list change notification
const ToolListChangedNotificationSchema = z.object({
  method: z.literal("notifications/tools/list_changed"),
  params: z
    .object({
      _meta: z.object({}).passthrough().optional(),
    })
    .optional(),
});

export class Registry extends EventEmitter {
  private tools = new Map<string, ToolEntry>();
  private serverTools = new Map<string, Set<string>>(); // serverId -> Set<toolId>

  /**
   * Add a server and sync its tools
   */
  async addServer(serverId: string, client: Client): Promise<void> {
    logger.info({ serverId }, "Adding server to registry");

    try {
      // Initial sync
      await this.syncServer(serverId, client);

      // Subscribe to updates
      this.subscribeToBackend(serverId, client);
    } catch (error) {
      logger.error({ serverId, error }, "Failed to add server to registry");
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
   * Sync tools from a backend server
   */
  private async syncServer(serverId: string, client: Client): Promise<void> {
    const tools = await this.fetchTools(client);

    // Calculate new tool IDs
    const newToolIds = new Set<string>();
    const entries: ToolEntry[] = [];

    for (const tool of tools) {
      const id = `${serverId}_${tool.name}`;
      newToolIds.add(id);
      entries.push({ id, def: tool, serverId });
    }

    // Remove old tools that are gone
    const oldToolIds = this.serverTools.get(serverId);
    if (oldToolIds) {
      for (const id of oldToolIds) {
        if (!newToolIds.has(id)) {
          this.tools.delete(id);
        }
      }
    }

    // Add/Update new tools
    for (const entry of entries) {
      this.tools.set(entry.id, entry);
    }

    this.serverTools.set(serverId, newToolIds);
    logger.info({ serverId, count: tools.length }, "Synced tools from server");
    this.emit("change");
  }

  /**
   * Subscribe to backend notifications
   */
  private subscribeToBackend(serverId: string, client: Client): void {
    client.setNotificationHandler(ToolListChangedNotificationSchema, async () => {
      logger.info({ serverId }, "Received tool list change notification");
      try {
        await this.syncServer(serverId, client);
      } catch (error) {
        logger.error({ serverId, error }, "Failed to re-sync tools from backend");
      }
    });
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
