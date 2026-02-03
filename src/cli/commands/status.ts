import { createLogger } from "../../observability/logger.js";

const logger = createLogger("cli-status");

interface StatusOptions {
  json?: boolean;
  url?: string;
}

interface StatusData {
  servers: {
    total: number;
    online: number;
    offline: number;
  };
  tools: number;
  uptime: number;
  health: string;
}

/**
 * Format uptime seconds into human readable string
 */
function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  const parts: string[] = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  if (h === 0 && m === 0) parts.push(`${s}s`);

  return parts.join(" ");
}

/**
 * Execute the status command
 */
export async function statusCommand(options: StatusOptions): Promise<void> {
  const url = options.url || "http://localhost:3000";
  const statusUrl = `${url.replace(/\/$/, "")}/status`;

  try {
    const response = await fetch(statusUrl);

    if (!response.ok) {
      throw new Error(`Gateway returned ${response.status}: ${response.statusText}`);
    }

    const data = (await response.json()) as StatusData;

    if (options.json) {
      console.log(JSON.stringify(data));
      return;
    }

    console.log("Gateway Status");
    console.log("==============");
    console.log(
      `Servers: ${data.servers.total} (${data.servers.online} online, ${data.servers.offline} offline)`,
    );
    console.log(`Tools: ${data.tools}`);
    console.log(`Uptime: ${formatUptime(data.uptime)}`);
    console.log(`Health: ${data.health}`);
  } catch (error) {
    const isConnectionRefused =
      error instanceof Error &&
      (error.message.includes("ECONNREFUSED") ||
        error.message.includes("connection refused") ||
        error.message.includes("fetch failed"));

    if (options.json) {
      console.log(
        JSON.stringify({
          servers: { total: 0, online: 0, offline: 0 },
          tools: 0,
          uptime: 0,
          health: "offline",
          offline: true,
        }),
      );
    } else {
      if (isConnectionRefused) {
        console.log("Gateway Status");
        console.log("==============");
        console.log("Gateway is not running");
        console.log("Use 'goblin start' to start the gateway");
      } else {
        logger.error({ error, url: statusUrl }, "Failed to fetch gateway status");
        console.error(`Error: Could not connect to gateway at ${url}`);
        console.error("Make sure the gateway is running (goblin start)");
      }
    }
    process.exit(isConnectionRefused ? 0 : 1);
  }
}
