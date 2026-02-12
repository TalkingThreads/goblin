import { Command } from "commander";
import { PROJECT_META } from "../meta.js";
import { initSessionLogging } from "../observability/init.js";
import { createCompletionCommand } from "./commands/completion.js";
import { logsCommand } from "./commands/logs.js";
import { registerSlashCommands } from "./commands/slashes/index.js";
import { stopCommand } from "./commands/stop.js";
import { ExitCode } from "./exit-codes.js";
import type { CliContext } from "./types.js";
import { handleUnknownCommand } from "./utils/suggestions.js";

const MAIN_COMMANDS = [
  "start",
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

function displayRootHelp(version: string): void {
  console.log(`
Goblin MCP Gateway ${version}

A developer-first MCP gateway that aggregates multiple MCP servers behind a single unified endpoint.

Usage: goblin <command> [options]

Common Commands:
  goblin start              Start gateway (defaults to STDIO mode)
  goblin servers            List and manage configured servers
  goblin tools              List available tools
  goblin status             Show gateway status
  goblin tui                Launch interactive TUI (coming soon)

Global Flags:
  -h, --help         Show this help message
  -v, --version      Show version information

Documentation:
  https://goblin.sh/docs

For more information, run: goblin <command> --help
 `);
}

interface StartOptions {
  tui?: boolean;
  port?: string;
  config?: string;
  transport?: "http" | "sse" | "stdio";
}

function parseGlobalFlags(args: string[]): CliContext {
  const context: CliContext = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case "--json":
        context.json = true;
        break;
    }
  }

  return context;
}

async function validateConfigPath(configPath: string): Promise<boolean> {
  try {
    const { stat } = await import("node:fs/promises");
    await stat(configPath);
    return true;
  } catch {
    return false;
  }
}

async function handleEmptyArgs(_globalContext: CliContext, VERSION: string): Promise<void> {
  displayRootHelp(VERSION);
  process.exit(0);
}

async function handleTuiFlag(args: string[], globalContext: CliContext): Promise<void> {
  const filteredArgs = args.filter((arg) => arg !== "--tui");
  const tuiOptions: StartOptions = { tui: true };

  const portIndex = filteredArgs.indexOf("--port");
  if (portIndex !== -1 && portIndex + 1 < filteredArgs.length) {
    tuiOptions.port = filteredArgs[portIndex + 1];
  }

  const configIndex = filteredArgs.indexOf("--config");
  if (configIndex !== -1 && configIndex + 1 < filteredArgs.length) {
    tuiOptions.config = filteredArgs[configIndex + 1];
  }

  const { startGateway } = await import("./commands/start.jsx");
  await startGateway(tuiOptions, globalContext);
}

function handleHelpFlags(args: string[], VERSION: string): boolean {
  if (args[0] === "-h" || args[0] === "--help") {
    displayRootHelp(VERSION);
    process.exit(0);
    return true;
  }
  return false;
}

function handleVersionFlags(args: string[], VERSION: string): boolean {
  if (args[0] === "-v" || args[0] === "--version") {
    console.log(VERSION);
    process.exit(0);
    return true;
  }
  return false;
}

function handleKnownSingleCommands(args: string[], VERSION: string, program: Command): boolean {
  if (args.length === 1 && args[0] && isKnownCommand(args[0])) {
    const command = args[0];
    if (command === "help") {
      displayRootHelp(VERSION);
      process.exit(0);
    } else if (command === "version") {
      console.log(VERSION);
      process.exit(0);
    } else {
      program.parse(process.argv);
    }
    return true;
  }
  return false;
}

async function validateGlobalConfig(globalContext: CliContext): Promise<boolean> {
  if (globalContext.configPath) {
    const configExists = await validateConfigPath(globalContext.configPath);
    if (!configExists) {
      console.error(`Error: Config file not found: ${globalContext.configPath}`);
      process.exit(ExitCode.CONFIG_ERROR);
      return false;
    }
  }
  return true;
}

