import { Counter, collectDefaultMetrics, Gauge, Histogram, Registry } from "prom-client";

// Create a new registry
export const register = new Registry();

// Collect default metrics (GC, memory, etc.)
collectDefaultMetrics({ register });

// --- HTTP Metrics ---

export const httpRequestsTotal = new Counter({
  name: "goblin_http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status"],
  registers: [register],
});

export const httpRequestDuration = new Histogram({
  name: "goblin_http_request_duration_seconds",
  help: "HTTP request duration in seconds",
  labelNames: ["method", "route", "status"],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
  registers: [register],
});

// --- MCP Metrics ---

export const mcpToolCallsTotal = new Counter({
  name: "goblin_mcp_tool_calls_total",
  help: "Total number of MCP tool calls",
  labelNames: ["server", "tool", "status"], // status: success, error
  registers: [register],
});

export const mcpToolDuration = new Histogram({
  name: "goblin_mcp_tool_duration_seconds",
  help: "MCP tool execution duration in seconds",
  labelNames: ["server", "tool", "status"],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60],
  registers: [register],
});

export const mcpActiveConnections = new Gauge({
  name: "goblin_mcp_active_connections",
  help: "Number of active connections to backend servers",
  labelNames: ["server", "transport"],
  registers: [register],
});
