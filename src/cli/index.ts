import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Command } from "commander";
import { showConfigCommand, validateConfigCommand } from "./commands/config.js";
import { healthCommand } from "./commands/health.js";
import { logsCommand } from "./commands/logs.js";
import { createServersCommand } from "./commands/servers.js";
import { registerSlashCommands } from "./commands/slashes/index.js";
import { startGateway } from "./commands/start.jsx";
import { statusCommand } from "./commands/status.js";
import { startStdioGateway } from "./commands/stdio.js";
import { stopCommand } from "./commands/stop.js";
import { createToolsCommand } from "./commands/tools.js";
import type { CliContext } from "./types.js";

async function getVersion(): Promise<string> {
  try {
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const packageJsonPath = join(__dirname, "..", "..", "package.json");
    const content = await readFile(packageJsonPath, "utf-8");
    const packageJson = JSON.parse(content);
    return packageJson.version || "0.1.0";
  } catch {
    return "0.1.0";
  }
}

function displayRootHelp(version: string): void {
  console.log(`
Goblin MCP Gateway ${version}

A developer-first MCP gateway that aggregates multiple MCP servers behind a single unified endpoint.

Usage: goblin <command> [options]

Common Commands:
  goblin stdio         Start in STDIO mode (default)
  goblin start         Start HTTP gateway server
  goblin servers       List and manage configured servers
  goblin tools         List available tools
  goblin tui           Launch interactive TUI (coming soon)

Global Flags:
  -h, --help         Show this help message
  -v, --version      Show version information
  --verbose          Enable verbose logging
  --port <number>    Gateway port (default: 3000)
  --host <host>      Gateway host (default: 127.0.0.1)
  --json             Output in JSON format
  --config <path>    Path to config file

Documentation:
  https://goblin.sh/docs

For more information, run: goblin <command> --help
`);
}

interface StartOptions {
  tui?: boolean;
  port?: string;
  config?: string;
}

/**
 * Parse global flags from command line arguments
 */
function parseGlobalFlags(args: string[]): CliContext {
  const context: CliContext = {
    verbose: false,
    json: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    switch (arg) {
      case "--verbose":
        context.verbose = true;
        break;
      case "--json":
        context.json = true;
        break;
      case "--port":
        if (nextArg && !nextArg.startsWith("-")) {
          context.port = parseInt(nextArg, 10);
          i++;
        }
        break;
      case "--host":
        if (nextArg && !nextArg.startsWith("-")) {
          context.host = nextArg;
          i++;
        }
        break;
      case "--config":
        if (nextArg && !nextArg.startsWith("-")) {
          context.configPath = nextArg;
          i++;
        }
        break;
    }
  }

  return context;
}

async function main(): Promise<void> {
  const VERSION = await getVersion();

  const program = new Command();

  // Parse global flags before command execution
  const globalContext = parseGlobalFlags(process.argv.slice(2));

  program
    .name("goblin")
    .description("Goblin MCP Gateway CLI")
    .option("-v, --version", "output version number")
    .option("--verbose", "Enable verbose logging")
    .option("--json", "Output in JSON format")
    .option("--port <number>", "Gateway port")
    .option("--host <host>", "Gateway host")
    .option("--config <path>", "Path to config file")
    .action((options) => {
      if (options.version) {
        console.log(VERSION);
      }
    });

  program
    .command("version")
    .description("Show version information")
    .option("--json", "Output in JSON format")
    .action(async (options: { json?: boolean }) => {
      if (options.json) {
        console.log(JSON.stringify({ version: VERSION, exitCode: 0 }));
      } else {
        console.log(VERSION);
      }
    });

  program
    .command("start")
    .description("Start the Gateway")
    .option("--tui", "Enable TUI mode")
    .option("--port <number>", "Port to listen on")
    .option("--config <path>", "Path to config file")
    .action(async (options: StartOptions) => {
      await startGateway(options);
    });

  program
    .command("stdio")
    .description("Start Goblin in STDIO mode")
    .option("--config <path>", "Path to config file")
    .action(async (options: { config?: string }) => {
      await startStdioGateway(options);
    });

  program
    .command("status")
    .description("Show Gateway status")
    .option("--json", "Output in JSON format")
    .option("--url <url>", "Gateway URL", "http://localhost:3000")
    .action(async (options: { json?: boolean; url?: string }) => {
      await statusCommand({ ...options, context: globalContext });
    });

  program.addCommand(createToolsCommand(globalContext));

  program.addCommand(createServersCommand(globalContext));

  const config = program.command("config").description("Configuration management");

  config
    .command("validate")
    .description("Validate config file")
    .option("--path <path>", "Path to config file")
    .option("--config <path>", "Path to config file (alias for --path)")
    .option("--json", "Output in JSON format")
    .action(async (options) => {
      await validateConfigCommand(options);
    });

  config
    .command("show")
    .description("Display current configuration")
    .option("--path <path>", "Path to config file")
    .option("--config <path>", "Path to config file (alias for --path)")
    .option("--json", "Output in JSON format")
    .action(async (options) => {
      await showConfigCommand(options);
    });

  program
    .command("logs")
    .description("Show recent logs")
    .option("--path <path>", "Path to log file")
    .option("-f, --follow", "Follow log output")
    .option("--level <level>", "Filter by log level (debug, info, warn, error)")
    .option("--json", "Output in JSON format")
    .action(async (options) => {
      await logsCommand(options);
    });

  program
    .command("health")
    .description("Show detailed health status")
    .option("--json", "Output in JSON format")
    .option("--url <url>", "Gateway URL", "http://localhost:3000")
    .action(async (options: { json?: boolean; url?: string }) => {
      await healthCommand({ ...options, context: globalContext });
    });

  program
    .command("stop")
    .description("Stop the running Gateway")
    .option("--url <url>", "Gateway URL", "http://localhost:3000")
    .action(async (options: { url?: string }) => {
      await stopCommand({ ...options, context: globalContext });
    });

  registerSlashCommands(program);

  program
    .command("help")
    .description("Show help information")
    .action(() => {
      displayRootHelp(VERSION);
    });

  const args = process.argv.slice(2);

  if (args.length === 0) {
    await startStdioGateway({});
    return;
  }

  if (args[0] === "-h" || args[0] === "--help") {
    displayRootHelp(VERSION);
    return;
  }

  program.parse();
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
