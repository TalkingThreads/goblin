/**
 * Transport interface for connecting to backend MCP servers
 */

import type { Client } from "@modelcontextprotocol/sdk/client/index.js";

/**
 * Transport connection state
 */
export enum TransportState {
  Disconnected = "disconnected",
  Connecting = "connecting",
  Connected = "connected",
  Error = "error",
}

/**
 * Transport interface
 */
export interface Transport {
  /**
   * Type of transport
   */
  readonly type: "stdio" | "http" | "sse" | "streamablehttp";

  /**
   * Current connection state
   */
  readonly state: TransportState;

  /**
   * Connect to the backend server
   */
  connect(): Promise<void>;

  /**
   * Disconnect from the backend server
   */
  disconnect(): Promise<void>;

  /**
   * Check if currently connected
   */
  isConnected(): boolean;

  /**
   * Get the underlying SDK Client instance
   * Throws if not connected
   */
  getClient(): Client;
}
