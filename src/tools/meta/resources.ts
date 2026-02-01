import MiniSearch from "minisearch";
import { z } from "zod";
import { defineMetaTool } from "./types.js";

/**
 * Helper to generate a "Compact Card" summary for resources
 */
function getResourceSmartSummary(text?: string): string {
  if (!text) return "";
  const firstSentence = text.split(/[.!?]/, 1)[0] || "";
  if (firstSentence.length < 120) return firstSentence;
  return text.slice(0, 117) + "...";
}

/**
 * List all available resources with compact cards
 * (uri, description, mimeType, serverId)
 */
export const catalogResources = defineMetaTool({
  name: "catalog_resources",
  description:
    "Lists all available resources with compact cards (uri, description, mimeType, serverId).",
  parameters: z.object({
    serverId: z.string().optional().describe("Filter resources by server ID"),
    mimeType: z.string().optional().describe("Filter resources by MIME type"),
  }),
  execute: async ({ serverId, mimeType }, { registry }) => {
    const allResources = registry.listResources();

    // Filter by server and mimeType if specified
    let filtered = allResources;
    if (serverId) {
      filtered = filtered.filter((r) => r.serverId === serverId);
    }
    if (mimeType) {
      filtered = filtered.filter((r) => r.def.mimeType === mimeType);
    }

    // Map to Compact Card
    const resources = filtered.map((r) => ({
      uri: r.def.uri,
      description: getResourceSmartSummary(r.def.description),
      mimeType: r.def.mimeType || "unknown",
      serverId: r.serverId,
    }));

    return { resources };
  },
});

/**
 * Get detailed information about a specific resource
 */
export const describeResource = defineMetaTool({
  name: "describe_resource",
  description:
    "Get detailed information about a specific resource including URI, description, and MIME type.",
  parameters: z.object({
    uri: z
      .string()
      .describe("Namespaced resource URI (e.g., 'mcp://serverId/encodedUri') or raw URI"),
  }),
  execute: async ({ uri }, { registry }) => {
    const resource = registry.getResource(uri);
    if (!resource) {
      throw new Error(`Resource not found: ${uri}`);
    }
    return {
      uri: resource.def.uri,
      description: resource.def.description,
      mimeType: resource.def.mimeType,
      serverId: resource.serverId,
    };
  },
});

/**
 * Search for resources using keyword or fuzzy matching
 */
export const searchResources = defineMetaTool({
  name: "search_resources",
  description:
    "Search for resources using keyword or fuzzy matching. Returns 'resource compact cards'.",
  parameters: z.object({
    query: z.string().describe("Search query"),
    mimeType: z.string().optional().describe("Filter by MIME type"),
  }),
  execute: async ({ query, mimeType }, { registry }) => {
    let allResources = registry.listResources();

    // Pre-filter by mimeType if specified
    if (mimeType) {
      allResources = allResources.filter((r) => r.def.mimeType === mimeType);
    }

    // Build Index
    const minisearch = new MiniSearch({
      fields: ["uri", "description"],
      storeFields: ["def", "serverId"],
      searchOptions: {
        fuzzy: 0.2,
        prefix: true,
        boost: { uri: 2 },
      },
    });

    // Add documents
    minisearch.addAll(
      allResources.map((r) => ({
        id: r.def.uri,
        uri: r.def.uri,
        description: r.def.description || "",
        def: r.def,
        serverId: r.serverId,
      })),
    );

    // Search
    const results = minisearch.search(query);

    // Map to Compact Card
    const resources = results.map((r) => {
      const def = r["def"] as any;
      const uri = r.id || r["uri"];
      return {
        uri,
        description: getResourceSmartSummary(def?.description || ""),
        mimeType: def?.mimeType || "unknown",
        serverId: r["serverId"],
        score: r.score,
      };
    });

    return { resources };
  },
});

/**
 * List all available resource templates
 */
export const catalogResourceTemplates = defineMetaTool({
  name: "catalog_resource_templates",
  description:
    "Lists all available resource templates with compact cards (uriTemplate, description, serverId).",
  parameters: z.object({
    serverId: z.string().optional().describe("Filter templates by server ID"),
  }),
  execute: async ({ serverId }, { registry }) => {
    const allTemplates = registry.listResourceTemplates();

    // Filter by server if specified
    const filtered = serverId ? allTemplates.filter((t) => t.serverId === serverId) : allTemplates;

    // Map to Compact Card
    const templates = filtered.map((t) => ({
      uriTemplate: t.def.uriTemplate,
      description: getResourceSmartSummary(t.def.description),
      serverId: t.serverId,
    }));

    return { templates };
  },
});
