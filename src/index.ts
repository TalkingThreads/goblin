import { ConfigWatcher, generateSchema, loadConfig } from "./config/index.js";
import { createLogger } from "./observability/logger.js";
import { TransportPool } from "./transport/index.js";

const logger = createLogger("goblin");

async function main(): Promise<void> {
  logger.info("Starting Goblin MCP Gateway...");

  // Generate JSON Schema for editor support
  await generateSchema();

  // Load configuration
  const config = await loadConfig();
  logger.info({ serverCount: config.servers.length }, "Configuration loaded");

  // Initialize transport pool
  const transportPool = new TransportPool();

  // Connect to enabled servers
  for (const server of config.servers) {
    if (server.enabled) {
      try {
        await transportPool.getTransport(server);
      } catch (error) {
        logger.error({ server: server.name, error }, "Failed to connect to server");
      }
    }
  }

  // Start config watcher for hot reload
  const watcher = new ConfigWatcher(config);
  watcher.on("updated", (newConfig) => {
    logger.info({ serverCount: newConfig.servers.length }, "Configuration updated");
    // TODO: Apply config changes to running services
  });
  watcher.start();

  // TODO: MVP-2.1 - Initialize registry
  // TODO: MVP-2.2 - Initialize router
  // TODO: MVP-3.1 - Start MCP server
  // TODO: MVP-3.2 - Start HTTP server (Hono)

  logger.info("Goblin MCP Gateway ready");
}

main().catch((error: unknown) => {
  logger.error({ error }, "Fatal error starting Goblin");
  process.exit(1);
});

export { main };
