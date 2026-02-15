/**
 * Path Normalization Utilities
 *
 * Automatically detects and normalizes Windows-style paths to forward slashes.
 * This helps prevent JSON escape sequence errors and ensures cross-platform compatibility.
 */

import { createLogger } from "../observability/logger.js";

const logger = createLogger("path-normalization");

// Regex patterns for path detection
const URL_PATTERN = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//; // http://, file://, etc.
const WINDOWS_ABSOLUTE_PATTERN = /^[a-zA-Z]:[\\/]/; // C:\ or C:/
const UNIX_ABSOLUTE_PATTERN = /^\//; // /home/user
const UNC_PATTERN = /^\\\\[^\\]/; // \\server\share
const REGISTRY_PATTERN = /^HKEY_/; // HKEY_LOCAL_MACHINE
const RELATIVE_WITH_SEPARATOR_PATTERN = /^\.[\\/]/; // .\config or ./config
const CONTAINS_BACKSLASH_PATTERN = /\\/; // catch-all for potential windows paths

/**
 * Check if a string looks like a file path that needs normalization.
 *
 * @param value - The string to check
 * @returns true if the string appears to be a path
 */
export function looksLikePath(value: string): boolean {
  // 1. URL pattern -> NOT a path we want to normalize (usually)
  if (URL_PATTERN.test(value)) {
    return false;
  }

  // 2. Windows absolute -> IS a path
  if (WINDOWS_ABSOLUTE_PATTERN.test(value)) {
    return true;
  }

  // 3. Unix absolute -> IS a path (though usually doesn't need normalization)
  if (UNIX_ABSOLUTE_PATTERN.test(value)) {
    return true;
  }

  // 4. UNC path -> IS a path
  if (UNC_PATTERN.test(value)) {
    return true;
  }

  // 5. Registry path -> IS a path
  if (REGISTRY_PATTERN.test(value)) {
    return true;
  }

  // 6. Relative with separators -> IS a path
  if (RELATIVE_WITH_SEPARATOR_PATTERN.test(value)) {
    return true;
  }

  // 7. Contains backslashes -> IS likely a Windows path or path fragment
  if (CONTAINS_BACKSLASH_PATTERN.test(value)) {
    return true;
  }

  return false;
}

/**
 * Normalize a path string to use forward slashes.
 *
 * @param value - The path string to normalize
 * @returns The normalized path string
 */
export function normalizePath(value: string): string {
  // Simple replacement of all backslashes with forward slashes
  return value.replace(/\\/g, "/");
}

/**
 * Recursively normalize paths in an arguments object or array.
 *
 * @param args - The arguments object or array to normalize
 * @returns The normalized arguments (new copy)
 */
export function normalizeArgs(args: unknown): unknown {
  if (typeof args === "string") {
    if (looksLikePath(args)) {
      const normalized = normalizePath(args);
      if (normalized !== args) {
        logger.debug({ original: args, normalized }, "Path normalized");
        return normalized;
      }
    }
    return args;
  }

  if (Array.isArray(args)) {
    return args.map((item) => normalizeArgs(item));
  }

  if (typeof args === "object" && args !== null) {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(args)) {
      result[key] = normalizeArgs(value);
    }
    return result;
  }

  return args;
}
