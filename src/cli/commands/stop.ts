import { createLogger } from "../../observability/logger.js";
import type { CliContext } from "../types.js";

const logger = createLogger("cli-stop");

interface StopOptions {
  url?: string;
  timeout?: number;
  context?: CliContext;
}

/**
 * Execute the stop command
 */
export async function stopCommand(options: StopOptions): Promise<void> {
  // Use global context values as defaults
  const globalPort = options.context?.port;
  const globalHost = options.context?.host;

  // Build URL from global flags or command flag
  let url = options.url || "http://localhost:3000";
  if (globalHost || globalPort) {
    const baseUrl = new URL(url);
    if (globalHost) baseUrl.hostname = globalHost;
    if (globalPort) baseUrl.port = globalPort.toString();
    url = baseUrl.toString();
  }

  const shutdownUrl = `${url.replace(/\/$/, "")}/shutdown`;

  try {
    const response = await fetch(shutdownUrl, {
      method: "POST",
    });

    if (response.ok || response.status === 200 || response.status === 503) {
      console.log("Gateway stopped successfully");
      process.exit(0);
    }

    // Handle 404 or any "not found" response - gateway may not have /shutdown endpoint
    if (response.status === 404) {
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

    logger.error({ error, url: shutdownUrl }, "Failed to stop gateway");
    console.error(`Error: Could not stop gateway at ${url}`);
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
