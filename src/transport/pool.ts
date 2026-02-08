/**
 * Transport connection pool
 */

import type { ServerConfig } from "../config/schema.js";
import { createLogger } from "../observability/logger.js";
import { mcpActiveConnections } from "../observability/metrics.js";
import { HttpTransport } from "./http.js";
import type { Transport } from "./interface.js";
import { StdioTransport } from "./stdio.js";
import { StreamableHttpTransport } from "./streamable-http.js";

const logger = createLogger("transport-pool");

interface TransportEntry {
  transport: Transport;
  config: ServerConfig;
  lastUsed: number;
  draining: boolean;
  activeRequests: number;
}

export class TransportPool {
  private transports = new Map<string, TransportEntry>();
  private pendingConnections = new Map<string, Promise<Transport>>();
  private evictionInterval: Timer | null = null;
  private readonly IDLE_TIMEOUT_MS = 60 * 1000; // 1 minute default for Smart mode
  private readonly DRAINING_TIMEOUT_MS = 30000; // 30 seconds for graceful draining

  constructor() {
    // Start eviction loop
    this.evictionInterval = setInterval(() => this.runEviction(), 30000);
  }

  /**
   * Mark a server as draining - no new requests will be sent,
   * but in-flight requests can complete
   */
  async drainServer(serverName: string): Promise<void> {
    const entry = this.transports.get(serverName);
    if (!entry) {
      logger.warn({ serverName }, "Cannot drain - server not found in pool");
      return;
    }

    entry.draining = true;
    logger.info({ serverName }, "Server marked for draining");

    // Wait for active requests to complete
    await this.waitForDrain(serverName);
  }

