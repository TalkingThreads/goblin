/**
 * Logging utilities for consistent logging patterns
 */

import { getContextForLog } from "./correlation.js";
import { createErrorLogEntry, type ErrorCode, type ErrorContext } from "./error-codes.js";
import type { Logger } from "./logger.js";

/**
 * Standard context fields for different operation types
 */
export interface OperationContext {
  serverId?: string;
  toolName?: string;
  requestId?: string;
  duration?: number;
}

export interface HttpContext {
  requestId?: string;
  method: string;
  path: string;
  status?: number;
  duration?: number;
}

export interface ConnectionContext {
  serverId: string;
  transport: string;
}

export interface ConfigContext {
  configPath?: string;
}

/**
 * Log success with standard context
 */
export function logSuccess(logger: Logger, message: string, context: OperationContext = {}): void {
  logger.info(
    {
      ...context,
      ...getContextForLog(),
    },
    message,
  );
}

/**
 * Log error with error code and context
 */
export function logError(
  logger: Logger,
  code: ErrorCode,
  error: unknown,
  context: ErrorContext = {},
): void {
  const entry = createErrorLogEntry(code, error, context);
  logger.error(
    {
      errorCode: entry.errorCode,
      error: entry.error,
      stack: entry.stack,
      ...entry.context,
      ...getContextForLog(),
    },
    `${entry.description}: ${entry.error}`,
  );
}

/**
 * Log HTTP request
 */
export function logHttpRequest(
  logger: Logger,
  context: HttpContext,
  incoming: boolean = true,
): void {
  const action = incoming ? "Request received" : "Request completed";
  logger.info(
    {
      ...context,
      ...getContextForLog(),
    },
    `${context.method} ${context.path} - ${action}`,
  );
}

/**
 * Log HTTP response
 */
export function logHttpResponse(logger: Logger, context: HttpContext): void {
  logger.info(
    {
      ...context,
      ...getContextForLog(),
    },
    `${context.method} ${context.path} ${context.status ?? "?"} - ${(context.duration ?? 0).toFixed(2)}ms`,
  );
}

/**
 * Log connection event
 */
export function logConnection(
  logger: Logger,
  connected: boolean,
  context: ConnectionContext,
): void {
  const message = connected ? "Connected to server" : "Disconnected from server";
  const level = connected ? "info" : "debug";

  (logger as Logger)[level](
    {
      ...context,
      ...getContextForLog(),
    },
    message,
  );
}

/**
 * Log configuration event
 */
export function logConfigChange(logger: Logger, action: string, context: ConfigContext = {}): void {
  logger.info(
    {
      ...context,
      ...getContextForLog(),
    },
    `Configuration ${action}`,
  );
}

/**
 * Log retry attempt
 */
export function logRetry(
  logger: Logger,
  attempt: number,
  maxRetries: number,
  error: unknown,
  context: OperationContext = {},
): void {
  logger.warn(
    {
      attempt,
      maxRetries,
      error: error instanceof Error ? error.message : String(error),
      ...context,
      ...getContextForLog(),
    },
    `Retry attempt ${attempt}/${maxRetries} failed`,
  );
}

/**
 * Log timeout
 */
export function logTimeout(
  logger: Logger,
  operation: string,
  timeoutMs: number,
  context: OperationContext = {},
): void {
  logger.warn(
    {
      timeoutMs,
      ...context,
      ...getContextForLog(),
    },
    `${operation} timed out after ${timeoutMs}ms`,
  );
}

/**
 * Log state change
 */
export function logStateChange(
  logger: Logger,
  entity: string,
  from: string,
  to: string,
  context: Record<string, unknown> = {},
): void {
  logger.info(
    {
      entity,
      from,
      to,
      ...context,
      ...getContextForLog(),
    },
    `${entity} state changed from ${from} to ${to}`,
  );
}

/**
 * Log security event
 */
export function logSecurityEvent(
  logger: Logger,
  event: string,
  context: Record<string, unknown> = {},
): void {
  logger.warn(
    {
      security: true,
      event,
      ...context,
      ...getContextForLog(),
    },
    `Security event: ${event}`,
  );
}

/**
 * Log performance metric
 */
export function logPerformance(
  logger: Logger,
  operation: string,
  duration: number,
  context: Record<string, unknown> = {},
): void {
  const level = duration > 1000 ? "warn" : duration > 100 ? "debug" : "trace";

  (logger as Logger)[level](
    {
      operation,
      durationMs: duration,
      ...context,
      ...getContextForLog(),
    },
    `${operation} completed in ${duration.toFixed(2)}ms`,
  );
}

