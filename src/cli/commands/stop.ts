import { DEFAULT_LOCK_PORT } from "../../daemon/index.js";
import { ExitCode } from "../exit-codes.js";
import type { CliContext } from "../types.js";

function getLockPort(): number {
  return process.env["GOBLIN_LOCK_PORT"]
    ? Number.parseInt(process.env["GOBLIN_LOCK_PORT"], 10)
    : DEFAULT_LOCK_PORT;
}

interface StopOptions {
  url?: string;
  timeout?: number;
  context?: CliContext;
}

/**
 * Execute the stop command
 */
export async function stopCommand(options: StopOptions): Promise<void> {
  // If user provided a specific URL, use it
  if (options.url && options.url !== "http://localhost:3000") {
    const url = options.url.replace(/\/$/, "");
    const shutdownUrl = `${url}/shutdown`;
    await tryStopUrl(shutdownUrl, url);
    return;
  }

  // Otherwise, try the Lock Server first (covers stdio and http modes)
  const lockServerUrl = `http://127.0.0.1:${getLockPort()}/stop`;
  try {
    const response = await fetch(lockServerUrl, { method: "POST" });
    if (response.ok) {
      console.log("Gateway stopped successfully (via Lock Server)");
      process.exit(0);
    }
  } catch {
    // Lock server not running or unreachable
  }

  // Fallback to default HTTP port (in case lock server failed but HTTP didn't? Unlikely but safe)
  const defaultUrl = "http://localhost:3000/shutdown";
  await tryStopUrl(defaultUrl, "http://localhost:3000", true);
}

async function tryStopUrl(url: string, displayUrl: string, isFallback = false): Promise<void> {
  try {
    const response = await fetch(url, {
      method: "POST",
    });

    if (response.ok || response.status === 200 || response.status === 503) {
      console.log("Gateway stopped successfully");
      process.exit(0);
    }

    if (response.status === 404) {
      if (isFallback) {
        console.log("Gateway is not running");
        process.exit(0);
      }
      console.log("Gateway is not running (no shutdown endpoint)");
      process.exit(0);
    }

    const text = await response.text();
    throw new Error(`Gateway returned ${response.status}: ${text || response.statusText}`);
  } catch (error) {
    const isConnectionRefused =
      error instanceof Error &&
      (error.message.includes("ECONNREFUSED") ||
        error.message.includes("connection refused") ||
        error.message.includes("fetch failed") ||
        error.message.includes("Failed to fetch") ||
        error.message.includes("Unable to connect"));

    if (isConnectionRefused) {
      console.log("Gateway is not running");
      process.exit(0);
    }

    console.error(`Error: Could not stop gateway at ${displayUrl}`);
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(ExitCode.CONNECTION_ERROR);
  }
}
