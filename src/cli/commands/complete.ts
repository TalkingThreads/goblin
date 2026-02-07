import { Command } from "commander";
import { completeServerNames, printServerNames } from "../completion/server-names.js";
import { completeToolNames, printToolNames } from "../completion/tool-names.js";

export function createCompleteCommand(): Command {
  const command = new Command("complete");

  command.description("Dynamic completion for servers and tools");

  command
    .command("servers [partial]")
    .description("Complete server names")
    .option("--url <url>", "Gateway URL", "http://localhost:3000")
    .option("--config <path>", "Config file path")
    .action(async (partial: string | undefined, options: { url?: string; config?: string }) => {
      if (partial) {
        const result = await completeServerNames(partial, {
          url: options.url,
          configPath: options.config,
        });
        for (const name of result.items) {
          console.log(name);
        }
      } else {
        await printServerNames({
          url: options.url,
          configPath: options.config,
        });
      }
    });

  command
    .command("tools [partial]")
    .description("Complete tool names")
    .option("--url <url>", "Gateway URL", "http://localhost:3000")
    .option("--config <path>", "Config file path")
    .action(async (partial: string | undefined, options: { url?: string; config?: string }) => {
      if (partial) {
        const result = await completeToolNames(partial, {
          url: options.url,
          configPath: options.config,
        });
        for (const name of result.items) {
          console.log(name);
        }
      } else {
        await printToolNames({
          url: options.url,
          configPath: options.config,
        });
      }
    });

  return command;
}
