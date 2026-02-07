import { createLogger } from "../../observability/logger.js";

const logger = createLogger("completion-http-fetcher");

interface HttpFetcherOptions {
  url: string;
  timeout: number;
}

interface HttpFetcherResult {
  items: string[];
}

/**
 * Fetch completions from HTTP API
 * Used when gateway is running for fresh, accurate data
 */
export async function fetchFromHttp(
  type: "servers" | "tools",
  options: HttpFetcherOptions,
): Promise<HttpFetcherResult> {
  const { url, timeout } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const endpoint = type === "servers" ? "/servers" : "/tools";
    const response = await fetch(`${url}${endpoint}`, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = (await response.json()) as Record<string, unknown>;

    if (type === "servers") {
      const servers = data["servers"] as Array<{ name: string }> | undefined;
      if (!servers) {
        return { items: [] };
      }
      return { items: servers.map((s) => s.name) };
    } else {
      const tools = data["tools"] as Array<{ name: string }> | undefined;
      if (!tools) {
        return { items: [] };
      }
      return { items: tools.map((t) => t.name) };
    }
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === "AbortError") {
      logger.debug({ type, timeout }, "HTTP fetch timed out");
      throw new Error(`Timeout after ${timeout}ms`);
    }

    logger.debug({ type, error }, "HTTP fetch failed");
    throw error;
  }
}
