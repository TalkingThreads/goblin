import { z } from "zod";
import {
  getMetricsSummary,
  httpRequestDuration,
  mcpActiveConnections,
  mcpToolCallsTotal,
} from "../../observability/metrics.js";
import { defineMetaTool } from "./types.js";

/**
 * Calculate status based on metrics and server states
 */
function calculateStatus(
  serverCount: number,
  connectedCount: number,
  errorCount: number,
): "healthy" | "degraded" | "unhealthy" {
  if (serverCount === 0) {
    return "unhealthy";
  }
  if (connectedCount === 0) {
    return "unhealthy";
  }
  if (connectedCount < serverCount) {
    return "degraded";
  }
  if (errorCount > 10) {
    return "degraded";
  }
  return "healthy";
}

/**
 * Generate a compressed summary string from metrics
 */
function generateSummary(
  serverCount: number,
  connectedCount: number,
  errorCount: number,
  latencyP95: number,
): string {
  const parts: string[] = [];

  if (connectedCount === serverCount) {
    parts.push(`${connectedCount} servers up`);
  } else {
    parts.push(`${connectedCount}/${serverCount} servers up`);
  }

  if (errorCount > 0) {
    parts.push(`${errorCount} errors`);
  }

  if (latencyP95 > 0) {
    parts.push(`latency p95: ${latencyP95.toFixed(0)}ms`);
  }

  return parts.join(", ");
}

/**
 * Get gateway and server health status
 */
export const health = defineMetaTool({
  name: "health",
  description:
    "Get gateway and server health status. Returns status + summary by default. Use full: true for complete metrics.",
  parameters: z.object({
    full: z.boolean().optional().default(false).describe("Return complete metrics JSON"),
  }),
  execute: async (args, { config, registry }) => {
    const configuredServers = config.servers;
    const connectedTools = registry.listTools();

    // Calculate server status
    const serverStatus = configuredServers.map((s) => {
      const hasTools = connectedTools.some((t) => t.serverId === s.name);
      return {
        id: s.name,
        status: hasTools ? "connected" : s.enabled ? "connecting/empty" : "disabled",
        mode: s.mode,
        transport: s.transport,
      };
    });

    const connectedCount = serverStatus.filter((s) => s.status === "connected").length;
    const errorCount = mcpToolCallsTotal.value({ status: "error" }) || 0;

    // Calculate latency p95
    const httpValues = httpRequestDuration.values();
    const p95Latency = calculatePercentile(httpValues, 0.95) * 1000;

    // Calculate overall status
    const status = calculateStatus(serverStatus.length, connectedCount, errorCount);

    // Generate summary
    const summary = generateSummary(serverStatus.length, connectedCount, errorCount, p95Latency);

    // Base response
    const baseResponse = {
      status,
      summary,
      servers: {
        total: serverStatus.length,
        connected: connectedCount,
        list: serverStatus,
      },
    };

    // If full mode, include complete metrics
    if (args.full) {
      const metricsSummary = getMetricsSummary();
      return {
        ...baseResponse,
        full: true,
        metrics: {
          requests: metricsSummary.requests,
          errors: metricsSummary.errors,
          avgLatencyMs: metricsSummary.avgLatency,
          connections: metricsSummary.connections,
          latencyPercentiles: {
            p50: calculatePercentile(httpValues, 0.5) * 1000,
            p95: p95Latency,
            p99: calculatePercentile(httpValues, 0.99) * 1000,
          },
          connectionDetails: mcpActiveConnections.getAll().map((g) => ({
            server: g.labels["server"],
            transport: g.labels["transport"],
            connections: g.value,
          })),
        },
        gateway: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
        },
      };
    }

    return baseResponse;
  },
});

/**
 * Calculate percentile from histogram values (helper)
 */
function calculatePercentile(
  values: { count: number; sum: number; buckets: Record<number, number> },
  percentile: number,
): number {
  if (values.count === 0) return 0;
  const targetCount = values.count * percentile;
  let cumulative = 0;
  const sortedBuckets = Object.entries(values.buckets)
    .map(([bucket, count]) => [Number(bucket), count] as [number, number])
    .sort((a, b) => a[0] - b[0]);

  for (const [bucket, count] of sortedBuckets) {
    cumulative += count;
    if (cumulative >= targetCount) {
      return bucket;
    }
  }
  const lastBucket = sortedBuckets[sortedBuckets.length - 1];
  return lastBucket?.[0] || 0;
}
