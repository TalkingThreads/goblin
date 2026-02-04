/**
 * Execute Slash Command CLI
 */

interface ExecOptions {
  url?: string;
  args?: string;
  server?: string;
}

interface SlashCommandResponse {
  content: Array<{
    type: string;
    text?: string;
    data?: string;
    mimeType?: string;
    uri?: string;
  }>;
}

export async function execSlash(command: string, options: ExecOptions): Promise<void> {
  const url = options.url || "http://localhost:3000";
  const apiUrl = `${url.replace(/\/$/, "")}/api/v1/slashes/${command}`;

  let parsedArgs: Record<string, string> = {};

  if (options.args) {
    try {
      parsedArgs = JSON.parse(options.args);
    } catch {
      console.error("Error: Invalid JSON in --args option.");
      process.exit(1);
    }
  }

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(parsedArgs),
    });

    if (!response.ok) {
      const errorData = (await response.json().catch(() => ({}))) as {
        error?: string;
        conflict?: { suggestions: string[] };
      };
      console.error(`Error: ${errorData.error || response.statusText}`);

      if (errorData.conflict) {
        console.log("\nAvailable versions:");
        for (const suggestion of errorData.conflict.suggestions) {
          console.log(`  ${suggestion}`);
        }
      }
      process.exit(1);
    }

    const result = (await response.json()) as SlashCommandResponse;

    console.log("\nCommand executed successfully:");
    console.log("=".repeat(60));

    for (const content of result.content) {
      if (content.type === "text" && content.text) {
        console.log(content.text);
      } else if (content.type === "image" && content.data) {
        console.log(`[Image: ${content.mimeType || "unknown type"}, ${content.data.length} bytes]`);
      } else if (content.type === "resource" && content.uri) {
        console.log(`[Resource: ${content.uri}]`);
      }
    }
  } catch (error) {
    console.error(`Error executing slash command: ${error}`);
    process.exit(1);
  }
}
