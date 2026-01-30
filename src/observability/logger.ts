/**
 * Structured logger using pino
 */

import pino from "pino";

export type Logger = pino.Logger;

/**
 * Create a child logger with a specific component name
 */
export function createLogger(component: string): Logger {
  return pino({
    name: "goblin",
    level: process.env["LOG_LEVEL"] ?? "info",
  }).child({ component });
}

/**
 * Base logger instance
 */
export const logger = createLogger("core");
