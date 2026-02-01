import { Command } from "commander";
import { render } from "ink";
import React from "react";
import { loadConfig } from "../../config/index.js";
import { GoblinGateway } from "../../core/gateway.js";
import { createLogger } from "../../observability/logger.js";
import type App from "../../tui/App.js";

const logger = createLogger("cli-commands");

interface StartOptions {
  tui?: boolean;
  port?: string;
  config?: string;
}

/**
 * Start the Goblin Gateway
 */
export async function startGateway(options: StartOptions): Promise<void> {
  try {
    logger.info({ options }, "Starting Goblin Gateway...");

    // Load configuration (uses default path)
    const config = await loadConfig();

    // Override port if specified
    if (options.port) {
      config.gateway.port = parseInt(options.port, 10);
    }

    // Create gateway instance
    const gateway = new GoblinGateway();

    // Handle graceful shutdown
    const shutdown = async () => {
      logger.info("Received shutdown signal");
      await gateway.stop();
      process.exit(0);
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);

    // Start the gateway
    await gateway.start();

    // Log startup message
    logger.info(
      { port: config.gateway.port, host: config.gateway.host },
      "Goblin Gateway started successfully",
    );

    // Render TUI if requested
    if (options.tui) {
      logger.info("Starting TUI mode...");
      render(<App gateway={gateway} />);
    } else {
      // Print info message
      console.log("\n🟢 Goblin Gateway is running");
      console.log(`   HTTP: http://${config.gateway.host}:${config.gateway.port}`);
      console.log(`   SSE:  http://${config.gateway.host}:${config.gateway.port}/sse`);
      console.log("\nPress Ctrl+C to stop\n");
    }

    // Keep process running
    await new Promise(() => {});
  } catch (error) {
    logger.error({ error }, "Failed to start gateway");
    process.exit(1);
  }
}

/**
 * Create the start command
 */
export function createStartCommand(): Command {
  const command = new Command("start");

  command
    .description("Start the Goblin Gateway")
    .option("--tui", "Enable TUI mode")
    .option("--port <number>", "Port to listen on")
    .option("--config <path>", "Path to config file", "~/.goblin/config.json")
    .action(async (options: StartOptions) => {
      await startGateway(options);
    });

  return command;
}
