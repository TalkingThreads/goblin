import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Command } from "commander";
import { showConfigCommand, validateConfigCommand } from "./commands/config.js";
import { healthCommand } from "./commands/health.js";
import { logsCommand } from "./commands/logs.js";
import { serversCommand } from "./commands/servers.js";
import { registerSlashCommands } from "./commands/slashes/index.js";
import { startGateway } from "./commands/start.jsx";
import { statusCommand } from "./commands/status.js";
import { stopCommand } from "./commands/stop.js";
import { toolsCommand } from "./commands/tools.js";

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

interface StartOptions {
  tui?: boolean;
  port?: string;
  config?: string;
}

async function main(): Promise<void> {
  const VERSION = await getVersion();

  const program = new Command();

  program
    .name("goblin")
    .description("Goblin MCP Gateway CLI")
    .option("-v, --version", "output version number")
    .action(() => {
      console.log(VERSION);
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
    .command("status")
    .description("Show Gateway status")
    .option("--json", "Output in JSON format")
    .option("--url <url>", "Gateway URL", "http://localhost:3000")
    .action(async (options: { json?: boolean; url?: string }) => {
      await statusCommand(options);
    });

  program
    .command("tools")
    .description("List available tools")
    .option("--json", "Output in JSON format")
    .option("--url <url>", "Gateway URL", "http://localhost:3000")
    .option("--server <name>", "Filter by server name")
    .option("--search <query>", "Search tools by name or description")
    .action(async (options: { json?: boolean; url?: string; server?: string; search?: string }) => {
      await toolsCommand(options);
    });

  program
    .command("servers")
    .description("List configured servers")
    .option("--json", "Output in JSON format")
    .option("--url <url>", "Gateway URL", "http://localhost:3000")
    .option("--status <status>", "Filter by status (online, offline, all)", "all")
    .action(
      async (options: { json?: boolean; url?: string; status?: "online" | "offline" | "all" }) => {
        await serversCommand(options);
      },
    );

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
      await healthCommand(options);
    });

  program
    .command("stop")
    .description("Stop the running Gateway")
    .option("--url <url>", "Gateway URL", "http://localhost:3000")
    .action(async (options: { url?: string }) => {
      await stopCommand(options);
    });

  registerSlashCommands(program);

  program
    .command("help")
    .description("Show help information")
    .action(() => {
      program.help();
    });

  program.parse();
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
