import MiniSearch from "minisearch";
import { z } from "zod";
import { defineMetaTool } from "./types.js";

/**
 * Helper to generate a "Server Compact Card" summary
 */
function getServerSummary(server: any): string {
  return server.description
    ? server.description.length > 100
      ? server.description.slice(0, 97) + "..."
      : server.description
    : `MCP Server (${server.transport})`;
}

/**
 * Get detailed information about an MCP server
 */
export const describeServer = defineMetaTool({
  name: "describe_server",
  description: "Get detailed information about an MCP server including its tools.",
  parameters: z.object({
    name: z.string().describe("Name/ID of the server"),
  }),
  execute: async ({ name }, { config, registry }) => {
    const serverConfig = config.servers.find((s) => s.name === name);
    if (!serverConfig) {
      throw new Error(`Server not found: ${name}`);
    }

    const tools = registry.listTools().filter((t) => t.serverId === name);

    return {
      server: serverConfig,
      toolCount: tools.length,
      tools: tools.map((t) => t.name),
    };
  },
});

/**
 * Search for MCP servers
 */
export const searchServers = defineMetaTool({
  name: "search_servers",
  description:
    "Keyword or semantic (fuzzy) search for MCP servers. Returns 'server compact cards'.",
  parameters: z.object({
    query: z.string().describe("Search query"),
  }),
  execute: async ({ query }, { config, registry }) => {
    // Build Index
    const minisearch = new MiniSearch({
      fields: ["name", "description"],
      storeFields: ["name", "description", "transport", "url", "command"],
      searchOptions: {
        fuzzy: 0.2,
        prefix: true,
        boost: { name: 2 },
      },
    });

    minisearch.addAll(
      config.servers.map((s) => ({
        id: s.name, // MiniSearch needs 'id'
        name: s.name,
        description: s.description || "",
        transport: s.transport,
        url: s.url,
        command: s.command,
      })),
    );

    const results = minisearch.search(query);

    // Build Compact Cards
    const servers = results.map((r) => {
      // Get tool count from registry
      const toolCount = registry.listTools().filter((t) => t.serverId === r["name"]).length;

      return {
        name: r["name"],
        summary: getServerSummary(r),
        transport: r["transport"],
        toolCount,
        score: r.score,
      };
    });

    return { servers };
  },
});
