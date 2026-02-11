import { ExitCode } from "../exit-codes.js";
import type { CliContext } from "../types.js";

interface HealthOptions {
  json?: boolean;
  url?: string;
  context?: CliContext;
}

interface MetricSummary {
  requests: number;
  errors: number;
  avgLatency: number;
  connections: number;
}

interface ServerInfo {
  name: string;
  transport: string;
  status: "online" | "offline";
  enabled: boolean;
  tools: number;
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
  metrics?: MetricSummary;
}

/**
 * Execute the health command
 */
export async function healthCommand(options: HealthOptions): Promise<void> {
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

  const baseUrl = url.replace(/\/$/, "");

  // Use global json flag if command flag not provided
  const useJson = options.json ?? globalJson ?? false;

  try {
    // Fetch data from multiple endpoints
    const [statusRes, serversRes] = await Promise.all([
      fetch(`${baseUrl}/status`),
      fetch(`${baseUrl}/servers`),
    ]);

    if (!statusRes.ok) {
      throw new Error(`Status check failed: ${statusRes.status} ${statusRes.statusText}`);
    }
    if (!serversRes.ok) {
      throw new Error(`Servers check failed: ${serversRes.status} ${serversRes.statusText}`);
    }

    const statusData = (await statusRes.json()) as StatusData;
    const { servers } = (await serversRes.json()) as { servers: ServerInfo[] };

    const metrics = statusData.metrics;

    if (useJson) {
      console.log(
        JSON.stringify({
          ...statusData,
          servers: servers.map((s) => ({
            name: s.name,
            status: s.status,
            tools: s.tools,
          })),
          metrics,
        }),
      );
      return;
    }

    console.log("Health Status");
    console.log("=============");
    console.log(`Overall: ${statusData.health}`);
    console.log("");

    console.log("Per-Server:");
    if (servers.length === 0) {
      console.log("  No servers configured");
    } else {
      for (const server of servers) {
        const displayStatus = server.status === "online" ? "healthy" : "offline";
        // Use a dot for the status icon as in example
        const dot = server.status === "online" ? "●" : "○";
        console.log(`${server.name.padEnd(14)} ${dot} ${displayStatus}`);
      }
    }
    console.log("");

    console.log("Metrics:");
    if (metrics) {
      console.log(`Errors: ${metrics.errors}`);
      console.log(`Avg Latency: ${metrics.avgLatency}ms`);
      console.log(`Connections: ${metrics.connections}`);
    } else {
      console.log("  Metrics not available");
    }
  } catch (error) {
    if (useJson) {
      console.log(
        JSON.stringify({
          error: "Could not connect to gateway",
          detail: error instanceof Error ? error.message : String(error),
        }),
      );
    } else {
      console.error(`Error: Could not connect to gateway at ${url}`);
      console.error("Make sure the gateway is running (goblin start)");
    }
    process.exit(ExitCode.CONNECTION_ERROR);
  }
}
