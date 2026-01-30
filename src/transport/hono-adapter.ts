/**
 * Adapter to use SSEServerTransport with Hono
 */

import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import type { Context } from "hono";
import type { SSEStreamingApi } from "hono/streaming";

/**
 * Creates an SSEServerTransport that writes to a Hono SSE stream
 */
export function createHonoSseTransport(
  endpoint: string,
  c: Context,
  stream: SSEStreamingApi,
): SSEServerTransport {
  // Create a mock ServerResponse object that bridges to Hono's stream
  const res = {
    // Headers are handled by Hono context before stream starts usually,
    // but SDK might call setHeader during handshake.
    setHeader(name: string, value: string) {
      try {
        c.header(name, value);
      } catch (e) {
        // Headers might be sent already
      }
    },
    // Write data to SSE stream
    write(data: string) {
      // SDK sends "event: message\ndata: ...\n\n"
      // Hono's writeSSE takes { data, event, id }
      // We need to parse the raw string or just write raw if possible?
      // stream.writeSSE writes formatted SSE.
      // SSEServerTransport.send() formats it.

      // Checking SDK source (inferred):
      // send(message) -> res.write(`event: message\ndata: ${JSON.stringify(message)}\n\n`)

      // If we pass a mock res, we receive the FULL string including "event: ...".
      // Hono's writeSSE adds formatting. Double formatting is bad.

      // If we use `stream.write(data)`, it writes raw chunk.
      // Hono `SSEStreamingApi` has `write(data: string | Uint8Array)`.

      stream.write(data);
    },
    end() {
      stream.close();
    },
  };

  // Cast to any to satisfy ServerResponse type requirement
  return new SSEServerTransport(endpoint, res as any);
}
