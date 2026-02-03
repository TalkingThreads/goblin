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
  return `${text.slice(0, 117)}...`;
}

/**
 * List all available prompts with compact cards
 * (name, description, argument keys)
 */
export const catalogPrompts = defineMetaTool({
  name: "catalog_prompts",
  description:
    "DISCOVER AVAILABLE PROMPTS. Lists all pre-defined prompt templates from connected MCP servers. Returns prompt name, description, arguments, and source server. USE THIS when you need structured assistance or templates for common tasks. Prompts can provide expert-level guidance for complex operations.",
  parameters: z.object({
    serverId: z.string().optional().describe("Optional. Only show prompts from this server."),
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
    "GET PROMPT DETAILS. Returns full prompt definition including arguments and message templates. USE THIS before calling a prompt to understand what parameters it needs and how it will respond.",
  parameters: z.object({
    name: z
      .string()
      .describe(
        "The prompt name. Use the format 'serverId_promptName' or just the prompt name if unambiguous.",
      ),
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
    "FIND PROMPTS by keyword or description. USE THIS when you need a prompt template for a specific task but don't know the exact name. Search by what the prompt helps with (e.g., 'code review', 'debug', 'explain').",
  parameters: z.object({
    query: z
      .string()
      .describe(
        "What you need help with. Keywords like 'review', 'debug', 'generate', 'explain' work well.",
      ),
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