async function main(): Promise<void> {
  // Initialize logging FIRST, before any module imports create loggers
  const logPath = await initSessionLogging();
  console.error(`[Goblin] Logging to ${logPath}`);

  const VERSION = PROJECT_META.version;

  const program = new Command();

  const globalContext = parseGlobalFlags(process.argv.slice(2));

  const args = process.argv.slice(2);

  program
    .name("goblin")
    .description("Goblin MCP Gateway CLI")
    .option("-v, --version", "output version number")
    .action(async (options) => {
      if (options.version) {
        console.log(VERSION);
        process.exit(0);
      }
      // Default behavior: Show help
      displayRootHelp(VERSION);
      process.exit(0);
    });

  program
    .command("version")
    .description("Show version information")
    .option("--json", "Output in JSON format")
    .action(async (options) => {
      const jsonFlag = (options as Record<string, unknown>)["json"] as boolean | undefined;
      if (jsonFlag || globalContext.json) {
        console.log(JSON.stringify({ version: VERSION, exitCode: 0 }));
      } else {
        console.log(VERSION);
      }
      process.exit(0);
    });

  program
    .command("start")
    .description("Start the Gateway")
    .option("-t, --transport <type>", "Transport type: http, sse, stdio (default: stdio)")
    .option("--verbose", "Enable verbose logging")
    .option("--port <number>", "Port to listen on (default: 3000)")
    .option("--host <host>", "Host to bind to (default: 127.0.0.1)")
    .option("--config <path>", "Path to config file")
    .option("--tui", "Enable TUI mode")
    .addHelpText(
      "after",
      "\nExamples:\n  goblin start                    # Start in STDIO mode (default)\n  goblin start --transport http   # Start HTTP gateway with REST API\n  goblin start --transport sse    # Start SSE gateway with REST API\n  goblin start --port 8080        # Start on port 8080\n  goblin start --host 0.0.0.0     # Bind to all interfaces\n  goblin start --verbose          # Enable verbose logging\n  goblin start --config ~/my-config.json  # Use custom config file\n  goblin start --tui              # Start with interactive TUI",
    )
    .action(async (options: StartOptions & { transport?: string; verbose?: boolean }) => {
      // Handle verbose flag for start command
      if (options.verbose) {
        process.env["LOG_LEVEL"] = "debug";
      }

      const { startGateway } = await import("./commands/start.jsx");
      const startOptions: StartOptions = {
        ...options,
        transport: options.transport as StartOptions["transport"],
      };
      await startGateway(startOptions, globalContext);
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
      const { statusCommand: cmd } = await import("./commands/status.js");
      await cmd({ ...options, context: globalContext });
    });

  const { createToolsCommand } = await import("./commands/tools.js");
  program.addCommand(createToolsCommand(globalContext));

  const { createServersCommand } = await import("./commands/servers.js");
  program.addCommand(createServersCommand(globalContext));

  program.addCommand(createCompletionCommand());

  const { createCompleteCommand } = await import("./commands/complete.js");
  program.addCommand(createCompleteCommand());

  const config = program.command("config").description("Configuration management");

  const { showConfigCommand, validateConfigCommand } = await import("./commands/config.js");

  config
    .command("validate")
    .description("Validate config file")
    .option("--path <path>", "Path to config file")
    .option("--json", "Output in JSON format")
    .addHelpText(
      "after",
      "\nExamples:\n  goblin config validate          # Validate default config\n  goblin config validate --path ~/goblin.json  # Validate custom config\n  goblin config validate --json   # Output validation result as JSON",
    )
    .action(async (options) => {
      await validateConfigCommand({ ...options, context: globalContext });
    });

  config
    .command("show")
    .description("Display current configuration")
    .option("--path <path>", "Path to config file")
    .option("--json", "Output in JSON format")
    .addHelpText(
      "after",
      "\nExamples:\n  goblin config show              # Display current configuration\n  goblin config show --json       # Output as JSON\n  goblin config show --path ~/goblin.json  # Show specific config file",
    )
    .action(async (options) => {
      await showConfigCommand({ ...options, context: globalContext });
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
      const { healthCommand: cmd } = await import("./commands/health.js");
      await cmd({ ...options, context: globalContext });
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
      const { startGateway } = await import("./commands/start.jsx");
      await startGateway({ ...options, tui: true }, globalContext);
    });

  registerSlashCommands(program);

  program
    .command("help")
    .description("Show help information")
    .action(() => {
      displayRootHelp(VERSION);
      process.exit(0);
    });

  if (args.length === 0) {
    await handleEmptyArgs(globalContext, VERSION);
    return;
  }

  if (args.includes("--tui")) {
    await handleTuiFlag(args, globalContext);
    return;
  }

  if (handleHelpFlags(args, VERSION)) {
    return;
  }

  if (handleVersionFlags(args, VERSION)) {
    return;
  }

  if (handleKnownSingleCommands(args, VERSION, program)) {
    return;
  }

  if (args.length === 1 && args[0] && !args[0].startsWith("-")) {
    const unknownCommand = args[0];
    handleUnknownCommand(unknownCommand);
    process.exit(ExitCode.GENERAL_ERROR);
  }

  const configValid = await validateGlobalConfig(globalContext);
  if (!configValid) {
    return;
  }

  program.parse();

  program.on("command:*", (commandArgs) => {
    const unknownCommand = commandArgs[0];
    handleUnknownCommand(unknownCommand);
    process.exit(ExitCode.GENERAL_ERROR);
  });
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(ExitCode.GENERAL_ERROR);
});
