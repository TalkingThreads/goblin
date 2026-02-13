/**
 * STDIO Server Transport implementation
 *
 * Implements the MCP 2025-11-25 STDIO transport specification:
 * - Messages are newline-delimited JSON (NDJSON)
 * - Messages MUST NOT contain embedded newlines
 * - Server reads from stdin and writes to stdout
 * - Server MAY write logs to stderr
 */

import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import type { JSONRPCMessage } from "@modelcontextprotocol/sdk/types.js";
import { createLogger } from "../observability/logger.js";

const logger = createLogger("transport-stdio-server");

/**
 * STDIO Server Transport that implements newline-delimited JSON (NDJSON)
 * per the MCP 2025-11-25 specification.
 */
export class StdioServerTransport implements Transport {
  private buffer = "";

  onclose?: () => void;
  onerror?: (error: Error) => void;
  onmessage?: (message: JSONRPCMessage) => void;

  async start(): Promise<void> {
    process.stdin.setEncoding("utf8");

    process.stdin.on("data", (chunk: string) => {
      this.handleData(chunk);
    });

    process.stdin.on("end", () => {
      logger.info("STDIO input ended");
      if (this.onclose) this.onclose();
    });

    process.stdin.on("error", (err) => {
      logger.error({ error: err }, "STDIO input error");
      if (this.onerror) this.onerror(err);
    });

    // Resume stdin in case it's paused
    process.stdin.resume();
  }

  async close(): Promise<void> {
    // Stop listening
    process.stdin.pause();
    process.stdin.removeAllListeners();
  }

  async send(message: JSONRPCMessage): Promise<void> {
    try {
      // Serialize message as single-line JSON with newline delimiter
      const json = JSON.stringify(message);
      const line = `${json}\n`;
      process.stdout.write(line);
    } catch (e) {
      logger.error({ error: e }, "Failed to send message to stdout");
      if (this.onerror) this.onerror(e as Error);
    }
  }

  private handleData(chunk: string): void {
    // Append new data to buffer
    this.buffer += chunk;

    // Process complete lines
    while (true) {
      const newlineIndex = this.buffer.indexOf("\n");

      if (newlineIndex === -1) {
        // No complete line yet, wait for more data
        return;
      }

      // Extract the line (excluding the newline)
      const line = this.buffer.substring(0, newlineIndex);
      // Remove processed line from buffer
      this.buffer = this.buffer.substring(newlineIndex + 1);

      // Skip empty lines
      if (!line.trim()) {
        continue;
      }

      // Parse the JSON message
      try {
        const message = JSON.parse(line);
        if (this.onmessage) {
          this.onmessage(message);
        }
      } catch (e) {
        logger.error({ error: e, line: line.substring(0, 200) }, "Failed to parse JSON message");
        if (this.onerror) this.onerror(e as Error);
      }
    }
  }
}
