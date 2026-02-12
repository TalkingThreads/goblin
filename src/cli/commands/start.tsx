import { Command } from "commander";
import { initConfig } from "../../config/index.js";
import { GoblinGateway } from "../../core/gateway.js";
import { redirectLogsToStderr } from "../../observability/init.js";
import { createLogger } from "../../observability/logger.js";
import { setupShutdownHandlers } from "../../observability/utils.js";
import { StdioServerTransport } from "../../transport/stdio-server.js";
import type { CliContext } from "../types.js";

interface StartOptions {
  tui?: boolean;
  port?: string;
  config?: string;
  transport?: "http" | "sse" | "stdio";
}

export type TransportType = "http" | "sse" | "stdio";

function validateTransport(value: string | undefined): TransportType | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value === "http" || value === "sse" || value === "stdio") {
    return value;
  }
  throw new Error(`Invalid transport type: ${value}. Must be one of: http, sse, stdio`);
}

async function runStdioMode(configPath?: string): Promise<void> {
  const logger = createLogger("cli-stdio");
  redirectLogsToStderr();

  logger.info({ configPath }, "Starting Goblin in STDIO mode...");

  const config = await initConfig(configPath ? { customPath: configPath } : undefined);

  if (process.env["GOBLIN_PORT"]) {
    config.gateway.port = Number.parseInt(process.env["GOBLIN_PORT"] as string, 10);
  }
  if (process.env["GOBLIN_HOST"]) {
    config.gateway.host = process.env["GOBLIN_HOST"] as string;
  }
  if (process.env["GOBLIN_AUTH_MODE"]) {
    const authMode = process.env["GOBLIN_AUTH_MODE"];
    if (authMode === "dev" || authMode === "apikey") {
      config.auth.mode = authMode;
    }
  }
  if (process.env["GOBLIN_AUTH_APIKEY"]) {
    config.auth.apiKey = process.env["GOBLIN_AUTH_APIKEY"] as string;
  }

  const gateway = new GoblinGateway();
  await gateway.initialize(config);

  const transport = new StdioServerTransport();

  if (!gateway.router) {
    throw new Error("Router not initialized");
  }

  const { GatewayServer } = await import("../../gateway/server.js");
  const server = new GatewayServer(gateway.registry, gateway.router, config);

  logger.info("Starting STDIO transport...");
  await transport.start();

  logger.info("Connecting to STDIO transport...");
  await server.connect(transport);

  const originalOnClose = transport.onclose;
  transport.onclose = () => {
    if (originalOnClose) originalOnClose();
    logger.info("Transport closed, exiting");
    process.exit(0);
  };

  const shutdown = async () => {
    logger.info("Received shutdown signal");
    await server.close();
    await gateway.stop();
    process.exit(0);
  };

  setupShutdownHandlers(shutdown);

  if (process.platform !== "win32") {
    process.on("SIGHUP", async () => {
      logger.info("Received SIGHUP, reloading configuration...");
      try {
        const { getConfigManager } = await import("../../config/manager.js");
        const manager = getConfigManager();
        const newConfig = await manager.reload();

        if (process.env["GOBLIN_PORT"]) {
          newConfig.gateway.port = Number.parseInt(process.env["GOBLIN_PORT"] as string, 10);
        }
        if (process.env["GOBLIN_HOST"]) {
          newConfig.gateway.host = process.env["GOBLIN_HOST"] as string;
        }
        if (process.env["GOBLIN_AUTH_MODE"]) {
          const authMode = process.env["GOBLIN_AUTH_MODE"];
          if (authMode === "dev" || authMode === "apikey") {
            newConfig.auth.mode = authMode;
          }
        }
        if (process.env["GOBLIN_AUTH_APIKEY"]) {
          newConfig.auth.apiKey = process.env["GOBLIN_AUTH_APIKEY"] as string;
        }

        await gateway.reloadConfig(newConfig);
        logger.info({ configPath }, "Configuration reloaded via SIGHUP");
      } catch (error) {
        logger.error({ error }, "Failed to reload configuration via SIGHUP");
      }
    });
  }

  logger.info("Goblin STDIO server running");
  process.stderr.write("Goblin STDIO server running\n");

  await new Promise(() => {});
}

async function runHttpMode(
  transportType: "http" | "sse",
  portValue: number | undefined,
  configPath?: string,
): Promise<void> {
  const logger = createLogger("cli-commands");

  logger.info({ transportType, port: portValue, configPath }, "Starting Goblin Gateway...");

  const config = await initConfig(configPath ? { customPath: configPath } : undefined);

  if (portValue !== undefined) {
    if (Number.isNaN(portValue) || portValue < 1 || portValue > 65535) {
      console.error(`Error: Invalid port number '${portValue}'. Port must be between 1 and 65535.`);
      process.exit(1);
    }
    config.gateway.port = portValue;
  }

  const gateway = new GoblinGateway();

  const shutdown = async () => {
    logger.info("Received shutdown signal");
    await gateway.stop();
    process.exit(0);
  };

  setupShutdownHandlers(shutdown);

  await gateway.start(config, configPath, transportType);

  logger.info(
    { port: config.gateway.port, host: config.gateway.host, transportType },
    "Goblin Gateway started successfully",
  );

  console.log("\n🟢 Goblin Gateway is running");
  console.log(`   REST API: http://${config.gateway.host}:${config.gateway.port}/`);
  if (transportType === "http") {
    console.log(`   MCP:      http://${config.gateway.host}:${config.gateway.port}/mcp`);
  } else {
    console.log(`   SSE:      http://${config.gateway.host}:${config.gateway.port}/sse`);
    console.log(`   Messages: http://${config.gateway.host}:${config.gateway.port}/messages`);
  }
  console.log("\nPress Ctrl+C to stop\n");

  await new Promise(() => {});
}

export async function startGateway(
  options: StartOptions,
  globalContext: CliContext,
): Promise<void> {
  const logger = createLogger("cli-commands");

  try {
    const transportType = validateTransport(options.transport);
    const configPath = globalContext.configPath ?? options.config;
    const portNum = typeof options.port === "string" ? parseInt(options.port, 10) : undefined;

    if (transportType === undefined || transportType === "stdio") {
      await runStdioMode(configPath);
    } else if (transportType === "http" || transportType === "sse") {
      await runHttpMode(transportType, portNum, configPath);
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.error(
        {
          message: error.message,
          stack: error.stack,
          error,
        },
        "Failed to start gateway",
      );
      console.error(`Error: ${error.message}`);
    } else {
      logger.error({ error }, "Failed to start gateway with unknown error");
      console.error("Error: Unknown error occurred");
    }
    process.exit(1);
  }
}

export function createStartCommand(_globalContext?: CliContext): Command {
  const command = new Command("start");

  command
    .description("Start the Goblin Gateway")
    .option("-t, --transport <type>", "Transport type: http, sse, stdio (default: stdio)")
    .option("--tui", "Enable TUI mode")
    .option("--port <number>", "Port to listen on")
    .option("--config <path>", "Path to config file", "~/.goblin/config.json")
    .action(async (options: StartOptions) => {
      await startGateway(options, _globalContext || { verbose: false, json: false });
    });

  return command;
}
