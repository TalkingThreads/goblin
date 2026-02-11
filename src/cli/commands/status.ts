import { ExitCode } from "../exit-codes.js";
import type { CliContext } from "../types.js";

interface StatusOptions {
  json?: boolean;
  url?: string;
  context?: CliContext;
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
  // Use global context values as defaults, command flags override
  const globalPort = options.context?.port;
  const globalHost = options.context?.host;
  const globalJson = options.context?.json;

  // Build URL from global flags or command flag
  let url = options.url || "http://localhost:3000";
  if (globalHost || globalPort) {
    const baseUrl = new URL(url);
    if (globalHost) baseUrl.hostname = globalHost;
    if (globalPort) baseUrl.port = globalPort.toString();
    url = baseUrl.toString();
  }

  const statusUrl = `${url.replace(/\/$/, "")}/status`;

  // Use global json flag if command flag not provided
  const useJson = options.json ?? globalJson ?? false;

  try {
    const response = await fetch(statusUrl);

    if (!response.ok) {
      throw new Error(`Gateway returned ${response.status}: ${response.statusText}`);
    }

    const data = (await response.json()) as StatusData;

    if (useJson) {
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
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isConnectionRefused =
      errorMessage.includes("ECONNREFUSED") ||
      errorMessage.includes("connection refused") ||
      errorMessage.includes("ConnectionRefused") ||
      errorMessage.includes("fetch failed") ||
      errorMessage.includes("Failed to fetch") ||
      errorMessage.includes("fetch gateway status") ||
      errorMessage.includes("Unable to connect") ||
      errorMessage.includes("Connection refused");

    if (useJson) {
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
        process.exit(ExitCode.SUCCESS);
      } else {
        console.error(`Error: Could not connect to gateway at ${url}`);
        console.error("Make sure the gateway is running (goblin start)");
        process.exit(ExitCode.CONNECTION_ERROR);
      }
    }
  }
}
