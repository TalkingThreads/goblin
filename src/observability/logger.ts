/**
 * Enhanced structured logger using pino
 */

import { createWriteStream } from "node:fs";
import { Writable } from "node:stream";
import pino from "pino";
import type { LogFormat, LoggingConfig, LogLevel } from "../config/schema.js";

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
 * Set DEBUG=1 to enable trace-level logging
 */
export function isDebugEnabled(): boolean {
  return process.env["DEBUG"] === "1";
}

/**
 * Get debug log path from environment
 */
export function getDebugLogPath(): string {
  return process.env["DEBUG_LOG"] ?? "./logs/debug.log";
}

/**
 * Switchable stream that can redirect between stdout and stderr
 */
class SwitchableStream extends Writable {
  private useStderr = false;

  setStderr(enabled: boolean) {
    this.useStderr = enabled;
  }

  _write(chunk: unknown, encoding: BufferEncoding, callback: (error?: Error | null) => void): void {
    const target = this.useStderr ? process.stderr : process.stdout;
    target.write(chunk as any, encoding, callback);
  }
}

export const globalLogStream = new SwitchableStream();

export function setLogToStderr(enabled: boolean): void {
  globalLogStream.setStderr(enabled);
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

export const tuiLogBuffer = new TuiLogBuffer();

let logWriteStream: ReturnType<typeof createWriteStream> | null = null;

export function setLogWriteStream(stream: ReturnType<typeof createWriteStream>): void {
  logWriteStream = stream;
}

export function flushLogs(): Promise<void> {
  return new Promise((resolve) => {
    if (logWriteStream) {
      logWriteStream.once("finish", resolve);
      logWriteStream.end();
      logWriteStream = null;
    } else {
      resolve();
    }
  });
}

export interface LoggerOptions {
  level?: LogLevel;
  format?: LogFormat;
  redact?: {
    paths: string[];
    remove?: boolean;
  };
  destinations?: NodeJS.WritableStream[];
}

// Cache for child loggers by component name
const loggerCache = new Map<string, Logger>();

function getConfigHash(options?: LoggerOptions): string {
  return `${options?.level ?? "info"}:${options?.format ?? "json"}:${!!options?.redact}:${options?.redact?.paths?.length ?? 0}`;
}

export function createLogger(component: string, options?: LoggerOptions): Logger {
  const configHash = getConfigHash(options);

  // Check cache for this component with same config
  const cacheKey = `${component}:${configHash}`;
  const cached = loggerCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  // Check if DEBUG mode is enabled - use trace level if so
  const isDebug = isDebugEnabled();
  const level =
    options?.level ?? (process.env["LOG_LEVEL"] as LogLevel) ?? (isDebug ? "trace" : "info");
  const format = options?.format ?? "json";
  const isDev = process.env["NODE_ENV"] !== "production";
  const logPath = process.env["LOG_PATH"] ?? "./logs/app.log";

  const pinoOptions: pino.LoggerOptions = {
    name: "goblin",
    level,
    timestamp: pino.stdTimeFunctions.isoTime,
  };

  let destination: NodeJS.WritableStream | undefined;

  if (format !== "pretty") {
    let stream: ReturnType<typeof createWriteStream> | null = null;
    try {
      // Only try to open file if LOG_PATH is explicitly set or we're running in a mode where it makes sense
      if (process.env["LOG_PATH"]) {
        stream = createWriteStream(logPath, { flags: "a", encoding: "utf8" });
        setLogWriteStream(stream);
        // If file stream is successfully created, we use it
        destination = stream;
      }
    } catch {
      // If log directory doesn't exist, fall back
    }

    if (!destination) {
      // If no file stream, use global switchable stream
      destination = globalLogStream;
    }
  }

  if (options?.redact) {
    pinoOptions.redact = {
      paths: options.redact.paths,
      remove: options.redact.remove ?? false,
    };
  }

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

  if (options?.destinations && options.destinations.length > 0) {
    pinoOptions.base = pinoOptions.base ?? {};
    (pinoOptions.base as Record<string, unknown>)["destinations"] = options.destinations;
  }

  // If destination is set (file or globalLogStream), use it.
  // If pretty, destination is undefined (pino-pretty transport used)
  const baseLogger = destination ? pino(pinoOptions, destination) : pino(pinoOptions);
  const childLogger = baseLogger.child({ component });

  const result = createTuiIntegratedLogger(childLogger, component);

  // Cache this logger
  loggerCache.set(cacheKey, result);

  return result;
}

function createTuiIntegratedLogger(logger: pino.Logger, component: string): pino.Logger {
  const originalMethods = {
    trace: logger.trace,
    debug: logger.debug,
    info: logger.info,
    warn: logger.warn,
    error: logger.error,
    fatal: logger.fatal,
  };

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

export function createLoggerWithConfig(component: string, config?: LoggingConfig): Logger {
  if (!config) {
    return createLogger(component);
  }

  const level = (process.env["LOG_LEVEL"] as LogLevel) ?? config.level;
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

export const logger = createLogger("core");

export function getTuiLogs(): TuiLogEntry[] {
  return tuiLogBuffer.getAll();
}

export function subscribeToTuiLogs(callback: (entry: TuiLogEntry) => void): () => void {
  return tuiLogBuffer.subscribe(callback);
}

export function clearTuiLogs(): void {
  tuiLogBuffer.clear();
}
