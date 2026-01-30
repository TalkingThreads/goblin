/**
 * Tool Registry
 */

import { EventEmitter } from "node:events";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import type { Prompt, Resource, ResourceTemplate, Tool } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { createLogger } from "../observability/logger.js";
import type {
  PromptEntry,
  ResourceEntry,
  ResourceTemplateEntry,
  ToolCard,
  ToolEntry,
} from "./types.js";

const logger = createLogger("registry");

// Schema for notifications
const ToolListChangedNotificationSchema = z.object({
  method: z.literal("notifications/tools/list_changed"),
  params: z.object({ _meta: z.object({}).passthrough().optional() }).optional(),
});

const PromptListChangedNotificationSchema = z.object({
  method: z.literal("notifications/prompts/list_changed"),
  params: z.object({ _meta: z.object({}).passthrough().optional() }).optional(),
});

const ResourceListChangedNotificationSchema = z.object({
  method: z.literal("notifications/resources/list_changed"),
  params: z.object({ _meta: z.object({}).passthrough().optional() }).optional(),
});

export class Registry extends EventEmitter {
  private tools = new Map<string, ToolEntry>();
  private prompts = new Map<string, PromptEntry>();
  private resources = new Map<string, ResourceEntry>(); // uri -> Entry
  private resourceTemplates = new Map<string, ResourceTemplateEntry>(); // uriTemplate -> Entry

  private serverTools = new Map<string, Set<string>>(); // serverId -> Set<toolId>
  private serverPrompts = new Map<string, Set<string>>(); // serverId -> Set<promptId>
  private serverResources = new Map<string, Set<string>>(); // serverId -> Set<uri>
  private serverTemplates = new Map<string, Set<string>>(); // serverId -> Set<uriTemplate>

  /**
   * Add a server and sync capabilities
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
   * Remove a server and its capabilities
   */
  removeServer(serverId: string): void {
    logger.info({ serverId }, "Removing server from registry");

    // Remove tools
    const toolIds = this.serverTools.get(serverId);
    if (toolIds) {
      for (const id of toolIds) this.tools.delete(id);
      this.serverTools.delete(serverId);
    }

    // Remove prompts
    const promptIds = this.serverPrompts.get(serverId);
    if (promptIds) {
      for (const id of promptIds) this.prompts.delete(id);
      this.serverPrompts.delete(serverId);
    }

    // Remove resources
    const resourceUris = this.serverResources.get(serverId);
    if (resourceUris) {
      for (const uri of resourceUris) this.resources.delete(uri);
      this.serverResources.delete(serverId);
    }

    // Remove templates
    const templateUris = this.serverTemplates.get(serverId);
    if (templateUris) {
      for (const uri of templateUris) this.resourceTemplates.delete(uri);
      this.serverTemplates.delete(serverId);
    }

    this.emit("change");
  }

  // --- Tools ---

  listTools(): ToolCard[] {
    return Array.from(this.tools.values()).map((entry) => ({
      name: entry.id,
      description: entry.def.description,
      serverId: entry.serverId,
    }));
  }

  getTool(id: string): ToolEntry | undefined {
    return this.tools.get(id);
  }

  // --- Prompts ---

  listPrompts(): PromptEntry[] {
    return Array.from(this.prompts.values());
  }

  getPrompt(id: string): PromptEntry | undefined {
    return this.prompts.get(id);
  }

  // --- Resources ---

  listResources(): ResourceEntry[] {
    return Array.from(this.resources.values());
  }

  listResourceTemplates(): ResourceTemplateEntry[] {
    return Array.from(this.resourceTemplates.values());
  }

  getResource(uri: string): ResourceEntry | undefined {
    return this.resources.get(uri);
  }

  // Note: Finding resource by template matching requires more complex logic
  // For `readResource`, if exact match fails, we might need to match templates?
  // Usually `readResource` is for specific URI.
  // If the resource is dynamic (from template), it might not be in `resources` list.
  // We need a way to route `readResource` based on templates.
  // For MVP, we can iterate all templates and try to match?
  // Or just iterate all servers and ask them? (Inefficient).

  findServerForResource(uri: string): string | undefined {
    // 1. Exact match
    const resource = this.resources.get(uri);
    if (resource) return resource.serverId;

    // 2. Template match (TODO: Implement proper URI template matching)
    // For now, naive check if any template prefix matches? No, URI templates are complex.
    // We can skip template matching for now or assume simple prefix if needed.

    return undefined;
  }

  // --- Sync Logic ---

