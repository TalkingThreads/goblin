import { DEFAULT_LOCK_PORT } from "../../daemon/index.js";
import { ExitCode } from "../exit-codes.js";
import type { CliContext } from "../types.js";

interface StatusOptions {
  json?: boolean;
  url?: string;
  context?: CliContext;
}

interface StatusData {
  mode?: string;
  pid?: number;
  servers: {
    total: number;
    online: number;
    offline: number;
  };
  tools: number;
  uptime: number;
  health?: string;
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
  const useJson = options.json ?? options.context?.json ?? false;

  // If user provided a specific URL, use it
  if (options.url && options.url !== "http://localhost:3000") {
    const url = options.url.replace(/\/$/, "");
    const statusUrl = `${url}/status`;
    await tryGetStatus(statusUrl, url, useJson);
    return;
  }

  // Try Lock Server first
  const lockServerUrl = `http://127.0.0.1:${DEFAULT_LOCK_PORT}/status`;
  try {
    const response = await fetch(lockServerUrl);
    if (response.ok) {
      const data = (await response.json()) as StatusData;
      printStatus(data, useJson);
      return;
    }
  } catch (e) {
    // Lock server not running or unreachable
  }

  // Fallback to default HTTP
  const defaultUrl = "http://localhost:3000/status";
  await tryGetStatus(defaultUrl, "http://localhost:3000", useJson, true);
}

function printStatus(data: StatusData, useJson: boolean) {
  if (useJson) {
    console.log(JSON.stringify(data));
    return;
  }

  console.log("Gateway Status");
  console.log("==============");
  if (data.mode) {
    console.log(`Mode: ${data.mode}`);
  }
  if (data.pid) {
    console.log(`PID: ${data.pid}`);
  }
  console.log(
    `Servers: ${data.servers.total} (${data.servers.online} online, ${data.servers.offline} offline)`,
  );
  console.log(`Tools: ${data.tools}`);
  console.log(`Uptime: ${formatUptime(data.uptime)}`);
  if (data.health) {
    console.log(`Health: ${data.health}`);
  }
}

async function tryGetStatus(
  url: string,
  displayUrl: string,
  useJson: boolean,
  isFallback = false,
): Promise<void> {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Gateway returned ${response.status}: ${response.statusText}`);
    }

    const data = (await response.json()) as StatusData;
    printStatus(data, useJson);
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
        if (isFallback) {
          console.log(
            "No Goblin server running. Start one with 'goblin start' or 'goblin start --transport http'",
          );
        } else {
          console.log("Gateway is not running");
          console.log("Use 'goblin start' to start the gateway");
        }
        process.exit(ExitCode.SUCCESS);
      } else {
        console.error(`Error: Could not connect to gateway at ${displayUrl}`);
        console.error("Make sure the gateway is running (goblin start)");
        process.exit(ExitCode.CONNECTION_ERROR);
      }
    }
  }
}
