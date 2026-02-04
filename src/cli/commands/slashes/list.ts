/**
 * List Slash Commands CLI
 */

interface ListOptions {
  url?: string;
  conflicts?: boolean;
  format?: string;
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

export async function listSlashes(options: ListOptions): Promise<void> {
  const url = options.url || "http://localhost:3000";
  const apiUrl = `${url.replace(/\/$/, "")}/api/v1/slashes`;

  try {
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`Gateway returned ${response.status}: ${response.statusText}`);
    }

    const data = (await response.json()) as SlashListResponse;

    let commands = data.commands;

    if (options.conflicts) {
      const conflictCommands = data.conflicts.map((c) => c.command);
      commands = commands.filter((c) => conflictCommands.includes(c.name));
    }

    if (options.format === "json") {
      console.log(
        JSON.stringify(
          {
            commands: options.conflicts ? commands : data.commands,
            conflicts: options.conflicts ? data.conflicts : undefined,
          },
          null,
          2,
        ),
      );
      return;
    }

    console.log("\nAvailable Slash Commands:");
    console.log("=".repeat(60));

    if (commands.length === 0) {
      console.log("No slash commands found.");
      return;
    }

    for (const cmd of commands) {
      const isConflict = data.conflicts.some((c) => c.command === cmd.name);
      const conflictMarker = isConflict ? " [!]" : "";
      console.log(`  /${cmd.id}${conflictMarker}`);
      console.log(`    ${cmd.description || "No description"}`);
      console.log(`    Server: ${cmd.serverId}`);
      console.log();
    }

    if (data.conflicts.length > 0 && !options.conflicts) {
      console.log(`\nConflicts (${data.conflicts.length}):`);
      console.log("-".repeat(40));
      for (const conflict of data.conflicts) {
        console.log(`  /${conflict.command}: ${conflict.servers.join(", ")}`);
        console.log(`    Use: ${conflict.suggestions.join(", ")}`);
      }
    }
  } catch (error) {
    console.error(`Error fetching slash commands: ${error}`);
    console.error("Make sure the gateway is running (goblin start)");
    process.exit(1);
  }
}
