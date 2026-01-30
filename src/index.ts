import { ConfigWatcher, generateSchema, loadConfig } from "./config/index.js";
import { HttpGateway, Registry, Router } from "./gateway/index.js";
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

  // Initialize core components
  const transportPool = new TransportPool();
  const registry = new Registry();
  const router = new Router(registry, transportPool, config);

  // Start HTTP Gateway
  const httpGateway = new HttpGateway(registry, router, config);
  httpGateway.start();

  // Connect to enabled servers
  for (const server of config.servers) {
    if (server.enabled) {
      try {
        const transport = await transportPool.getTransport(server);
        await registry.addServer(server.name, transport.getClient());
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

  logger.info("Goblin MCP Gateway ready");
}

main().catch((error: unknown) => {
  logger.error({ error }, "Fatal error starting Goblin");
  process.exit(1);
});

export { main };
