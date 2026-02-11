import { Command } from "commander";
import { render } from "ink";
import { initConfig } from "../../config/index.js";
import { GoblinGateway } from "../../core/gateway.js";
import { createLogger } from "../../observability/logger.js";
import { setupShutdownHandlers } from "../../observability/utils.js";
import App from "../../tui/App.js";
import type { CliContext } from "../types.js";

const logger = createLogger("cli-commands");

interface StartOptions {
  tui?: boolean;
  port?: string;
  config?: string;
}

/**
 * Start the Goblin Gateway
 */
export async function startGateway(
  options: StartOptions,
  globalContext: CliContext,
): Promise<void> {
  try {
    logger.info({ options, globalContext }, "Starting Goblin Gateway...");

    // Use config from global context (handles --config flag correctly)
    const configPath = globalContext.configPath ?? options.config;

    // Initialize config system (creates default config file if needed)
    const config = await initConfig(configPath ? { customPath: configPath } : undefined);

    // Override port if specified (use globalContext.port which is parsed by global flags)
    const portValue = globalContext.port ?? options.port;
    if (portValue !== undefined && portValue !== null) {
      const portNum = typeof portValue === "string" ? parseInt(portValue, 10) : portValue;
      if (Number.isNaN(portNum) || portNum < 1 || portNum > 65535) {
        console.error(
          `Error: Invalid port number '${portValue}'. Port must be between 1 and 65535.`,
        );
        process.exit(1);
      }
      config.gateway.port = portNum;
    }

    // Create gateway instance
    const gateway = new GoblinGateway();

    // Handle graceful shutdown with cross-platform signal handling
    const shutdown = async () => {
      logger.info("Received shutdown signal");
      await gateway.stop();
      process.exit(0);
    };

    setupShutdownHandlers(shutdown);

    // Start the gateway
    await gateway.start(config, options.config);

    // Log startup message
    logger.info(
      { port: config.gateway.port, host: config.gateway.host },
      "Goblin Gateway started successfully",
    );

    // Render TUI if requested
    if (options.tui) {
      logger.info("Starting TUI mode...");
      const { waitUntilExit } = render(<App gateway={gateway} />);
      await waitUntilExit();
      console.log("Shutting down...");
      await gateway.stop();
      process.exit(0);
    } else {
      // Print info message
      console.log("\n🟢 Goblin Gateway is running");
      console.log(`   HTTP: http://${config.gateway.host}:${config.gateway.port}/mcp`);
      console.log(`   SSE:  http://${config.gateway.host}:${config.gateway.port}/sse`);
      console.log("\nPress Ctrl+C to stop\n");

      // Keep process running
      await new Promise(() => {});
    }
  } catch (error: any) {
    logger.error(
      {
        message: error.message,
        stack: error.stack,
        error,
      },
      "Failed to start gateway",
    );
    process.exit(1);
  }
}

/**
 * Create the start command
 */
export function createStartCommand(globalContext?: CliContext): Command {
  const command = new Command("start");

  command
    .description("Start the Goblin Gateway")
    .option("--tui", "Enable TUI mode")
    .option("--port <number>", "Port to listen on")
    .option("--config <path>", "Path to config file", "~/.goblin/config.json")
    .action(async (options: StartOptions) => {
      await startGateway(options, globalContext || { verbose: false, json: false });
    });

  return command;
}
