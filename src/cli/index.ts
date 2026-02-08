import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Command } from "commander";
import { createCompleteCommand } from "./commands/complete.js";
import { createCompletionCommand } from "./commands/completion.js";
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
import { ExitCode } from "./exit-codes.js";
import type { CliContext } from "./types.js";
import { handleUnknownCommand } from "./utils/suggestions.js";

const MAIN_COMMANDS = [
  "start",
  "stdio",
  "version",
  "help",
  "status",
  "tools",
  "servers",
  "config",
  "logs",
  "health",
  "stop",
  "tui",
];

function isKnownCommand(arg: string): boolean {
  const normalized = arg.toLowerCase().replace(/^--/, "");
  return MAIN_COMMANDS.includes(normalized);
}

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
    .option("--tui", "Launch TUI dashboard")
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
    .addHelpText(
      "after",
      "\nExamples:\n  goblin start                    # Start gateway on default port 3000\n  goblin start --port 8080       # Start on port 8080\n  goblin start --tui             # Start with interactive TUI\n  goblin start --config ~/my-config.json  # Use custom config file",
    )
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
    .addHelpText(
      "after",
      "\nExamples:\n  goblin status                   # Check gateway status\n  goblin status --url http://localhost:3000  # Check remote gateway\n  goblin status --json           # Output as JSON",
    )
    .action(async (options: { json?: boolean; url?: string }) => {
      await statusCommand({ ...options, context: globalContext });
    });

  program.addCommand(createToolsCommand(globalContext));

  program.addCommand(createServersCommand(globalContext));

  program.addCommand(createCompletionCommand());

  program.addCommand(createCompleteCommand());

  const config = program.command("config").description("Configuration management");

  config
    .command("validate")
    .description("Validate config file")
    .option("--path <path>", "Path to config file")
    .option("--config <path>", "Path to config file (alias for --path)")
    .option("--json", "Output in JSON format")
    .addHelpText(
      "after",
      "\nExamples:\n  goblin config validate          # Validate default config\n  goblin config validate --path ~/goblin.json  # Validate custom config\n  goblin config validate --json   # Output validation result as JSON",
    )
    .action(async (options) => {
      await validateConfigCommand(options);
    });

  config
    .command("show")
    .description("Display current configuration")
    .option("--path <path>", "Path to config file")
    .option("--config <path>", "Path to config file (alias for --path)")
    .option("--json", "Output in JSON format")
    .addHelpText(
      "after",
      "\nExamples:\n  goblin config show              # Display current configuration\n  goblin config show --json       # Output as JSON\n  goblin config show --path ~/goblin.json  # Show specific config file",
    )
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
    .addHelpText(
      "after",
      "\nExamples:\n  goblin logs                     # Show last 50 log lines\n  goblin logs --follow           # Follow log output in real-time\n  goblin logs --level error      # Show only errors and above\n  goblin logs --json             # Output as JSON\n  goblin logs --path /var/log/goblin/app.log  # Use custom log path",
    )
    .action(async (options) => {
      await logsCommand(options);
    });

  program
    .command("health")
    .description("Show detailed health status")
    .option("--json", "Output in JSON format")
    .option("--url <url>", "Gateway URL", "http://localhost:3000")
    .addHelpText(
      "after",
      "\nExamples:\n  goblin health                   # Check gateway health\n  goblin health --url http://localhost:3000  # Check remote gateway\n  goblin health --json           # Output as JSON",
    )
    .action(async (options: { json?: boolean; url?: string }) => {
      await healthCommand({ ...options, context: globalContext });
    });

  program
    .command("stop")
    .description("Stop the running Gateway")
    .option("--url <url>", "Gateway URL", "http://localhost:3000")
    .addHelpText(
      "after",
      "\nExamples:\n  goblin stop                     # Stop the gateway\n  goblin stop --url http://localhost:3000  # Stop remote gateway",
    )
    .action(async (options: { url?: string }) => {
      await stopCommand({ ...options, context: globalContext });
    });

  program
    .command("tui")
    .description("Launch interactive TUI dashboard")
    .option("--port <number>", "Port to listen on")
    .option("--config <path>", "Path to config file")
    .addHelpText(
      "after",
      "\nExamples:\n  goblin tui                      # Launch TUI dashboard\n  goblin tui --port 8080        # Launch TUI on port 8080",
    )
    .action(async (options: { port?: string; config?: string }) => {
      await startGateway({ ...options, tui: true });
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

  // Check for --tui global flag early
  if (args.includes("--tui")) {
    const filteredArgs = args.filter((arg) => arg !== "--tui");
    const tuiOptions: StartOptions = { tui: true };

    // Extract --port from args
    const portIndex = filteredArgs.indexOf("--port");
    if (portIndex !== -1 && portIndex + 1 < filteredArgs.length) {
      tuiOptions.port = filteredArgs[portIndex + 1];
    }

    // Extract --config from args
    const configIndex = filteredArgs.indexOf("--config");
    if (configIndex !== -1 && configIndex + 1 < filteredArgs.length) {
      tuiOptions.config = filteredArgs[configIndex + 1];
    }

    await startGateway(tuiOptions);
    return;
  }

  if (args[0] === "-h" || args[0] === "--help") {
    displayRootHelp(VERSION);
    return;
  }

  if (args[0] === "-v" || args[0] === "--version") {
    console.log(VERSION);
    return;
  }

  if (args.length === 1 && args[0] && isKnownCommand(args[0])) {
    program.parse(args);
    return;
  }

  if (args.length === 1 && args[0] && !args[0].startsWith("-")) {
    const unknownCommand = args[0];
    handleUnknownCommand(unknownCommand);
    process.exit(ExitCode.GENERAL_ERROR);
  }

  program.parse();

  program.on("command:*", (args) => {
    const unknownCommand = args[0];
    handleUnknownCommand(unknownCommand);
    process.exit(ExitCode.GENERAL_ERROR);
  });
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(ExitCode.GENERAL_ERROR);
});
