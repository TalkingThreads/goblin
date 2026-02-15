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
  return `${text.slice(0, 117)}...`;
}

/**
 * List all available resources with compact cards
 * (uri, description, mimeType, serverId)
 */
export const catalogResources = defineMetaTool({
  name: "catalog_resources",
  description:
    "DISCOVER AVAILABLE RESOURCES. Lists all files, documents, and data sources from connected MCP servers. Returns URI, description, MIME type, and source server. USE THIS when the user mentions files, docs, or data they want to access. Filter by serverId or mimeType to narrow results.",
  parameters: z.object({
    serverId: z
      .string()
      .optional()
      .describe(
        "Optional. Only show resources from this server. Useful for focusing on filesystem, git, or specific backends.",
      ),
    mimeType: z
      .string()
      .optional()
      .describe(
        "Optional. Only show resources of this type (e.g., 'text/plain', 'application/json', 'text/markdown').",
      ),
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
    "GET DETAILS about a resource. Returns full metadata including URI, description, MIME type, and source server. USE THIS before reading a resource to understand what you're accessing, or when you need the exact URI format.",
  parameters: z.object({
    uri: z
      .string()
      .describe(
        "The resource URI. Can be the full namespaced format (mcp://serverId/path) or raw path. The gateway will resolve it correctly.",
      ),
  }),
  execute: async ({ uri }, { registry }) => {
    if (!uri || uri.trim() === "") {
      throw new Error("Missing required parameter: 'uri' - the resource URI to describe");
    }

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
    "FIND SPECIFIC RESOURCES by keyword or description. Searches resource URIs and descriptions. USE THIS when looking for a specific file or document by name or content description. Filter by mimeType to search only certain file types.",
  parameters: z.object({
    query: z
      .string()
      .optional()
      .describe("What you're searching for. File names, paths, or content descriptions work best."),
    mimeType: z.string().optional().describe("Optional. Limit search to specific file types."),
  }),
  execute: async ({ query, mimeType }, { registry }) => {
    let allResources = registry.listResources();

    // Pre-filter by mimeType if specified
    if (mimeType) {
      allResources = allResources.filter((r) => r.def.mimeType === mimeType);
    }

    // Add default handling
    const searchQuery = query ?? "";

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
    const results = minisearch.search(searchQuery);

    // Map to Compact Card
    const resources = results.map((r) => {
      // biome-ignore lint/suspicious/noExplicitAny: MiniSearch internal typing requires any
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
    "LIST RESOURCE TEMPLATES. Shows URI patterns that can be instantiated (e.g., 'mcp://filesystem/{path}'). Templates define dynamic resources. USE THIS to understand what dynamic resources are available from each server.",
  parameters: z.object({
    serverId: z.string().optional().describe("Optional. Only show templates from this server."),
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
