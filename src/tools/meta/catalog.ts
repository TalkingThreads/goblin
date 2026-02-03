import { z } from "zod";
import { defineMetaTool } from "./types.js";

/**
 * Helper to generate a "Compact Card" summary
 */
function getSmartSummary(text?: string): string {
  if (!text) return "";
  // Take first sentence or first 120 chars
  const firstSentence = text.split(/[.!?]/, 1)[0] || "";
  if (firstSentence.length < 120) return firstSentence;
  return `${text.slice(0, 117)}...`;
}

/**
 * List all available tools with compact cards
 */
export const catalogList = defineMetaTool({
  name: "catalog_list",
  description:
    "DISCOVER AVAILABLE TOOLS. Lists every tool exposed by all connected MCP servers. Returns tool name, brief summary, parameters, and source server. USE THIS at the start of a session to understand what tools are available, or when the user asks 'what can you do?'. Filter by serverId to see only one backend's tools.",
  parameters: z.object({
    serverId: z
      .string()
      .optional()
      .describe(
        "Optional. Only list tools from this specific server. Use when you want to focus on one backend's capabilities.",
      ),
  }),
  execute: async ({ serverId }, { registry }) => {
    // We need full details to generate the card (args list)
    const allTools = registry.getAllTools();

    // Filter
    const filtered = serverId ? allTools.filter((t) => t.serverId === serverId) : allTools;

    // Map to Compact Card
    const tools = filtered.map((t) => ({
      name: t.id,
      summary: getSmartSummary(t.def.description),
      args: Object.keys(t.def.inputSchema.properties || {}),
      serverId: t.serverId,
    }));

    return { tools };
  },
});

/**
 * Advanced search for tools
 */
export const catalogSearch = defineMetaTool({
  name: "catalog_search",
  description:
    "FIND SPECIFIC TOOLS by keyword or natural language. Searches tool names and descriptions using fuzzy matching. Returns matching tools with scores. USE THIS when you need to find a tool for a specific task (e.g., 'find files', 'git commit', 'search code').",
  parameters: z.object({
    query: z
      .string()
      .describe(
        "What you're looking for. Use natural language ('read a file') or keywords ('file read'). The search is fuzzy - partial matches work.",
      ),
  }),
  execute: async ({ query }, { registry }) => {
    // Use the Registry's cached search index
    const results = registry.searchTools(query);

    // Map to Compact Card
    const tools = results.map((r) => ({
      name: r.name,
      summary: getSmartSummary(r.description),
      args: [], // Search results don't include full schema - would need additional lookup
      serverId: r.serverId,
      score: r.score,
    }));

    return { tools };
  },
});
