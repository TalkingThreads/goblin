import { ConfigWatcher, generateSchema, loadConfig } from "./config/index.js";
import { createLogger } from "./observability/logger.js";

const logger = createLogger("goblin");

async function main(): Promise<void> {
  logger.info("Starting Goblin MCP Gateway...");

  // Generate JSON Schema for editor support
  await generateSchema();

  // Load configuration
  const config = await loadConfig();
  logger.info({ serverCount: config.servers.length }, "Configuration loaded");

  // Start config watcher for hot reload
  const watcher = new ConfigWatcher(config);
  watcher.on("updated", (newConfig) => {
    logger.info({ serverCount: newConfig.servers.length }, "Configuration updated");
    // TODO: Apply config changes to running services
  });
  watcher.start();

  // TODO: MVP-1.3 - Initialize transport adapters
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
