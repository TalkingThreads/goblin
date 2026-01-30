import { Command } from "commander";
import { createLogger } from "../observability/logger.js";

const logger = createLogger("cli");

interface StartOptions {
  tui?: boolean;
  port?: string;
  config?: string;
}

/**
 * Placeholder for starting the gateway
 */
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
    console.log("Starting...");
    await startGateway(options);
  });

program
  .command("status")
  .description("Show Gateway status")
  .action(() => {
    console.log("Not implemented (requires running gateway)");
  });

program
  .command("tools")
  .description("List available tools")
  .action(() => {
    console.log("Not implemented (requires running gateway)");
  });

program.parse();
