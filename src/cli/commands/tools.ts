import { createLogger } from "../../observability/logger.js";

const logger = createLogger("cli-tools");

interface ToolOptions {
  json?: boolean;
  url?: string;
  server?: string;
  search?: string;
}

interface ToolInfo {
  name: string;
  description?: string;
  serverId: string;
  inputSchema: {
    type: string;
    properties?: Record<string, { type?: string }>;
    required?: string[];
  };
}

/**
 * Summarize a JSON schema into a compact string
 */
function summarizeSchema(schema: ToolInfo["inputSchema"]): string {
  if (!schema || schema.type !== "object" || !schema.properties) {
    return "()";
  }

  const props = Object.entries(schema.properties);
  const required = new Set(schema.required || []);

  const summary = props
    .map(([name, details]) => {
      const type = details.type || "any";
      const isOptional = !required.has(name);
      return `${name}${isOptional ? "?" : ""}: ${type}`;
    })
    .join(", ");

  return `(${summary})`;
}

/**
 * Execute the tools command
 */
export async function toolsCommand(options: ToolOptions): Promise<void> {
  const url = options.url || "http://localhost:3000";
  const toolsUrl = new URL(`${url.replace(/\/$/, "")}/tools`);

  if (options.server) {
    toolsUrl.searchParams.append("server", options.server);
  }
  if (options.search) {
    toolsUrl.searchParams.append("search", options.search);
  }

  try {
    const response = await fetch(toolsUrl.toString());

    if (!response.ok) {
      throw new Error(`Gateway returned ${response.status}: ${response.statusText}`);
    }

    const { tools } = (await response.json()) as { tools: ToolInfo[] };

    if (options.json) {
      console.log(JSON.stringify({ tools }));
      return;
    }

    if (tools.length === 0) {
      console.log("No tools found.");
      return;
    }

    console.log(`Tools (${tools.length})`);
    console.log("=".repeat(`Tools (${tools.length})`.length));

    // Find column widths for alignment
    const nameWidth = Math.max(...tools.map((t) => t.name.length), 10) + 2;
    const serverWidth = Math.max(...tools.map((t) => t.serverId.length), 10) + 2;

    for (const tool of tools) {
      const name = tool.name.padEnd(nameWidth);
      const server = tool.serverId.padEnd(serverWidth);
      const desc = tool.description || "";
      const schema = summarizeSchema(tool.inputSchema);

      console.log(`${name}${server}${desc}`);
      if (schema !== "()") {
        console.log(`${" ".repeat(nameWidth + serverWidth)}Schema: ${schema}`);
      }
    }
  } catch (error) {
    if (options.json) {
      console.log(
        JSON.stringify({
          error: "Could not connect to gateway",
          detail: error instanceof Error ? error.message : String(error),
        }),
      );
    } else {
      logger.error({ error, url: toolsUrl.toString() }, "Failed to fetch tools");
      console.error(`Error: Could not connect to gateway at ${url}`);
      console.error("Make sure the gateway is running (goblin start)");
    }
    process.exit(1);
  }
}
