import { getConfigManager } from "../../config/manager.js";
import { getConfigPath } from "../../config/paths.js";
import { ConfigSchema } from "../../config/schema.js";
import { userOutput } from "../../observability/logger.js";
import type { CliContext } from "../types.js";

interface ConfigOptions {
  path?: string;
  json?: boolean;
  context?: CliContext;
}

function resolveConfigPath(options: ConfigOptions): string {
  return options.path || options.context?.configPath || getConfigPath();
}

/**
 * Validate configuration file
 */
export async function validateConfigCommand(options: ConfigOptions): Promise<void> {
  const configPath = resolveConfigPath(options);
  const manager = getConfigManager();

  try {
    await manager.initialize({ customPath: configPath });
    const config = manager.getConfig();
    const result = ConfigSchema.safeParse(config);

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
      userOutput.error(
        `Error reading config at ${configPath}: ${error instanceof Error ? error.message : error}`,
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
  const manager = getConfigManager();

  try {
    await manager.initialize({ customPath: configPath });
    const config = manager.getConfig();

    const jsonFlag = options.json || options.context?.json;
    if (jsonFlag) {
      console.log(JSON.stringify(config, null, 2));
      process.exit(0);
    } else {
      console.log(`Configuration from ${configPath}:`);
      console.log(JSON.stringify(config, null, 2));
      process.exit(0);
    }
  } catch (error) {
    const jsonFlag = options.json || options.context?.json;
    if (jsonFlag) {
      console.log(
        JSON.stringify({
          error: "Failed to read config",
          detail: error instanceof Error ? error.message : String(error),
        }),
      );
    } else {
      userOutput.error(
        `Error reading config at ${configPath}: ${error instanceof Error ? error.message : error}`,
      );
    }
    process.exit(1);
  }
}
