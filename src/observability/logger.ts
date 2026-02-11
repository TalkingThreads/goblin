/**
 * Enhanced structured logger using pino
 *
 * Design principles:
 * - Session-based file logging: ~/.goblin/logs/goblin-{timestamp}.log
 * - Pretty print by default for development
 * - JSON format for production
 * - Async writes using pino transports
 * - User-facing messages: use console directly (not logger)
 * - Logs: use logger with appropriate levels
 */

import pino from "pino";
import type { LogFormat, LogLevel } from "../config/schema.js";
import {
  flushAndCloseLogs,
  getCurrentLogPath,
  getLogState,
  getLogsDir,
  getSessionLogPath,
  initSessionLogging,
  redirectLogsToStderr,
} from "./init.js";

export {
  initSessionLogging,
  getCurrentLogPath,
  flushAndCloseLogs,
  redirectLogsToStderr,
  getLogsDir,
  getSessionLogPath,
};

export type Logger = pino.Logger;

interface TuiLogEntry {
  timestamp: Date;
  level: string;
  component: string;
  message: string;
  data?: Record<string, unknown>;
}

/**
 * Check if debug mode is enabled
 */
export function isDebugEnabled(): boolean {
  return process.env["DEBUG"] === "1";
}

/**
 * User-facing console output (not logs)
 * Use this for commands that don't start a session
 */
export const userOutput = {
  info: (message: string, ...args: unknown[]): void => {
    console.log(message, ...args);
  },
  warn: (message: string, ...args: unknown[]): void => {
    console.warn(message, ...args);
  },
  error: (message: string, ...args: unknown[]): void => {
    console.error(message, ...args);
  },
  success: (message: string, ...args: unknown[]): void => {
    console.log(`✅ ${message}`, ...args);
  },
};

/**
 * TUI log buffer for displaying logs in the terminal UI
 */
class LogBuffer {
  private entries: TuiLogEntry[] = [];
  private maxSize: number;
  private subscribers: Set<(entry: TuiLogEntry) => void> = new Set();

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
  }

  push(entry: TuiLogEntry): void {
    this.entries.push(entry);
    if (this.entries.length > this.maxSize) {
      this.entries.shift();
    }
    this.subscribers.forEach((cb) => {
      cb(entry);
    });
  }

  getAll(): TuiLogEntry[] {
    return [...this.entries];
  }

  subscribe(callback: (entry: TuiLogEntry) => void): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  clear(): void {
    this.entries = [];
  }
}

export const logBuffer = new LogBuffer();

/**
 * Create a pino logger with session-based file logging
 */
export function createLogger(component: string): Logger {
  const isDev = process.env["NODE_ENV"] !== "production";
  const isDebug = isDebugEnabled();

  // Determine log level: env > config > debug > default
  const level = (process.env["LOG_LEVEL"] as LogLevel | undefined) ?? (isDebug ? "trace" : "info");

  // Determine format: env > config > default (pretty for dev, json for prod)
  const format =
    (process.env["LOG_FORMAT"] as LogFormat | undefined) ?? (isDev ? "pretty" : "json");

  // Use pretty format for development (colorized output)
  const usePretty = format === "pretty" && isDev;

  // Sensitive paths to redact from logs
  const redactPaths = [
    "password",
    "token",
    "apiKey",
    "accessToken",
    "refreshToken",
    "authorization",
    "cookie",
    "secret",
    "env.*.API_KEY",
    "env.*.TOKEN",
    "env.*.PASSWORD",
  ];

  const pinoOptions: pino.LoggerOptions = {
    name: "goblin",
    level,
    timestamp: pino.stdTimeFunctions.isoTime,
    redact: {
      paths: redactPaths,
      remove: false,
    },
    // Pretty print for development
    ...(usePretty && { colorize: true }),
  };

  // Get log state from init module
  const { logWriteStream, isUsingStderr: stderrMode, pinoDestination } = getLogState();

  // Create the logger
  let logger: pino.Logger;

  if (pinoDestination) {
    // Use pino's destination for synchronized writes
    logger = pino(pinoOptions, pinoDestination);
  } else if (logWriteStream) {
    // Fallback to file stream
    logger = pino(pinoOptions, logWriteStream);
  } else if (stderrMode) {
    // Write to stderr only (fallback)
    logger = pino(pinoOptions, process.stderr);
  } else {
    // Fallback to stdout (should not happen in normal use)
    logger = pino(pinoOptions);
  }

  // Create child logger with component name
  const childLogger = logger.child({ component });

  // Wrap to capture logs for TUI
  const wrappedLogger = createTuiIntegratedLogger(childLogger, component);

  return wrappedLogger;
}

/**
 * Wrap logger to capture logs for TUI display
 */
function createTuiIntegratedLogger(logger: pino.Logger, component: string): pino.Logger {
  const originalMethods = {
    trace: logger.trace,
    debug: logger.debug,
    info: logger.info,
    warn: logger.warn,
    error: logger.error,
    fatal: logger.fatal,
  };

  const capture = (level: string, obj: unknown, msg?: string): void => {
    const entry: TuiLogEntry = {
      timestamp: new Date(),
      level,
      component,
      message: typeof obj === "string" ? obj : (msg ?? ""),
      data: typeof obj === "object" && obj !== null ? (obj as Record<string, unknown>) : undefined,
    };
    logBuffer.push(entry);
  };

  logger.trace = ((obj: unknown, msg?: string) => {
    capture("trace", obj, msg);
    return originalMethods.trace.call(logger, obj, msg);
  }) as typeof logger.trace;

  logger.debug = ((obj: unknown, msg?: string) => {
    capture("debug", obj, msg);
    return originalMethods.debug.call(logger, obj, msg);
  }) as typeof logger.debug;

  logger.info = ((obj: unknown, msg?: string) => {
    capture("info", obj, msg);
    return originalMethods.info.call(logger, obj, msg);
  }) as typeof logger.info;

  logger.warn = ((obj: unknown, msg?: string) => {
    capture("warn", obj, msg);
    return originalMethods.warn.call(logger, obj, msg);
  }) as typeof logger.warn;

  logger.error = ((obj: unknown, msg?: string) => {
    capture("error", obj, msg);
    return originalMethods.error.call(logger, obj, msg);
  }) as typeof logger.error;

  logger.fatal = ((obj: unknown, msg?: string) => {
    capture("fatal", obj, msg);
    return originalMethods.fatal.call(logger, obj, msg);
  }) as typeof logger.fatal;

  return logger;
}

/**
 * Get all captured log entries (for TUI display)
 */
export function getTuiLogs(): TuiLogEntry[] {
  return logBuffer.getAll();
}

/**
 * Clear the log buffer (for TUI)
 */
export function clearLogs(): void {
  logBuffer.clear();
}
