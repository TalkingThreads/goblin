/**
 * File destination utilities for logging
 */

import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import envPaths from "env-paths";

/**
 * Resolve log file path with environment variables and tilde expansion
 */
export function resolveLogPath(path: string): string {
  // Expand tilde to home directory
  if (path.startsWith("~")) {
    const homeDir = process.env["HOME"] || process.env["USERPROFILE"] || "";
    path = homeDir + path.slice(1);
  }

  // Expand environment variables
  path = path.replace(/\$(\w+)/g, (_, name) => process.env[name] || "");

  return resolve(path);
}

/**
 * Create a file write stream for logging
 */
export async function createLogFileStream(path: string): Promise<NodeJS.WritableStream> {
  const resolvedPath = resolveLogPath(path);

  // Ensure directory exists
  const dir = dirname(resolvedPath);
  await mkdir(dir, { recursive: true });

  return createWriteStream(resolvedPath, { flags: "a" });
}

/**
 * Get default log directory
 */
export function getDefaultLogDir(): string {
  const paths = envPaths("goblin", { suffix: "" });
  return paths.log || resolve(process.cwd(), "logs");
}

/**
 * Parse log file size (e.g., "10M" -> 10 * 1024 * 1024)
 */
export function parseLogSize(sizeStr: string): number {
  const units: Record<string, number> = {
    K: 1024,
    M: 1024 * 1024,
    G: 1024 * 1024 * 1024,
  };

  const match = sizeStr.match(/^(\d+)([KMG]?)$/i);
  if (!match) {
    return 10 * 1024 * 1024; // Default 10M
  }

  const valueStr = match[1] ?? "0";
  const unit = ((match[2] ?? "") as string).toUpperCase() as keyof typeof units;
  const value = parseInt(valueStr, 10);
  const multiplier = units[unit] ?? 1;
  return value * multiplier;
}
