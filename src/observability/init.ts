import type { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import pino from "pino";

export type Logger = unknown;

let logWriteStream: ReturnType<typeof createWriteStream> | null = null;
let currentLogPath: string | null = null;
let isUsingStderr = false;
let pinoDestination: ReturnType<typeof pino.destination> | null = null;

export function getLogsDir(): string {
  return join(homedir(), ".goblin", "logs");
}

export function getSessionLogPath(): string {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, "-").slice(0, 19);
  return join(getLogsDir(), `goblin-${timestamp}.log`);
}

export async function initSessionLogging(): Promise<string> {
  const logsDir = getLogsDir();
  const logPath = getSessionLogPath();

  await mkdir(logsDir, { recursive: true });

  // Close existing streams
  if (pinoDestination) {
    try {
      pinoDestination.end();
    } catch {
      // Ignore close errors
    }
    pinoDestination = null;
  }
  if (logWriteStream) {
    try {
      logWriteStream.end();
    } catch {
      // Ignore close errors
    }
    logWriteStream = null;
  }

  // Create pino destination with sync mode for immediate writes
  pinoDestination = pino.destination({
    dest: logPath,
    sync: true, // Synchronous writes for immediate flushing
  });

  currentLogPath = logPath;
  isUsingStderr = false;

  return logPath;
}

export function getCurrentLogPath(): string | null {
  return currentLogPath;
}

export function redirectLogsToStderr(): void {
  isUsingStderr = true;
}

export function getLogState(): {
  logWriteStream: ReturnType<typeof createWriteStream> | null;
  isUsingStderr: boolean;
  pinoDestination: ReturnType<typeof pino.destination> | null;
} {
  return { logWriteStream, isUsingStderr, pinoDestination };
}

export async function flushAndCloseLogs(): Promise<void> {
  return new Promise((resolve) => {
    if (pinoDestination) {
      pinoDestination.once("finish", () => {
        pinoDestination = null;
        logWriteStream = null;
        currentLogPath = null;
        resolve();
      });
      pinoDestination.end();
    } else {
      resolve();
    }
  });
}
