/**
 * Show Slash Command CLI
 */

interface ShowOptions {
  url?: string;
  verbose?: boolean;
}

interface SlashCommandInfo {
  id: string;
  name: string;
  serverId: string;
  description: string;
  arguments: Array<{
    name: string;
    required: boolean;
    description: string;
  }>;
}

interface SlashListResponse {
  commands: SlashCommandInfo[];
  conflicts: Array<{
    command: string;
    servers: string[];
    suggestions: string[];
  }>;
}

export async function showSlash(command: string, options: ShowOptions): Promise<void> {
  const url = options.url || "http://localhost:3000";
  const apiUrl = `${url.replace(/\/$/, "")}/api/v1/slashes`;

  try {
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`Gateway returned ${response.status}: ${response.statusText}`);
    }

    const data = (await response.json()) as SlashListResponse;

    const targetCommand = data.commands.find((c) => c.name === command || c.id === command);

    if (!targetCommand) {
      const conflict = data.conflicts.find((c) => c.command === command);
      if (conflict) {
        console.log(`Command /${command} is ambiguous. Available on:`);
        for (const suggestion of conflict.suggestions) {
          const cmd = data.commands.find((c) => c.id === suggestion.slice(1));
          if (cmd) {
            console.log(`  ${suggestion} - ${cmd.serverId}`);
          }
        }
        return;
      }
      console.error(`Error: Slash command /${command} not found.`);
      process.exit(1);
    }

    console.log(`\nCommand: /${targetCommand.id}`);
    console.log("=".repeat(60));
    console.log(`Server: ${targetCommand.serverId}`);
    console.log(`Description: ${targetCommand.description || "No description"}`);

    if (options.verbose && targetCommand.arguments.length > 0) {
      console.log("\nArguments:");
      console.log("-".repeat(40));
      for (const arg of targetCommand.arguments) {
        const required = arg.required ? "(required)" : "(optional)";
        console.log(`  --${arg.name} ${required}`);
        console.log(`    ${arg.description}`);
      }
    }

    if (options.verbose) {
      console.log(
        `\nUsage: goblin slashes exec ${targetCommand.id} --args '{"${targetCommand.arguments[0]?.name || "arg"}": "value"}'`,
      );
    }
  } catch (error) {
    console.error(`Error fetching slash command: ${error}`);
    process.exit(1);
  }
}
