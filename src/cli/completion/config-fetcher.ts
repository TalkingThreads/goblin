import { readFile } from "node:fs/promises";
import { getConfigPath } from "../../config/paths.js";
import type { Config } from "../../config/schema.js";
import { createLogger } from "../../observability/logger.js";

const logger = createLogger("completion-config-fetcher");

interface ConfigFetcherOptions {
  configPath?: string;
}

interface ConfigFetcherResult {
  items: string[];
}

/**
 * Fetch completions from config file
 * Used as fallback when gateway is not running (STDIO mode)
 */
export async function fetchFromConfig(
  type: "servers" | "tools",
  options: ConfigFetcherOptions,
): Promise<ConfigFetcherResult> {
  const configPath = options.configPath || getConfigPath();

  try {
    const content = await readFile(configPath, "utf-8");
    const config = JSON.parse(content) as Config;

    if (type === "servers") {
      // Extract server names from config
      const servers = config.servers || [];
      return { items: servers.map((s) => s.name) };
    } else {
      // For tools, we can't know them from config alone
      // Return empty array - tools require running gateway
      logger.debug("Tools cannot be completed from config, need running gateway");
      return { items: [] };
    }
  } catch (error) {
    logger.debug({ configPath, error }, "Failed to read config for completions");
    throw error;
  }
}
