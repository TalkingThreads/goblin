import { createLogger } from "../../observability/logger.js";

const logger = createLogger("cli-servers");

interface ServerOptions {
  json?: boolean;
  url?: string;
  status?: "online" | "offline" | "all";
}

interface ServerInfo {
  name: string;
  transport: string;
  status: "online" | "offline";
  enabled: boolean;
  tools: number;
}

/**
 * Execute the servers command
 */
export async function serversCommand(options: ServerOptions): Promise<void> {
  const url = options.url || "http://localhost:3000";
  const serversUrl = new URL(`${url.replace(/\/$/, "")}/servers`);

  if (options.status && options.status !== "all") {
    serversUrl.searchParams.append("status", options.status);
  }

  try {
    const response = await fetch(serversUrl.toString());

    if (!response.ok) {
      throw new Error(`Gateway returned ${response.status}: ${response.statusText}`);
    }

    const { servers } = (await response.json()) as { servers: ServerInfo[] };

    if (options.json) {
      console.log(JSON.stringify({ servers }));
      return;
    }

    if (servers.length === 0) {
      console.log("No servers found.");
      return;
    }

    console.log("Servers");
    console.log("=======");

    // Find column widths for alignment
    const nameWidth = Math.max(...servers.map((s) => s.name.length), 10) + 2;
    const transportWidth = Math.max(...servers.map((s) => s.transport.length), 10) + 2;
    const enabledWidth = 10;

    for (const server of servers) {
      const name = server.name.padEnd(nameWidth);
      const transport = server.transport.padEnd(transportWidth);
      const statusIcon = server.status === "online" ? "●" : "○";
      const statusText = server.status.padEnd(10);
      const enabledText = (server.enabled ? "enabled" : "disabled").padEnd(enabledWidth);
      const toolCount = `${server.tools} tools`;

      console.log(`${name}${transport}${statusIcon} ${statusText}${enabledText}${toolCount}`);
    }
  } catch (error) {
    if (options.json) {
      console.log(
        JSON.stringify({
          error: "Could not connect to gateway",
          detail: error instanceof Error ? error.message : String(error),
        }),
      );
    } else {
      logger.error({ error, url: serversUrl.toString() }, "Failed to fetch servers");
      console.error(`Error: Could not connect to gateway at ${url}`);
      console.error("Make sure the gateway is running (goblin start)");
    }
    process.exit(1);
  }
}
