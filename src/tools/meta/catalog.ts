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
  description: "Lists all available tools and returns their 'tool compact cards'.",
  parameters: z.object({
    serverId: z.string().optional().describe("Filter tools by server ID"),
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
  description: "Keyword or semantic (fuzzy) search for tools. Returns 'tool compact cards'.",
  parameters: z.object({
    query: z.string().describe("Search query (natural language or keywords)"),
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
