import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { cancel, isCancel, select, text } from "@clack/prompts";
import { getConfigPath } from "../../../config/paths.js";
import type { Config, ServerConfig, TransportType } from "../../../config/schema.js";
import { writeConfig } from "../../../config/writer.js";
import { ExitCode } from "../../exit-codes.js";

const ServerNameSchemaPattern = /^[a-zA-Z][a-zA-Z0-9_-]{2,63}$/;

interface AddServerInteractiveOptions {
  config?: string;
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

function validateServerName(name: string, existingNames: string[]): string | null {
  if (!name || !name.trim()) {
    return "Server name is required";
  }

  if (name.length < 3) {
    return "Server name must be at least 3 characters";
  }

  if (name.length > 64) {
    return "Server name must be at most 64 characters";
  }

  if (!ServerNameSchemaPattern.test(name)) {
    return "Server name must contain only letters, numbers, dashes, and underscores";
  }

  if (existingNames.includes(name)) {
    return "A server with this name already exists";
  }

  return null;
}

function validateUrl(url: string): string | null {
  if (!url || !url.trim()) {
    return "URL is required";
  }

  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return "Please enter a valid URL (http:// or https://)";
  }

  try {
    new URL(url);
    return null;
  } catch {
    return "Please enter a valid URL (http:// or https://)";
  }
}

