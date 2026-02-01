/**
 * Enhanced structured logger using pino
 */

import pino from "pino";
import type { LogFormat, LoggingConfig, LogLevel } from "../config/schema.js";

export type Logger = pino.Logger;

// TUI log buffer for integration
interface TuiLogEntry {
  timestamp: Date;
  level: string;
  component: string;
  message: string;
  data?: Record<string, unknown>;
}

class TuiLogBuffer {
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

// Global TUI log buffer instance
export const tuiLogBuffer = new TuiLogBuffer();

/**
 * Logger options
 */
export interface LoggerOptions {
  /**
   * Log level (overrides config and env var)
   */
  level?: LogLevel;

  /**
   * Log format (pretty or json)
   */
  format?: LogFormat;

  /**
   * Configuration for sensitive data redaction
   */
  redact?: {
    paths: string[];
    remove?: boolean;
  };

  /**
   * Log destinations
   */
  destinations?: NodeJS.WritableStream[];
}

/**
 * Create an enhanced logger with component name
 */
export function createLogger(component: string, options?: LoggerOptions): Logger {
  // Determine log level (env var overrides options)
  const level = options?.level ?? (process.env["LOG_LEVEL"] as LogLevel) ?? "info";

  // Determine format
  const format = options?.format ?? "json";
  const isDev = process.env["NODE_ENV"] !== "production";

  // Build pino options
  const pinoOptions: pino.LoggerOptions = {
    name: "goblin",
    level,
    timestamp: pino.stdTimeFunctions.isoTime,
  };

  // Add redaction if configured
  if (options?.redact) {
    pinoOptions.redact = {
      paths: options.redact.paths,
      remove: options.redact.remove ?? false,
    };
  }

  // Add pretty printing for development
  if (format === "pretty" && isDev) {
    pinoOptions.transport = {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:standard",
        ignore: "pid,hostname",
        levelFirst: true,
      },
    };
  }

  // Configure destinations
  if (options?.destinations && options.destinations.length > 0) {
    pinoOptions.base = pinoOptions.base ?? {};
    (pinoOptions.base as Record<string, unknown>)["destinations"] = options.destinations;
  }

  // Create base logger
  const baseLogger = pino(pinoOptions);

  // Create child logger
  const childLogger = baseLogger.child({ component });

  // Wrap with TUI integration
  return createTuiIntegratedLogger(childLogger, component);
}

/**
 * Wrap a pino logger to integrate with TUI log buffer
 */
function createTuiIntegratedLogger(logger: pino.Logger, component: string): pino.Logger {
  // Store original methods
  const originalMethods = {
    trace: logger.trace,
    debug: logger.debug,
    info: logger.info,
    warn: logger.warn,
    error: logger.error,
    fatal: logger.fatal,
  };

  // Override each log method
  logger.trace = ((obj: unknown, msg?: string) => {
    captureLog("trace", component, obj, msg);
    return originalMethods.trace.call(logger, obj, msg);
  }) as typeof logger.trace;

  logger.debug = ((obj: unknown, msg?: string) => {
    captureLog("debug", component, obj, msg);
    return originalMethods.debug.call(logger, obj, msg);
  }) as typeof logger.debug;

  logger.info = ((obj: unknown, msg?: string) => {
    captureLog("info", component, obj, msg);
    return originalMethods.info.call(logger, obj, msg);
  }) as typeof logger.info;

  logger.warn = ((obj: unknown, msg?: string) => {
    captureLog("warn", component, obj, msg);
    return originalMethods.warn.call(logger, obj, msg);
  }) as typeof logger.warn;

  logger.error = ((obj: unknown, msg?: string) => {
    captureLog("error", component, obj, msg);
    return originalMethods.error.call(logger, obj, msg);
  }) as typeof logger.error;

  logger.fatal = ((obj: unknown, msg?: string) => {
    captureLog("fatal", component, obj, msg);
    return originalMethods.fatal.call(logger, obj, msg);
  }) as typeof logger.fatal;

  return logger;
}

/**
 * Capture log entry to TUI buffer
 */
function captureLog(level: string, component: string, obj: unknown, msg?: string): void {
  const entry: TuiLogEntry = {
    timestamp: new Date(),
    level,
    component,
    message: typeof obj === "string" ? obj : (msg ?? ""),
    data: typeof obj === "object" && obj !== null ? (obj as Record<string, unknown>) : undefined,
  };
  tuiLogBuffer.push(entry);
}

/**
 * Logger factory with configuration
 */
export function createLoggerWithConfig(component: string, config?: LoggingConfig): Logger {
  if (!config) {
    return createLogger(component);
  }

  // Determine log level (env var overrides config)
  const level = (process.env["LOG_LEVEL"] as LogLevel) ?? config.level;

  // Determine format
  const format =
    config.format === "pretty" && process.env["NODE_ENV"] !== "production" ? "pretty" : "json";

  return createLogger(component, {
    level,
    format,
    redact: config.redact?.enabled
      ? {
          paths: config.redact.paths,
          remove: config.redact.remove,
        }
      : undefined,
  });
}

/**
 * Base logger instance
 */
export const logger = createLogger("core");

/**
 * Get TUI log buffer for TUI components
 */
export function getTuiLogs(): TuiLogEntry[] {
  return tuiLogBuffer.getAll();
}

/**
 * Subscribe to TUI log updates
 */
export function subscribeToTuiLogs(callback: (entry: TuiLogEntry) => void): () => void {
  return tuiLogBuffer.subscribe(callback);
}

/**
 * Clear TUI log buffer
 */
export function clearTuiLogs(): void {
  tuiLogBuffer.clear();
}
