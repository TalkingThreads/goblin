import { Command } from "commander";
import { getConfigManager, initConfig } from "../../config/manager.js";
import { GoblinGateway } from "../../core/gateway.js";
import { GatewayServer } from "../../gateway/server.js";
import { createLogger, setLogToStderr } from "../../observability/logger.js";
import { setupShutdownHandlers } from "../../observability/utils.js";
import { StdioServerTransport } from "../../transport/stdio-server.js";

const logger = createLogger("cli-stdio");

interface StdioOptions {
  config?: string;
  port?: string; // Kept for compatibility/config override if we support it
}

/**
 * Start Goblin in STDIO mode
 */
export async function startStdioGateway(options: StdioOptions): Promise<void> {
  try {
    // 1. Force logs to stderr to keep stdout clean for JSON-RPC
    setLogToStderr(true);
    logger.info({ options }, "Starting Goblin in STDIO mode...");

    // 2. Initialize config via ConfigManager
    const config = await initConfig(options.config ? { customPath: options.config } : undefined);

    // Apply environment overrides
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

    // 3. Initialize Core (Config, Registry, Router, Backends)
    const gateway = new GoblinGateway();

    // Initialize with our overridden config
    await gateway.initialize(config);

    // 4. Create STDIO Transport
    const transport = new StdioServerTransport();

    // 5. Create Gateway Server (MCP Server)
    if (!gateway.router) {
      throw new Error("Router not initialized");
    }

    // We explicitly create a single GatewayServer instance for the STDIO connection
    const server = new GatewayServer(gateway.registry, gateway.router, config);

    // 6. Connect Transport
    logger.info("Connecting to STDIO transport...");
    await server.connect(transport);

    // Monitor transport closure (e.g. parent process exit)
    // We need to hook into this to ensure we exit when the connection closes
    const originalOnClose = transport.onclose;
    transport.onclose = () => {
      if (originalOnClose) originalOnClose();
      logger.info("Transport closed, exiting");
      process.exit(0);
    };

    // 7. Setup Shutdown
    setupShutdownHandlers(async () => {
      logger.info("Received shutdown signal");
      await server.close();
      await gateway.stop(); // Stops backends and config watcher
      process.exit(0);
    });

    // 8. Setup SIGHUP Config Reload (Unix-only)
    if (process.platform !== "win32") {
      process.on("SIGHUP", async () => {
        logger.info("Received SIGHUP, reloading configuration...");
        try {
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
          logger.info({ configPath: options.config }, "Configuration reloaded via SIGHUP");
        } catch (error) {
          logger.error({ error }, "Failed to reload configuration via SIGHUP");
        }
      });
    }

    logger.info("Goblin STDIO server running");

    // 8. Keep process alive
    await new Promise(() => {});
  } catch (error: unknown) {
    // Ensure we log to stderr even if logger fails (though logger is set to stderr)
    if (error instanceof Error) {
      logger.error(
        {
          message: error.message,
          stack: error.stack,
          error,
        },
        "Failed to start STDIO gateway",
      );
      process.stderr.write(`Fatal Error: ${error.message}\n`);
    } else {
      logger.error({ error }, "Failed to start STDIO gateway with unknown error");
      process.stderr.write(`Fatal Error: Unknown error\n`);
    }
    process.exit(1);
  }
}

/**
 * Create the stdio command
 */
export function createStdioCommand(): Command {
  const command = new Command("stdio");

  command
    .description("Start Goblin in STDIO mode (for CLI/subprocess integration)")
    .option("--config <path>", "Path to config file", "~/.goblin/config.json")
    .option("--port <number>", "Port override (ignored in STDIO mode but accepted)")
    .action(async (options: StdioOptions) => {
      await startStdioGateway(options);
    });

  return command;
}
