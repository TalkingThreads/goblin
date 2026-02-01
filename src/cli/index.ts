import { Command } from "commander";
import { createLogger } from "../observability/logger.js";

const logger = createLogger("cli");

interface StartOptions {
  tui?: boolean;
  port?: string;
  config?: string;
}

async function startGateway(options: StartOptions): Promise<void> {
  logger.info({ options }, "Starting gateway...");
  // Implementation will follow in future tasks
}

const program = new Command();

program.name("goblin").description("Goblin MCP Gateway CLI").version("0.1.0");

program
  .command("start")
  .description("Start the Gateway")
  .option("--tui", "Enable TUI mode")
  .option("--port <number>", "Port to listen on")
  .option("--config <path>", "Path to config file")
  .action(async (options: StartOptions) => {
    logger.info({ options }, "Starting gateway");
    await startGateway(options);
  });

program
  .command("status")
  .description("Show Gateway status")
  .action(() => {
    logger.info("Status command invoked - requires running gateway");
  });

program
  .command("tools")
  .description("List available tools")
  .action(() => {
    logger.info("Tools command invoked - requires running gateway");
  });

program.parse();
