/**
 * Lenient Streamable HTTP Server Transport
 *
 * This transport wraps the MCP SDK's WebStandardStreamableHTTPServerTransport
 * but makes the Accept header validation more lenient to support broader client
 * compatibility per MCP spec section on Accept header.
 *
 * Per MCP spec: "The client MUST include an Accept header, listing both
 * application/json and text/event-stream as supported content types."
 *
 * However, many MCP clients don't comply with this. This transport accepts:
 * - application/json
 * - text/event-stream
 * - * / * (wildcard)
 * - application/*
 * - Any combination of the above
 */

import {
  WebStandardStreamableHTTPServerTransport,
  type WebStandardStreamableHTTPServerTransportOptions,
} from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createLogger } from "../observability/logger.js";
import { isAcceptHeaderValid } from "./accept-header.js";

const logger = createLogger("lenient-http-transport");

export interface LenientHttpServerTransportOptions
  extends Omit<WebStandardStreamableHTTPServerTransportOptions, "sessionIdGenerator"> {
  sessionIdGenerator?: () => string | undefined;
}

export class LenientHttpServerTransport extends WebStandardStreamableHTTPServerTransport {
  constructor(options: LenientHttpServerTransportOptions = {}) {
    super({
      ...options,
      sessionIdGenerator: options.sessionIdGenerator
        ? () => options.sessionIdGenerator?.() ?? crypto.randomUUID()
        : undefined,
    });
  }

  async handleRequest(request: Request): Promise<Response> {
    const accept = request.headers.get("Accept");
    const requestId = request.headers.get("mcp-request-id") || crypto.randomUUID();

    // If Accept header is not MCP-compliant, modify it to be compliant
    // before passing to parent (which has strict validation)
    if (!isAcceptHeaderValid(accept)) {
      logger.warn(
        { requestId, accept, path: request.url },
        "Non-compliant Accept header received, modifying for compatibility",
      );

      // Create a new request with a compliant Accept header
      const modifiedHeaders = new Headers(request.headers);
      modifiedHeaders.set("Accept", "application/json, text/event-stream");

      const modifiedRequest = new Request(request.url, {
        method: request.method,
        headers: modifiedHeaders,
        body: request.body,
        redirect: request.redirect,
        signal: request.signal,
      });

      return super.handleRequest(modifiedRequest);
    }

    return super.handleRequest(request);
  }
}
