import MiniSearch from "minisearch";
import { z } from "zod";
import { defineMetaTool } from "./types.js";

/**
 * Helper to generate a "Compact Card" summary for prompts
 */
function getPromptSmartSummary(text?: string): string {
  if (!text) return "";
  const firstSentence = text.split(/[.!?]/, 1)[0] || "";
  if (firstSentence.length < 120) return firstSentence;
  return text.slice(0, 117) + "...";
}

/**
 * List all available prompts with compact cards
 * (name, description, argument keys)
 */
export const catalogPrompts = defineMetaTool({
  name: "catalog_prompts",
  description: "Lists all available prompts with compact cards (name, description, argument keys).",
  parameters: z.object({
    serverId: z.string().optional().describe("Filter prompts by server ID"),
  }),
  execute: async ({ serverId }, { registry }) => {
    const allPrompts = registry.getAllPrompts();

    // Filter by server if specified
    const filtered = serverId ? allPrompts.filter((p) => p.serverId === serverId) : allPrompts;

    // Map to Compact Card
    const prompts = filtered.map((p) => ({
      name: p.id,
      description: getPromptSmartSummary(p.def.description),
      arguments: p.def.arguments?.map((arg) => arg.name) || [],
      serverId: p.serverId,
    }));

    return { prompts };
  },
});

/**
 * Get detailed information about a specific prompt
 */
export const describePrompt = defineMetaTool({
  name: "describe_prompt",
  description:
    "Get detailed information about a specific prompt including arguments and message templates.",
  parameters: z.object({
    name: z.string().describe("Namespaced prompt name (e.g., 'serverId_promptName')"),
  }),
  execute: async ({ name }, { registry }) => {
    const prompt = registry.getPrompt(name);
    if (!prompt) {
      throw new Error(`Prompt not found: ${name}`);
    }
    return {
      name: prompt.id,
      description: prompt.def.description,
      arguments: prompt.def.arguments,
      serverId: prompt.serverId,
    };
  },
});

/**
 * Search for prompts using keyword or fuzzy matching
 */
export const searchPrompts = defineMetaTool({
  name: "search_prompts",
  description:
    "Search for prompts using keyword or fuzzy matching. Returns 'prompt compact cards'.",
  parameters: z.object({
    query: z.string().describe("Search query"),
  }),
  execute: async ({ query }, { registry }) => {
    const allPrompts = registry.getAllPrompts();

    // Build Index
    const minisearch = new MiniSearch({
      fields: ["name", "description"],
      storeFields: ["id", "def", "serverId"],
      searchOptions: {
        fuzzy: 0.2,
        prefix: true,
        boost: { name: 2 },
      },
    });

    // Add documents
    minisearch.addAll(
      allPrompts.map((p) => ({
        id: p.id,
        name: p.id,
        description: p.def.description || "",
        def: p.def,
        serverId: p.serverId,
      })),
    );

    // Search
    const results = minisearch.search(query);

    // Map to Compact Card
    const prompts = results.map((r) => {
      // MiniSearch stores storeFields with underscore prefix internally
      const def = r["def"] as any;
      const id = r.id || r["name"] || r["id"];
      return {
        name: id,
        description: getPromptSmartSummary(def?.description || ""),
        arguments: def?.arguments?.map((arg: any) => arg.name) || [],
        serverId: r["serverId"],
        score: r.score,
      };
    });

    return { prompts };
  },
});
