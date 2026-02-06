import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { Command } from "commander";
import { z } from "zod";
import { getConfigPath } from "../../config/paths.js";
import type { Config, ServerConfig } from "../../config/schema.js";
import { writeConfig } from "../../config/writer.js";
import { createLogger } from "../../observability/logger.js";

const logger = createLogger("cli-servers");

const TransportTypeSchema = z.enum(["stdio", "http", "sse", "streamablehttp"]);

interface ServerOptions {
  json?: boolean;
  url?: string;
  status?: "online" | "offline" | "all";
}

interface ServerInfo {
  name: string;
  transport: string;
  status: "online" | "offline";
  enabled: boolean;
  tools: number;
}

interface AddServerOptions {
  name: string;
  transport: string;
  command?: string;
  args?: string[];
  httpUrl?: string;
  headers?: Record<string, string>;
  enabled?: boolean;
  yes?: boolean;
  config?: string;
}

function isValidTransport(
  transport: string,
): transport is "stdio" | "http" | "sse" | "streamablehttp" {
  return TransportTypeSchema.safeParse(transport).success;
}

async function loadConfig(configPath?: string): Promise<Config> {
  const path = configPath ?? getConfigPath();
  if (!existsSync(path)) {
    throw new Error(`Configuration file not found: ${path}`);
  }
  const content = await readFile(path, "utf-8");
  return JSON.parse(content) as Config;
}

async function saveConfig(config: Config, configPath?: string): Promise<void> {
  await writeConfig(config, { customPath: configPath, includeComments: false });
}

async function addServer(options: AddServerOptions): Promise<void> {
  const configPath = options.config;
  const config = await loadConfig(configPath);

  if (!isValidTransport(options.transport)) {
    throw new Error(
      `Invalid transport type: ${options.transport}. Valid types: stdio, http, sse, streamablehttp`,
    );
  }

  const existingServer = config.servers?.find((s) => s.name === options.name);
  if (existingServer) {
    throw new Error(`Server with name '${options.name}' already exists`);
  }

  const serverConfig: ServerConfig = {
    name: options.name,
    transport: options.transport,
    mode: "stateful",
    enabled: options.enabled ?? true,
  };

  if (options.transport === "stdio") {
    if (!options.command) {
      throw new Error("STDIO transport requires --command option");
    }
    serverConfig.command = options.command;
    if (options.args) {
      serverConfig.args = options.args;
    }
  } else if (
    options.transport === "http" ||
    options.transport === "sse" ||
    options.transport === "streamablehttp"
  ) {
    if (!options.httpUrl) {
      throw new Error(`${options.transport} transport requires --url option`);
    }
    serverConfig.url = options.httpUrl;
    if (options.headers) {
      serverConfig.headers = options.headers;
    }
  }

  if (!config.servers) {
    config.servers = [];
  }
  config.servers.push(serverConfig);

  await saveConfig(config, configPath);

  console.log(`Server '${options.name}' added successfully.`);
  console.log(`  Transport: ${options.transport}`);
  if (options.transport === "stdio") {
    console.log(`  Command: ${serverConfig.command}`);
    if (serverConfig.args) {
      console.log(`  Args: ${serverConfig.args.join(" ")}`);
    }
  } else {
    console.log(`  URL: ${serverConfig.url}`);
  }
  console.log(`  Enabled: ${serverConfig.enabled}`);
  console.log(`\nConfiguration saved to: ${configPath ?? getConfigPath()}`);
}

async function enableServer(options: {
  name: string;
  yes?: boolean;
  config?: string;
}): Promise<void> {
  const configPath = options.config;
  const config = await loadConfig(configPath);

  const server = config.servers?.find((s) => s.name === options.name);
  if (!server) {
    throw new Error(`Server '${options.name}' not found`);
  }

  if (server.enabled) {
    throw new Error(`Server '${options.name}' is already enabled`);
  }

  console.log(`Server to enable:`);
  console.log(`  Name: ${server.name}`);
  console.log(`  Transport: ${server.transport}`);
  console.log(`  Current Status: disabled`);

  if (!options.yes) {
    console.log("\nThis will enable the server.");
    console.log("Use --yes to skip this confirmation.");
    throw new Error("Confirmation required. Run with --yes to confirm.");
  }

  server.enabled = true;
  await saveConfig(config, configPath);

  console.log(`\nServer '${options.name}' enabled successfully.`);
  console.log(`Configuration saved to: ${configPath ?? getConfigPath()}`);
}

async function disableServer(options: {
  name: string;
  yes?: boolean;
  config?: string;
}): Promise<void> {
  const configPath = options.config;
  const config = await loadConfig(configPath);

  const server = config.servers?.find((s) => s.name === options.name);
  if (!server) {
    throw new Error(`Server '${options.name}' not found`);
  }

  if (!server.enabled) {
    throw new Error(`Server '${options.name}' is already disabled`);
  }

  console.log(`Server to disable:`);
  console.log(`  Name: ${server.name}`);
  console.log(`  Transport: ${server.transport}`);
  console.log(`  Current Status: enabled`);

  if (!options.yes) {
    console.log("\nThis will disable the server.");
    console.log("Use --yes to skip this confirmation.");
    throw new Error("Confirmation required. Run with --yes to confirm.");
  }

  server.enabled = false;
  await saveConfig(config, configPath);

  console.log(`\nServer '${options.name}' disabled successfully.`);
  console.log(`Configuration saved to: ${configPath ?? getConfigPath()}`);
}

/**
 * Create the servers command with add subcommand
 */
