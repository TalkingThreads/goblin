/**
 * Request/response logging middleware for Hono
 */

import type { RequestLoggingConfig } from "../config/schema.js";
import type { Logger } from "./logger.js";

/**
 * Generate a request ID
 */
function generateRequestId(): string {
  return crypto.randomUUID();
}

/**
 * Create request/response logging middleware
 */
export function createRequestLoggingMiddleware(
  logger: Logger,
  config?: RequestLoggingConfig,
): (c: any, next: () => Promise<void>) => Promise<void> {
  const cfg = config ?? {
    enabled: true,
    includeBody: false,
    includeResponseBody: false,
    excludePaths: ["/health", "/metrics"],
  };

  return async (c: any, next: () => Promise<void>): Promise<void> => {
    // Skip if disabled
    if (!cfg.enabled) {
      await next();
      return;
    }

    // Skip excluded paths
    if (cfg.excludePaths.some((p) => c.req.path.startsWith(p))) {
      await next();
      return;
    }

    // Get or generate request ID
    const requestId = c.get("requestId") || generateRequestId();
    c.set("requestId", requestId);

    const start = performance.now();

    // Log request
    logger.info(
      {
        requestId,
        method: c.req.method,
        path: c.req.path,
        query: Object.fromEntries(c.req.query()) || {},
      },
      `${c.req.method} ${c.req.path} - Incoming request`,
    );

    try {
      await next();
    } finally {
      const duration = performance.now() - start;

      // Log response
      logger.info(
        {
          requestId,
          method: c.req.method,
          path: c.req.path,
          status: c.res.status,
          durationMs: duration,
        },
        `${c.req.method} ${c.req.path} ${c.res.status} - ${duration.toFixed(2)}ms`,
      );
    }
  };
}

/**
 * Simple request ID middleware
 */
export function requestIdMiddleware(): (c: any, next: () => Promise<void>) => Promise<void> {
  return async (c: any, next: () => Promise<void>): Promise<void> => {
    const requestId = c.get("requestId") || generateRequestId();
    c.set("requestId", requestId);
    await next();
  };
}
