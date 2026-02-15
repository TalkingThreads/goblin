import MiniSearch from "minisearch";
import { z } from "zod";
import { defineMetaTool } from "./types.js";

/**
 * Helper to generate a "Server Compact Card" summary
 */
interface ServerSummary {
  description?: string;
  transport?: string;
  [key: string]: unknown;
}

function getServerSummary(server: ServerSummary): string {
  return server.description
    ? server.description.length > 100
      ? `${server.description.slice(0, 97)}...`
      : server.description
    : `MCP Server (${server.transport ?? "unknown"})`;
}

/**
 * Get detailed information about an MCP server
 */
export const describeServer = defineMetaTool({
  name: "describe_server",
  description:
    "GET SERVER DETAILS. Returns configuration and list of all tools provided by a specific MCP server. USE THIS to understand what capabilities a particular backend exposes, or when debugging connection issues.",
  parameters: z.object({
    name: z.string().describe("The server name as configured in the gateway."),
  }),
  execute: async ({ name }, { config, registry }) => {
    if (!name || name.trim() === "") {
      throw new Error(
        "Missing required parameter: 'name' - the server name as configured in the gateway",
      );
    }

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
    "FIND CONFIGURED SERVERS. Searches for MCP servers by name or description. Returns matching servers with tool counts. USE THIS when you want to see which backends match certain criteria or understand the gateway's configuration.",
  parameters: z.object({
    query: z.string().optional().describe("Server name or description to search for."),
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

    // Add search with default
    const searchQuery = query ?? "";

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

    const results = minisearch.search(searchQuery);

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