export function createServersCommand(): Command {
  const command = new Command("servers");

  command.description("List and manage configured servers");

  command
    .command("add <name> <transport>")
    .description("Add a new server to the configuration")
    .option("--command <command>", "Command to execute (for stdio transport)")
    .option("--args <args...>", "Arguments for the command (for stdio transport)")
    .option("--url <url>", "URL for HTTP/SSE/streamablehttp transports")
    .option("--header <key:value>", "Custom headers (can be used multiple times)")
    .option("--enabled", "Enable the server (default: true)", true)
    .option("--disabled", "Disable the server")
    .option("--yes", "Skip confirmation prompt", false)
    .option("--config <path>", "Path to config file")
    .action(
      async (
        name: string,
        transport: string,
        options: {
          command?: string;
          args?: string[];
          url?: string;
          header?: string | string[];
          enabled?: boolean;
          disabled?: boolean;
          yes?: boolean;
          config?: string;
        },
      ) => {
        try {
          const headers: Record<string, string> = {};
          if (options.header) {
            const headerArray = Array.isArray(options.header) ? options.header : [options.header];
            for (const h of headerArray) {
              const [key, value] = h.split(":");
              if (!key || !value) {
                throw new Error(`Invalid header format: ${h}. Use --header "Key:Value"`);
              }
              headers[key.trim()] = value.trim();
            }
          }

          await addServer({
            name,
            transport,
            command: options.command,
            args: options.args,
            httpUrl: options.url,
            headers: Object.keys(headers).length > 0 ? headers : undefined,
            enabled: options.disabled ? false : options.enabled,
            yes: options.yes,
            config: options.config,
          });
        } catch (error) {
          console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
          process.exit(1);
        }
      },
    );

  command
    .command("remove <name>")
    .description("Remove a server from the configuration")
    .option("--yes", "Skip confirmation prompt", false)
    .option("--config <path>", "Path to config file")
    .action(async (name: string, options: { yes?: boolean; config?: string }) => {
      try {
        const configPath = options.config;
        const config = await loadConfig(configPath);

        const serverIndex = config.servers?.findIndex((s) => s.name === name);
        if (serverIndex === undefined || serverIndex === -1) {
          throw new Error(`Server '${name}' not found`);
        }

        const server = config.servers[serverIndex];
        if (!server) {
          throw new Error(`Server '${name}' not found`);
        }
        console.log(`Server to remove:`);
        console.log(`  Name: ${server.name}`);
        console.log(`  Transport: ${server.transport}`);

        if (!options.yes) {
          console.log("\nThis action cannot be undone.");
          console.log("Use --yes to skip this confirmation.");
          throw new Error("Confirmation required. Run with --yes to confirm.");
        }

        config.servers.splice(serverIndex, 1);
        await saveConfig(config, configPath);

        console.log(`\nServer '${name}' removed successfully.`);
        console.log(`Configuration saved to: ${configPath ?? getConfigPath()}`);
      } catch (error) {
        console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
      }
    });

  command
    .command("enable <name>")
    .description("Enable a disabled server")
    .option("--yes", "Skip confirmation prompt", false)
    .option("--config <path>", "Path to config file")
    .action(async (name: string, options: { yes?: boolean; config?: string }) => {
      try {
        await enableServer({ name, yes: options.yes, config: options.config });
      } catch (error) {
        console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
      }
    });

  command
    .command("disable <name>")
    .description("Disable an enabled server")
    .option("--yes", "Skip confirmation prompt", false)
    .option("--config <path>", "Path to config file")
    .action(async (name: string, options: { yes?: boolean; config?: string }) => {
      try {
        await disableServer({ name, yes: options.yes, config: options.config });
      } catch (error) {
        console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
      }
    });

  return command;
}

/**
 * Execute the servers command
 */
export async function serversCommand(options: ServerOptions): Promise<void> {
  const url = options.url || "http://localhost:3000";
  const serversUrl = new URL(`${url.replace(/\/$/, "")}/servers`);

  if (options.status && options.status !== "all") {
    serversUrl.searchParams.append("status", options.status);
  }

  try {
    const response = await fetch(serversUrl.toString());

    if (!response.ok) {
      throw new Error(`Gateway returned ${response.status}: ${response.statusText}`);
    }

    const { servers } = (await response.json()) as { servers: ServerInfo[] };

    if (options.json) {
      console.log(JSON.stringify({ servers }));
      return;
    }

    if (servers.length === 0) {
      console.log("No servers found.");
      return;
    }

    console.log("Servers");
    console.log("=======");

    // Find column widths for alignment
    const nameWidth = Math.max(...servers.map((s) => s.name.length), 10) + 2;
    const transportWidth = Math.max(...servers.map((s) => s.transport.length), 10) + 2;
    const enabledWidth = 10;

    for (const server of servers) {
      const name = server.name.padEnd(nameWidth);
      const transport = server.transport.padEnd(transportWidth);
      const statusIcon = server.status === "online" ? "●" : "○";
      const statusText = server.status.padEnd(10);
      const enabledText = (server.enabled ? "enabled" : "disabled").padEnd(enabledWidth);
      const toolCount = `${server.tools} tools`;

      console.log(`${name}${transport}${statusIcon} ${statusText}${enabledText}${toolCount}`);
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
      logger.error({ error, url: serversUrl.toString() }, "Failed to fetch servers");
      console.error(`Error: Could not connect to gateway at ${url}`);
      console.error("Make sure the gateway is running (goblin start)");
    }
    process.exit(1);
  }
}
