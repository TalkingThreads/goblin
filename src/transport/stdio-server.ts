/**
 * STDIO Server Transport implementation
 */

import { Buffer } from "node:buffer";
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import type { JSONRPCMessage } from "@modelcontextprotocol/sdk/types.js";
import { createLogger } from "../observability/logger.js";

const logger = createLogger("transport-stdio-server");

/**
 * STDIO Server Transport that implements JSON-RPC message framing
 */
export class StdioServerTransport implements Transport {
  private buffer: Buffer = Buffer.alloc(0);

  onclose?: () => void;
  onerror?: (error: Error) => void;
  onmessage?: (message: JSONRPCMessage) => void;

  async start(): Promise<void> {
    process.stdin.on("data", (chunk: Buffer) => {
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
      const json = JSON.stringify(message) as string;
      const len = Buffer.byteLength(json, "utf8");
      // Use \r\n\r\n as separator per MCP spec
      const headers = `Content-Length: ${len}\r\n\r\n`;
      const success = process.stdout.write(headers + json);

      // If write buffer is full, we might need to wait for drain?
      // But typically for stdio we just write.
      if (!success) {
        // process.stdout.once('drain', ...)
        // But async send() implies we wait?
        // For now, fire and forget as is common, or improve if needed.
      }
    } catch (e) {
      logger.error({ error: e }, "Failed to send message to stdout");
      if (this.onerror) this.onerror(e as Error);
    }
  }

  private handleData(chunk: Buffer): void {
    // Append new data
    this.buffer = Buffer.concat([this.buffer, chunk]);

    while (true) {
      // Look for header separator
      // We accept both \r\n\r\n and \n\n for robustness, though \r\n\r\n is standard
      let headerEnd = this.buffer.indexOf("\r\n\r\n");
      let separatorLen = 4;

      if (headerEnd === -1) {
        headerEnd = this.buffer.indexOf("\n\n");
        separatorLen = 2;
      }

      if (headerEnd === -1) {
        // Not enough data for headers yet
        return;
      }

      // Parse headers
      const headerSection = this.buffer.subarray(0, headerEnd).toString("utf8");
      const contentLengthMatch = /Content-Length:\s*(\d+)/i.exec(headerSection);

      if (!contentLengthMatch) {
        // Malformed header or missing Content-Length
        // We can't recover easily without a length.
        // We'll log error and drop the buffer up to this point + separator to try finding next message?
        // Or just clear everything?
        // If we drop everything, we might lose next message.
        // If we drop just this header, we read "body" as header?
        logger.error({ headers: headerSection }, "Missing Content-Length header");
        if (this.onerror) this.onerror(new Error("Missing Content-Length header"));

        // Skip past this separator and continue
        this.buffer = this.buffer.subarray(headerEnd + separatorLen);
        continue;
      }

      const contentLength = parseInt(contentLengthMatch[1] as string, 10);
      const bodyStart = headerEnd + separatorLen;
      const totalLen = bodyStart + contentLength;

      if (this.buffer.length < totalLen) {
        // Need more data for the body
        return;
      }

      // Extract body
      const body = this.buffer.subarray(bodyStart, totalLen);
      // Remove processed message from buffer
      this.buffer = this.buffer.subarray(totalLen);

      try {
        const jsonString = body.toString("utf8");
        const message = JSON.parse(jsonString);
        if (this.onmessage) {
          this.onmessage(message);
        }
      } catch (e) {
        logger.error({ error: e }, "Failed to parse JSON body");
        if (this.onerror) this.onerror(e as Error);
      }
    }
  }
}
