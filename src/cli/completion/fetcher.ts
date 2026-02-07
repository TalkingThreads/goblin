import { createLogger } from "../../observability/logger.js";
import { fetchFromConfig } from "./config-fetcher.js";
import { fetchFromHttp } from "./http-fetcher.js";

const logger = createLogger("completion-fetcher");

export interface CompletionOptions {
  url?: string;
  configPath?: string;
  timeout?: number;
}

export interface CompletionResult {
  items: string[];
  source: "http" | "config" | "none";
  error?: string;
}

/**
 * Hybrid completion fetcher that tries HTTP API first, then falls back to config file.
 * This ensures fresh data when gateway is running, but still works in STDIO mode.
 */
export async function fetchCompletions(
  type: "servers" | "tools",
  options: CompletionOptions = {},
): Promise<CompletionResult> {
  const { url = "http://localhost:3000", configPath, timeout = 500 } = options;

  // Try HTTP API first (fast and fresh when gateway is running)
  try {
    logger.debug({ type, url }, "Attempting HTTP fetch for completions");
    const httpResult = await fetchFromHttp(type, { url, timeout });

    if (httpResult.items.length > 0) {
      logger.debug({ type, count: httpResult.items.length }, "HTTP fetch successful");
      return {
        items: httpResult.items,
        source: "http",
      };
    }
  } catch (error) {
    logger.debug({ type, error }, "HTTP fetch failed, will try config fallback");
  }

  // Fallback to config file (works in STDIO mode or when gateway is down)
  try {
    logger.debug({ type, configPath }, "Attempting config fetch for completions");
    const configResult = await fetchFromConfig(type, { configPath });

    if (configResult.items.length > 0) {
      logger.debug({ type, count: configResult.items.length }, "Config fetch successful");
      return {
        items: configResult.items,
        source: "config",
      };
    }
  } catch (error) {
    logger.debug({ type, error }, "Config fetch failed");
  }

  // No completions available
  return {
    items: [],
    source: "none",
    error: "No completions available",
  };
}

/**
 * Fetch server names using hybrid strategy
 */
export async function fetchServerNames(options: CompletionOptions = {}): Promise<CompletionResult> {
  return fetchCompletions("servers", options);
}

/**
 * Fetch tool names using hybrid strategy
 */
export async function fetchToolNames(options: CompletionOptions = {}): Promise<CompletionResult> {
  return fetchCompletions("tools", options);
}
