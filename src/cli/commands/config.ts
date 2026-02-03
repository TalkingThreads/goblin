import { readFile } from "node:fs/promises";
import { getConfigPath } from "../../config/paths.js";
import { ConfigSchema } from "../../config/schema.js";
import { createLogger } from "../../observability/logger.js";

const logger = createLogger("cli-config");

interface ConfigOptions {
  path?: string;
  config?: string;
  json?: boolean;
}

function resolveConfigPath(options: ConfigOptions): string {
  return options.config || options.path || getConfigPath();
}

/**
 * Validate configuration file
 */
export async function validateConfigCommand(options: ConfigOptions): Promise<void> {
  const configPath = resolveConfigPath(options);

  try {
    const content = await readFile(configPath, "utf-8");
    const raw = JSON.parse(content);
    const result = ConfigSchema.safeParse(raw);

    if (result.success) {
      if (options.json) {
        console.log(JSON.stringify({ valid: true, path: configPath }));
      } else {
        console.log(`Config is valid: ${configPath}`);
      }
      process.exit(0);
    } else {
      if (options.json) {
        console.log(
          JSON.stringify({
            valid: false,
            path: configPath,
            errors: result.error.format(),
          }),
        );
      } else {
        console.error(`Config is invalid: ${configPath}`);
        console.error(JSON.stringify(result.error.format(), null, 2));
      }
      process.exit(4);
    }
  } catch (error) {
    if (options.json) {
      console.log(
        JSON.stringify({
          valid: false,
          path: configPath,
          error: error instanceof Error ? error.message : String(error),
        }),
      );
    } else {
      logger.error({ error, configPath }, "Failed to validate config");
      console.error(
        `Error reading config at ${configPath}:`,
        error instanceof Error ? error.message : error,
      );
    }
    process.exit(4);
  }
}

/**
 * Show current configuration
 */
export async function showConfigCommand(options: ConfigOptions): Promise<void> {
  const configPath = resolveConfigPath(options);

  try {
    const content = await readFile(configPath, "utf-8");
    const raw = JSON.parse(content);

    if (options.json) {
      console.log(JSON.stringify(raw, null, 2));
    } else {
      console.log(`Configuration from ${configPath}:`);
      console.log(JSON.stringify(raw, null, 2));
    }
  } catch (error) {
    if (options.json) {
      console.log(
        JSON.stringify({
          error: "Failed to read config",
          detail: error instanceof Error ? error.message : String(error),
        }),
      );
    } else {
      logger.error({ error, configPath }, "Failed to show config");
      console.error(
        `Error reading config at ${configPath}:`,
        error instanceof Error ? error.message : error,
      );
    }
    process.exit(1);
  }
}
