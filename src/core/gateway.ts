import { ConfigWatcher, generateSchema, loadConfig } from "../config/index.js";
import { HttpGateway, Registry, Router } from "../gateway/index.js";
import { createLogger } from "../observability/logger.js";
import { catalogList, catalogSearch } from "../tools/meta/catalog.js";
import { health } from "../tools/meta/health.js";
import { describeServer, searchServers } from "../tools/meta/server.js";
import { describeTool, invokeTool } from "../tools/meta/tool.js";
import { TransportPool } from "../transport/index.js";

const logger = createLogger("core");

/**
 * Goblin Gateway Core
 * Encapsulates the runtime state and lifecycle
 */
export class GoblinGateway {
  public registry: Registry;
  public router: Router;
  public transportPool: TransportPool;
  public httpGateway: HttpGateway | null = null;
  public configWatcher: ConfigWatcher | null = null;

  constructor() {
    this.registry = new Registry();
    this.transportPool = new TransportPool();
    // Router requires config, so it's initialized in start()
    this.router = null as any;
  }

  /**
   * Initialize and start the gateway
   */
  async start(): Promise<void> {
    logger.info("Starting Goblin Gateway Core...");

    // Generate Schema
    await generateSchema();

    // Load Config
    const config = await loadConfig();
    this.router = new Router(this.registry, this.transportPool, config);

    // Register Meta Tools
    this.registerMetaTools();

    // Start HTTP
    this.httpGateway = new HttpGateway(this.registry, this.router, config);
    this.httpGateway.start();

    // Connect Servers
    for (const server of config.servers) {
      if (server.enabled) {
        try {
          const transport = await this.transportPool.getTransport(server);
          await this.registry.addServer(server.name, transport.getClient());
        } catch (error) {
          logger.error({ server: server.name, error }, "Failed to connect to server");
        }
      }
    }

    // Watch Config
    this.configWatcher = new ConfigWatcher(config);
    this.configWatcher.on("updated", (newConfig) => {
      logger.info({ serverCount: newConfig.servers.length }, "Configuration updated");
      // TODO: Implement hot reload logic
    });
    this.configWatcher.start();

    logger.info("Goblin Gateway Core ready");
  }

  /**
   * Stop the gateway
   */
  async stop(): Promise<void> {
    logger.info("Stopping Goblin Gateway...");
    if (this.configWatcher) {
      this.configWatcher.stop();
    }
    // HttpGateway stop? It uses Bun.serve which doesn't have an easy stop without reference?
    // Actually Bun.serve returns a server object with .stop().
    // We need to update HttpGateway to expose stop.

    await this.transportPool.closeAll();
  }

  private registerMetaTools(): void {
    this.registry.registerLocalTool(catalogList);
    this.registry.registerLocalTool(catalogSearch);
    this.registry.registerLocalTool(health);
    this.registry.registerLocalTool(describeServer);
    this.registry.registerLocalTool(searchServers);
    this.registry.registerLocalTool(describeTool);
    this.registry.registerLocalTool(invokeTool);
  }
}
