/**
 * STDIO Transport implementation
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { SERVER_NAME, SERVER_VERSION } from "../meta.js";
import { createLogger } from "../observability/logger.js";
import { type Transport, TransportState } from "./interface.js";

const logger = createLogger("transport-stdio");

export interface StdioTransportConfig {
  command: string;
  args?: string[];
  env?: Record<string, string>;
  name: string; // Server name for logging/client identification
}

export class StdioTransport implements Transport {
  readonly type = "stdio";
  private _state: TransportState = TransportState.Disconnected;
  private transport: StdioClientTransport | null = null;
  private client: Client | null = null;

  constructor(private config: StdioTransportConfig) {}

  get state(): TransportState {
    return this._state;
  }

  isConnected(): boolean {
    return this._state === TransportState.Connected;
  }

  getClient(): Client {
    if (!this.client || this._state !== TransportState.Connected) {
      throw new Error("Transport not connected");
    }
    return this.client;
  }

  async connect(): Promise<void> {
    if (this._state === TransportState.Connected || this._state === TransportState.Connecting) {
      return;
    }

    this._state = TransportState.Connecting;
    logger.info({ server: this.config.name }, "Connecting to STDIO server");

    try {
      this.transport = new StdioClientTransport({
        command: this.config.command,
        args: this.config.args,
        env: { ...process.env, ...this.config.env } as Record<string, string>,
        stderr: "inherit", // Pipe stderr to parent for debugging
      });

      this.client = new Client(
        {
          name: SERVER_NAME,
          version: SERVER_VERSION,
        },
        {
          capabilities: {},
        },
      );

      // Handle transport errors
      this.transport.onerror = (error) => {
        logger.error({ server: this.config.name, error }, "Transport error");
        this._state = TransportState.Error;
        // TODO: Trigger reconnection or cleanup
      };

      this.transport.onclose = () => {
        logger.info({ server: this.config.name }, "Transport closed");
        this._state = TransportState.Disconnected;
        this.client = null;
        this.transport = null;
      };

      await this.client.connect(this.transport);
      this._state = TransportState.Connected;

      logger.info({ server: this.config.name }, "Connected to STDIO server");
    } catch (error) {
      logger.error({ server: this.config.name, error }, "Failed to connect to STDIO server");
      this._state = TransportState.Error;
      this.cleanup();
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this._state === TransportState.Disconnected) {
      return;
    }

    logger.info({ server: this.config.name }, "Disconnecting from STDIO server");

    try {
      if (this.client) {
        await this.client.close();
      } else if (this.transport) {
        await this.transport.close();
      }
    } catch (error) {
      logger.error({ server: this.config.name, error }, "Error disconnecting transport");
    } finally {
      this.cleanup();
    }
  }

  private cleanup(): void {
    this._state = TransportState.Disconnected;
    this.client = null;
    this.transport = null;
  }
}
