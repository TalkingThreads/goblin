/**
 * Slash Commands CLI
 */

import type { Command } from "commander";
import { execSlash } from "./exec.js";
import { listSlashes } from "./list.js";
import { showSlash } from "./show.js";

export function registerSlashCommands(program: Command): void {
  const slashes = program.command("slashes").description("Manage and execute slash commands");

  slashes
    .command("list")
    .description("List available slash commands")
    .option("--url <url>", "Gateway URL", "http://localhost:3000")
    .option("--conflicts", "Show only conflicting commands")
    .option("--format <json|table>", "Output format", "table")
    .action(listSlashes);

  slashes
    .command("show <command>")
    .description("Show slash command details")
    .option("--url <url>", "Gateway URL", "http://localhost:3000")
    .option("--verbose", "Show full details including arguments")
    .action(showSlash);

  slashes
    .command("exec <command>")
    .description("Execute a slash command")
    .option("--url <url>", "Gateway URL", "http://localhost:3000")
    .option("--args <json>", "Arguments as JSON")
    .option("--server <name>", "Server to use (for ambiguous commands)")
    .action(execSlash);
}
