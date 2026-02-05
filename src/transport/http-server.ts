/**
 * Streamable HTTP Server Transport
 *
 * Wrapper around the MCP SDK's WebStandardStreamableHTTPServerTransport
 * for use with Hono and Bun runtime.
 */

import {
  WebStandardStreamableHTTPServerTransport,
  type WebStandardStreamableHTTPServerTransportOptions,
} from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";

export interface StreamableHttpServerTransportOptions
  extends Omit<WebStandardStreamableHTTPServerTransportOptions, "sessionIdGenerator"> {
  sessionIdGenerator?: () => string | undefined;
}

export class StreamableHttpServerTransport extends WebStandardStreamableHTTPServerTransport {
  constructor(options: StreamableHttpServerTransportOptions = {}) {
    super({
      ...options,
      // @ts-expect-error - SDK type says () => string but internally uses optional chaining
      sessionIdGenerator: options.sessionIdGenerator,
    });
  }
}