  /**
   * Wait for a server to finish draining
   */
  private async waitForDrain(serverName: string): Promise<void> {
    const maxWait = Date.now() + this.DRAINING_TIMEOUT_MS;

    while (Date.now() < maxWait) {
      const entry = this.transports.get(serverName);
      if (!entry) {
        logger.info({ serverName }, "Server removed during draining");
        return;
      }

      if (entry.activeRequests === 0) {
        logger.info({ serverName }, "Server drained successfully");
        return;
      }

      logger.debug(
        { serverName, activeRequests: entry.activeRequests },
        "Waiting for active requests to complete",
      );
      await this.sleep(100);
    }

    logger.warn({ serverName }, "Draining timeout - force removing server");
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Increment active request count for a server
   */
  incrementActiveRequests(serverName: string): void {
    const entry = this.transports.get(serverName);
    if (entry) {
      entry.activeRequests++;
    }
  }

  /**
   * Decrement active request count for a server
   */
  decrementActiveRequests(serverName: string): void {
    const entry = this.transports.get(serverName);
    if (entry) {
      entry.activeRequests--;
    }
  }

  /**
   * Check if a server is being drained
   */
  isDraining(serverName: string): boolean {
    const entry = this.transports.get(serverName);
    return entry?.draining ?? false;
  }

  /**
   * Get server health status
   */
  getHealth(): Array<{ id: string; status: string; mode: string; draining: boolean }> {
    return Array.from(this.transports.values()).map((entry) => ({
      id: entry.config.name,
      status: entry.transport.isConnected() ? "connected" : "disconnected",
      mode: entry.config.mode || "stateful",
      draining: entry.draining,
    }));
  }

  /**
   * Get an existing transport or create a new one
   */
  async getTransport(serverConfig: ServerConfig): Promise<Transport> {
    const serverName = serverConfig.name;

    // Check if transport is being drained - don't reuse
    const drainingEntry = this.transports.get(serverName);
    if (drainingEntry?.draining) {
      throw new Error(`Server ${serverName} is being drained`);
    }

    // Check if transport already exists in cache
    const existingEntry = this.transports.get(serverName);
    if (existingEntry) {
      existingEntry.lastUsed = Date.now();
      if (!existingEntry.transport.isConnected()) {
        logger.info(
          { serverName, transport: existingEntry.config.transport },
          "Transport reconnection initiated",
        );
        await existingEntry.transport.connect();
        mcpActiveConnections.set(1, { server: serverName, transport: serverConfig.transport });
      }
      return existingEntry.transport;
    }

    // Check if a connection is already in progress
    const pendingConnection = this.pendingConnections.get(serverName);
    if (pendingConnection) {
      logger.debug({ serverName }, "Pending connection returned");
      return pendingConnection;
    }

    logger.info({ serverName, transport: serverConfig.transport }, "Transport created");
    const transport = this.createTransport(serverConfig);

    // Store the connection promise before initiating
    const connectionPromise = (async () => {
      try {
        await transport.connect();
        mcpActiveConnections.set(1, { server: serverName, transport: serverConfig.transport });

        this.transports.set(serverName, {
          transport,
          config: serverConfig,
          lastUsed: Date.now(),
          draining: false,
          activeRequests: 0,
        });

        return transport;
      } finally {
        // Always remove from pending connections, regardless of success/failure
        this.pendingConnections.delete(serverName);
      }
    })();

    // Store the promise in pendingConnections before awaiting
    this.pendingConnections.set(serverName, connectionPromise);

    return connectionPromise;
  }

  /**
   * Release a transport (disconnect and remove)
   */
  async releaseTransport(serverName: string): Promise<void> {
    const entry = this.transports.get(serverName);
    if (entry) {
      await entry.transport.disconnect();
      mcpActiveConnections.set(0, { server: serverName, transport: entry.config.transport });
      this.transports.delete(serverName);
    }
  }

  /**
   * Release all transports
   */
  async closeAll(): Promise<void> {
    if (this.evictionInterval) {
      clearInterval(this.evictionInterval);
      this.evictionInterval = null;
    }

    const promises = Array.from(this.transports.values()).map(async (entry) => {
      await entry.transport.disconnect();
      mcpActiveConnections.set(0, { server: entry.config.name, transport: entry.config.transport });
    });

    await Promise.all(promises);
    this.transports.clear();
  }

  private runEviction(): void {
    const now = Date.now();
    for (const [name, entry] of this.transports.entries()) {
      // Skip draining servers in eviction loop
      if (entry.draining) {
        continue;
      }

      // Smart mode: evict if idle
      if (entry.config.mode === "smart" && now - entry.lastUsed > this.IDLE_TIMEOUT_MS) {
        logger.info(
          { serverName: name, transport: entry.config.transport, mode: entry.config.mode },
          "Idle transport evicted",
        );
        this.releaseTransport(name).catch((err) =>
          logger.error({ error: err, serverName: name }, "Transport eviction failed"),
        );
      }

      // Stateless mode: evict immediately (or next tick) - simplified to same eviction loop for MVP
      // Ideally stateless should be released immediately after use, but we don't have explicit "release" signal from Router yet.
      // So we treat stateless as "short timeout" (e.g. ensure it doesn't stay long).
      // For now, Smart handles idle.
    }
  }

  private createTransport(config: ServerConfig): Transport {
    switch (config.transport) {
      case "stdio":
        if (!config.command) {
          throw new Error(`Server ${config.name} configured for stdio but missing command`);
        }
        return new StdioTransport({
          name: config.name,
          command: config.command,
          args: config.args,
          env: config.env,
        });

      case "sse": // Map "sse" to HttpTransport (SSE based)
      case "http": // "http" is also mapped to HttpTransport
        if (!config.url) {
          throw new Error(`Server ${config.name} configured for http/sse but missing url`);
        }
        return new HttpTransport({
          name: config.name,
          url: config.url,
        });

      case "streamablehttp":
        if (!config.url) {
          throw new Error(`Server ${config.name} configured for streamablehttp but missing url`);
        }
        return new StreamableHttpTransport({
          name: config.name,
          url: config.url,
          headers: config.headers,
        });

      default:
        throw new Error(`Unsupported transport type: ${config.transport}`);
    }
  }
}
