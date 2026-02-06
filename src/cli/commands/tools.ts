import { Command } from "commander";
import { createLogger } from "../../observability/logger.js";
import { ExitCode } from "../exit-codes.js";
import type { CliContext } from "../types.js";

const logger = createLogger("cli-tools");

interface ToolInfo {
  name: string;
  server: string;
  description: string;
  parameters?: {
    type: string;
    properties?: Record<string, unknown>;
    required?: string[];
  };
}

interface ToolListOptions {
  json?: boolean;
  url?: string;
  context?: CliContext;
}

interface ToolInvokeOptions {
  name: string;
  args?: string;
  server?: string;
  url?: string;
  context?: CliContext;
}

interface ToolDescribeOptions {
  name: string;
  server?: string;
  url?: string;
  context?: CliContext;
}

export function createToolsCommand(context?: CliContext): Command {
  const command = new Command("tools");

  command.description("List, invoke, and describe tools from registered servers");

  command
    .command("list")
    .description("List all available tools")
    .option("--json", "Output as JSON", false)
    .option("--url <url>", "Gateway URL", "http://localhost:3000")
    .action(async (options: ToolListOptions) => {
      try {
        await toolsList({ ...options, context });
      } catch (error) {
        console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(ExitCode.CONNECTION_ERROR);
      }
    });

  command
    .command("invoke <name>")
    .description("Invoke a tool with the given name")
    .option("--args <json>", "JSON arguments for the tool")
    .option("--server <name>", "Server to use (required if multiple servers have the tool)")
    .option("--url <url>", "Gateway URL", "http://localhost:3000")
    .action(async (name: string, options: ToolInvokeOptions) => {
      try {
        await toolsInvoke(name, { ...options, context });
      } catch (error) {
        console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(ExitCode.CONNECTION_ERROR);
      }
    });

  command
    .command("describe <name>")
    .description("Describe a tool's schema and documentation")
    .option("--server <name>", "Server to use (required if multiple servers have the tool)")
    .option("--url <url>", "Gateway URL", "http://localhost:3000")
    .action(async (name: string, options: ToolDescribeOptions) => {
      try {
        await toolsDescribe(name, { ...options, context });
      } catch (error) {
        console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
        if (error instanceof Error && error.message.includes("not found")) {
          process.exit(ExitCode.NOT_FOUND);
        }
        process.exit(ExitCode.CONNECTION_ERROR);
      }
    });

  return command;
}

function buildUrl(baseUrl: string | undefined, context: CliContext | undefined): string {
  const url = new URL(`${(baseUrl ?? "http://localhost:3000").replace(/\/$/, "")}`);
  if (context?.host) url.hostname = context.host;
  if (context?.port) url.port = context.port.toString();
  return url.toString();
}

export async function toolsList(options: ToolListOptions): Promise<void> {
  const globalJson = options.context?.json;
  const useJson = options.json ?? globalJson ?? false;
  const url = new URL(`${buildUrl(options.url, options.context)}/tools`);

  try {
    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`Gateway returned ${response.status}: ${response.statusText}`);
    }

    const data = (await response.json()) as { tools: ToolInfo[] };
    const tools = data.tools;

    if (useJson) {
      console.log(JSON.stringify({ tools }, null, 2));
      return;
    }

    if (tools.length === 0) {
      console.log("No tools found.");
      return;
    }

    console.log("Tools");
    console.log("=====");

    for (const tool of tools) {
      console.log(`  ${tool.name} (${tool.server})`);
      console.log(`    ${tool.description}`);
    }
  } catch (error) {
    if (useJson) {
      console.log(
        JSON.stringify({
          error: "Could not connect to gateway",
          detail: error instanceof Error ? error.message : String(error),
        }),
      );
    } else {
      logger.error({ error, url: url.toString() }, "Failed to fetch tools");
      console.error("Error: Could not connect to gateway");
      console.error("Make sure the gateway is running (goblin start)");
    }
    process.exit(ExitCode.CONNECTION_ERROR);
  }
}

export async function toolsInvoke(name: string, options: ToolInvokeOptions): Promise<void> {
  let args: Record<string, unknown> = {};

  if (options.args) {
    try {
      args = JSON.parse(options.args);
    } catch {
      throw new Error("Invalid JSON arguments");
    }
  }

  const url = new URL(`${buildUrl(options.url, options.context)}/tools/call`);

  const body: { name: string; arguments: Record<string, unknown>; server?: string } = {
    name,
    arguments: args,
  };

  if (options.server) {
    body.server = options.server;
  }

  const response = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    throw new Error(
      (errorData["message"] as string) ||
        `Gateway returned ${response.status}: ${response.statusText}`,
    );
  }

  const result = await response.json();
  console.log(JSON.stringify(result, null, 2));
}

export async function toolsDescribe(name: string, options: ToolDescribeOptions): Promise<void> {
  const url = new URL(
    `${buildUrl(options.url, options.context)}/tools/${encodeURIComponent(name)}`,
  );

  if (options.server) {
    url.searchParams.append("server", options.server);
  }

  try {
    const response = await fetch(url.toString());

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Tool '${name}' not found`);
      }
      throw new Error(`Gateway returned ${response.status}: ${response.statusText}`);
    }

    const tool = (await response.json()) as ToolInfo;

    console.log(`Tool: ${tool.name}`);
    console.log(`Server: ${tool.server}`);
    console.log(`Description: ${tool.description}`);

    if (tool.parameters) {
      console.log("\nParameters:");
      console.log(`  Type: ${tool.parameters.type}`);

      if (tool.parameters.properties) {
        console.log("  Properties:");
        for (const [key, value] of Object.entries(tool.parameters.properties)) {
          const prop = value as { type?: string; description?: string };
          const required = tool.parameters.required?.includes(key) ? " (required)" : "";
          console.log(`    ${key}: ${prop.type}${required}`);
          if (prop.description) {
            console.log(`      ${prop.description}`);
          }
        }
      }
    }
  } catch (error) {
    if ((error as Error).message.startsWith("Tool '")) {
      throw error;
    }
    throw new Error(
      `Failed to describe tool: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

export async function toolsCommand(options: ToolListOptions): Promise<void> {
  await toolsList(options);
}