export async function addServerInteractive(options?: AddServerInteractiveOptions): Promise<void> {
  if (!process.stdin.isTTY) {
    console.error("Interactive mode requires a terminal");
    process.exit(ExitCode.INVALID_ARGUMENTS);
  }

  const configPath = options?.config;
  let config: Config;

  try {
    config = await loadConfig(configPath);
  } catch {
    config = {
      servers: [],
      gateway: { port: 3000, host: "127.0.0.1", transport: "both" },
      streamableHttp: { sseEnabled: true, sessionTimeout: 300000, maxSessions: 1000 },
      auth: { mode: "dev" },
      policies: { outputSizeLimit: 65536, defaultTimeout: 30000 },
    };
  }

  const existingServerNames = config.servers?.map((s) => s.name) ?? [];

  let serverName: string;
  while (true) {
    const nameInput = await text({
      message: "Enter server name:",
      placeholder: "my-server",
      validate: (value) => {
        const error = validateServerName(value ?? "", existingServerNames);
        if (error) {
          return error;
        }
        return undefined;
      },
    });

    if (isCancel(nameInput)) {
      cancel("Cancelled");
      process.exit(ExitCode.SUCCESS);
    }

    if (!nameInput) {
      console.error("Error: Server name is required");
      continue;
    }

    serverName = nameInput.trim();
    const nameError = validateServerName(serverName, existingServerNames);
    if (nameError) {
      console.error(`Error: ${nameError}`);
      continue;
    }

    break;
  }

  const transportTypeResult = await select({
    message: "Select transport type:",
    options: [
      { value: "stdio", label: "stdio", hint: "Local process via stdin/stdout" },
      { value: "http", label: "http", hint: "Legacy HTTP transport" },
      { value: "sse", label: "sse", hint: "Server-Sent Events transport" },
      {
        value: "streamablehttp",
        label: "streamablehttp",
        hint: "Modern Streamable HTTP transport (MCP 1.x)",
      },
    ],
  });

  if (isCancel(transportTypeResult)) {
    cancel("Cancelled");
    process.exit(ExitCode.SUCCESS);
  }

  const transportType = transportTypeResult as TransportType;

  const serverConfig: Partial<ServerConfig> = {
    name: serverName,
    transport: transportType,
    mode: "stateful",
    enabled: true,
  };

  if (transportType === "stdio") {
    let command: string;
    while (true) {
      const commandInput = await text({
        message: "Enter command:",
        placeholder: "npx",
        validate: (value) => {
          if (!value || !value.trim()) {
            return "Command is required";
          }
          return undefined;
        },
      });

      if (isCancel(commandInput)) {
        cancel("Cancelled");
        process.exit(ExitCode.SUCCESS);
      }

      if (!commandInput) {
        console.error("Error: Command is required");
        continue;
      }

      command = commandInput.trim();
      break;
    }

    serverConfig.command = command;

    const argsInput = await text({
      message: "Enter arguments (optional, press Enter to skip):",
      placeholder: "@modelcontextprotocol/server-filesystem ./data",
    });

    if (isCancel(argsInput)) {
      cancel("Cancelled");
      process.exit(ExitCode.SUCCESS);
    }

    if (argsInput?.trim()) {
      const tokens = argsInput.trim().split(/\s+/);
      serverConfig.args = tokens;
    }
  } else {
    let url: string;
    while (true) {
      const urlInput = await text({
        message: "Enter URL:",
        placeholder: "https://api.example.com/mcp",
        validate: (value) => {
          const error = validateUrl(value ?? "");
          if (error) {
            return error;
          }
          return undefined;
        },
      });

      if (isCancel(urlInput)) {
        cancel("Cancelled");
        process.exit(ExitCode.SUCCESS);
      }

      if (!urlInput) {
        console.error("Error: URL is required");
        continue;
      }

      url = urlInput.trim();
      const urlError = validateUrl(url);
      if (urlError) {
        console.error(`Error: ${urlError}`);
        continue;
      }

      break;
    }

    serverConfig.url = url;
  }

  const enabledConfirm = await select({
    message: "Enable server after adding?",
    options: [
      { value: "true", label: "Yes", hint: "Server will be available immediately" },
      { value: "false", label: "No", hint: "Server will be disabled" },
    ],
    initialValue: "true",
  });

  if (isCancel(enabledConfirm)) {
    cancel("Cancelled");
    process.exit(ExitCode.SUCCESS);
  }

  serverConfig.enabled = enabledConfirm === "true";

  console.log("\nAdding server:");
  console.log(`  Name: ${serverName}`);
  console.log(`  Transport: ${transportType}`);
  if (transportType === "stdio") {
    console.log(`  Command: ${serverConfig.command}`);
    if (serverConfig.args && serverConfig.args.length > 0) {
      console.log(`  Args: ${serverConfig.args.join(" ")}`);
    }
  } else {
    console.log(`  URL: ${serverConfig.url}`);
  }
  console.log(`  Enabled: ${serverConfig.enabled}`);

  const confirm = await select({
    message: "Continue?",
    options: [
      { value: "yes", label: "Yes", hint: "Add the server to configuration" },
      { value: "no", label: "No", hint: "Cancel and exit" },
    ],
    initialValue: "yes",
  });

  if (isCancel(confirm) || confirm === "no") {
    cancel("Cancelled");
    process.exit(ExitCode.SUCCESS);
  }

  const servers = config.servers ?? [];

  const newServer: ServerConfig = {
    name: serverName,
    transport: transportType,
    mode: "stateful",
    enabled: serverConfig.enabled ?? true,
  };

  if (transportType === "stdio") {
    newServer.command = serverConfig.command;
    if (serverConfig.args) {
      newServer.args = serverConfig.args;
    }
  } else {
    newServer.url = serverConfig.url;
  }

  servers.push(newServer);

  const fullConfig: Config = {
    servers,
    gateway: config.gateway,
    streamableHttp: config.streamableHttp,
    auth: config.auth,
    policies: config.policies,
    virtualTools: config.virtualTools,
    logging: config.logging,
  };

  try {
    await saveConfig(fullConfig, configPath);
  } catch (error) {
    console.error(
      `Error saving configuration: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exit(ExitCode.CONFIG_ERROR);
  }

  console.log(`\n✓ Server '${serverName}' added successfully.`);
  console.log(`  Transport: ${transportType}`);
  if (transportType === "stdio") {
    console.log(`  Command: ${newServer.command}`);
    if (newServer.args) {
      console.log(`  Args: ${newServer.args.join(" ")}`);
    }
  } else {
    console.log(`  URL: ${newServer.url}`);
  }
  console.log(`  Enabled: ${newServer.enabled}`);
  console.log(`\nConfiguration saved to: ${configPath ?? getConfigPath()}`);

  if (newServer.enabled) {
    console.log("\nServer is now available. You can start using it immediately!");
  } else {
    console.log(
      "\nServer has been added but is disabled. Enable it with 'goblin servers enable <name>'",
    );
  }
}
