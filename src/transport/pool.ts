/**
 * Transport connection pool
 */

import type { ServerConfig } from "../config/schema.js";
import { createLogger } from "../observability/logger.js";
import { HttpTransport } from "./http.js";
import type { Transport } from "./interface.js";
import { StdioTransport } from "./stdio.js";

const logger = createLogger("transport-pool");

export class TransportPool {
  private transports = new Map<string, Transport>();

  /**
   * Get an existing transport or create a new one
   */
  async getTransport(serverConfig: ServerConfig): Promise<Transport> {
    const existing = this.transports.get(serverConfig.name);

    if (existing) {
      if (!existing.isConnected()) {
        logger.info({ server: serverConfig.name }, "Reconnecting existing transport");
        try {
          await existing.connect();
        } catch (error) {
          // If reconnection fails, remove it and try creating new one?
          // Or propagate error? Let's propagate.
          throw error;
        }
      }
      return existing;
    }

    logger.info({ server: serverConfig.name }, "Creating new transport");
    const transport = this.createTransport(serverConfig);
    this.transports.set(serverConfig.name, transport);

    try {
      await transport.connect();
      return transport;
    } catch (error) {
      this.transports.delete(serverConfig.name);
      throw error;
    }
  }

  /**
   * Release a transport (disconnect and remove)
   */
  async releaseTransport(serverName: string): Promise<void> {
    const transport = this.transports.get(serverName);
    if (transport) {
      await transport.disconnect();
      this.transports.delete(serverName);
    }
  }

  /**
   * Release all transports
   */
  async closeAll(): Promise<void> {
    const promises = Array.from(this.transports.values()).map((t) => t.disconnect());
    await Promise.all(promises);
    this.transports.clear();
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

      default:
        throw new Error(`Unsupported transport type: ${config.transport}`);
    }
  }
}