/**
 * Component naming convention helper
 * Maps file paths to component names
 */
export function getComponentName(filePath: string): string {
  // Map common paths to component names
  const componentMap: Record<string, string> = {
    "src/gateway/server.ts": "gateway-server",
    "src/gateway/http.ts": "http-gateway",
    "src/gateway/registry.ts": "registry",
    "src/gateway/router.ts": "router",
    "src/gateway/client-manager.ts": "client-manager",
    "src/config/loader.ts": "config-loader",
    "src/config/watcher.ts": "config-watcher",
    "src/transport/pool.ts": "transport-pool",
    "src/transport/stdio.ts": "stdio-transport",
    "src/transport/http.ts": "http-transport",
    "src/cli/index.ts": "cli",
    "src/tools/meta/health.ts": "health-tool",
    "src/tools/meta/catalog.ts": "catalog-tool",
  };

  // Check exact match first
  if (componentMap[filePath]) {
    return componentMap[filePath];
  }

  // Extract from path
  const match = filePath.match(/src\/([^/]+)\//);
  if (match?.[1]) {
    return match[1];
  }

  // Fallback to filename
  const fileName = filePath.split("/").pop()?.replace(".ts", "") ?? "unknown";
  return fileName;
}

/**
 * Log level guidelines
 */
export const LOG_LEVEL_GUIDELINES = {
  trace: [
    "Entering/exiting functions",
    "All variable values in debug scenarios",
    "Detailed control flow tracking",
  ],
  debug: ["Request/response details", "Internal state changes", "Network packet details"],
  info: ["Successful operations", "State changes", "Configuration updates", "Connection events"],
  warn: [
    "Recoverable issues",
    "Degraded performance",
    "Invalid inputs handled gracefully",
    "Retry scenarios",
  ],
  error: ["Failures", "Exceptions", "Timeouts", "Broken invariants"],
  fatal: ["Process-threatening errors", "Shutdown scenarios", "Data corruption"],
} as const;

/**
 * Cross-platform signal handling utilities
 */

import type { ChildProcess } from "node:child_process";

/**
 * Setup shutdown handlers for graceful process termination.
 * Handles SIGINT on all platforms (Ctrl+C).
 * Handles SIGTERM only on Unix-like systems (not Windows).
 *
 * @param callback - Function to call when shutdown signal is received
 */
export function setupShutdownHandlers(callback: () => void): void {
  // SIGINT works on all platforms (Ctrl+C)
  process.on("SIGINT", callback);

  // SIGTERM only on Unix-like systems
  if (process.platform !== "win32") {
    process.on("SIGTERM", callback);
  }
}

/**
 * Gracefully shutdown a child process with platform-appropriate signals.
 * Sends SIGTERM on Unix, SIGINT on Windows as graceful signal.
 * Escalates to SIGKILL after timeout if process doesn't exit.
 *
 * @param childProcess - The child process to shutdown
 * @param timeoutMs - Timeout in milliseconds before escalating to SIGKILL (default: 5000)
 * @returns Promise that resolves when process exits
 */
export async function gracefulShutdown(
  childProcess: ChildProcess,
  timeoutMs = 5000,
): Promise<void> {
  return new Promise((resolve) => {
    let resolved = false;

    const cleanup = () => {
      if (resolved) return;
      resolved = true;
      resolve();
    };

    // Set up timeout for force kill
    const timeout = setTimeout(() => {
      try {
        childProcess.kill("SIGKILL"); // Works on all platforms
      } catch {
        // Process may already be dead
      }
      cleanup();
    }, timeoutMs);

    // Resolve when process exits
    childProcess.on("exit", () => {
      clearTimeout(timeout);
      cleanup();
    });

    // Send platform-appropriate graceful signal
    if (childProcess.killed || childProcess.exitCode !== null) {
      // Process already dead
      clearTimeout(timeout);
      cleanup();
    } else if (process.platform === "win32") {
      // Windows: SIGINT is the only graceful option
      try {
        childProcess.kill("SIGINT");
      } catch {
        clearTimeout(timeout);
        cleanup();
      }
    } else {
      // Unix: SIGTERM for graceful shutdown
      try {
        childProcess.kill("SIGTERM");
      } catch {
        clearTimeout(timeout);
        cleanup();
      }
    }
  });
}