  private async syncServer(serverId: string, client: Client): Promise<void> {
    // We can sync in parallel
    const [tools, prompts, resources, templates] = await Promise.all([
      this.fetchTools(client).catch((e) => {
        logger.warn({ serverId, error: e }, "Failed to fetch tools");
        return [];
      }),
      this.fetchPrompts(client).catch((e) => {
        logger.warn({ serverId, error: e }, "Failed to fetch prompts");
        return [];
      }),
      this.fetchResources(client).catch((e) => {
        logger.warn({ serverId, error: e }, "Failed to fetch resources");
        return [];
      }),
      this.fetchResourceTemplates(client).catch((e) => {
        logger.warn({ serverId, error: e }, "Failed to fetch templates");
        return [];
      }),
    ]);

    // Sync Tools
    const newToolIds = new Set<string>();
    for (const tool of tools) {
      const id = `${serverId}_${tool.name}`;
      newToolIds.add(id);
      this.tools.set(id, { id, def: tool, serverId });
    }
    const oldToolIds = this.serverTools.get(serverId);
    if (oldToolIds) {
      for (const id of oldToolIds) if (!newToolIds.has(id)) this.tools.delete(id);
    }
    this.serverTools.set(serverId, newToolIds);

    // Sync Prompts
    const newPromptIds = new Set<string>();
    for (const prompt of prompts) {
      const id = `${serverId}_${prompt.name}`;
      newPromptIds.add(id);
      this.prompts.set(id, { id, def: prompt, serverId });
    }
    const oldPromptIds = this.serverPrompts.get(serverId);
    if (oldPromptIds) {
      for (const id of oldPromptIds) if (!newPromptIds.has(id)) this.prompts.delete(id);
    }
    this.serverPrompts.set(serverId, newPromptIds);

    // Sync Resources
    const newResourceUris = new Set<string>();
    for (const resource of resources) {
      // We don't namespace URIs, we assume they are unique or last-writer-wins?
      // Or we should verify collision?
      // For now, simple map.
      this.resources.set(resource.uri, { def: resource, serverId });
      newResourceUris.add(resource.uri);
    }
    const oldResourceUris = this.serverResources.get(serverId);
    if (oldResourceUris) {
      for (const uri of oldResourceUris) if (!newResourceUris.has(uri)) this.resources.delete(uri);
    }
    this.serverResources.set(serverId, newResourceUris);

    // Sync Templates
    const newTemplateUris = new Set<string>();
    for (const template of templates) {
      this.resourceTemplates.set(template.uriTemplate, { def: template, serverId });
      newTemplateUris.add(template.uriTemplate);
    }
    const oldTemplateUris = this.serverTemplates.get(serverId);
    if (oldTemplateUris) {
      for (const uri of oldTemplateUris)
        if (!newTemplateUris.has(uri)) this.resourceTemplates.delete(uri);
    }
    this.serverTemplates.set(serverId, newTemplateUris);

    logger.info(
      { serverId, tools: tools.length, prompts: prompts.length, resources: resources.length },
      "Synced capabilities",
    );

    // Emit specific changes
    this.emit("tool-change");
    this.emit("prompt-change");
    this.emit("resource-change");
    this.emit("change");
  }

  private subscribeToBackend(serverId: string, client: Client): void {
    client.setNotificationHandler(ToolListChangedNotificationSchema, async () => {
      logger.info({ serverId }, "Received tool list change");
      await this.syncServer(serverId, client);
    });

    client.setNotificationHandler(PromptListChangedNotificationSchema, async () => {
      logger.info({ serverId }, "Received prompt list change");
      await this.syncServer(serverId, client);
    });

    client.setNotificationHandler(ResourceListChangedNotificationSchema, async () => {
      logger.info({ serverId }, "Received resource list change");
      await this.syncServer(serverId, client);
    });
  }

  // --- Fetch Helpers ---

  private async fetchTools(client: Client): Promise<Tool[]> {
    const items: Tool[] = [];
    let cursor: string | undefined;
    do {
      const result = await client.listTools({ cursor });
      items.push(...result.tools);
      cursor = result.nextCursor;
    } while (cursor);
    return items;
  }

  private async fetchPrompts(client: Client): Promise<Prompt[]> {
    const items: Prompt[] = [];
    let cursor: string | undefined;
    do {
      const result = await client.listPrompts({ cursor });
      items.push(...result.prompts);
      cursor = result.nextCursor;
    } while (cursor);
    return items;
  }

  private async fetchResources(client: Client): Promise<Resource[]> {
    const items: Resource[] = [];
    let cursor: string | undefined;
    do {
      const result = await client.listResources({ cursor });
      items.push(...result.resources);
      cursor = result.nextCursor;
    } while (cursor);
    return items;
  }

  private async fetchResourceTemplates(client: Client): Promise<ResourceTemplate[]> {
    const items: ResourceTemplate[] = [];
    let cursor: string | undefined;
    do {
      const result = await client.listResourceTemplates({ cursor });
      items.push(...result.resourceTemplates);
      cursor = result.nextCursor;
    } while (cursor);
    return items;
  }
}
