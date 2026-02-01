/**
 * Lightweight in-memory metrics registry for developer-first observability
 * Replaces prom-client with zero-dependency implementation
 */

import { createLogger } from "./logger.js";

const logger = createLogger("metrics");

/**
 * Labels for metrics (key-value pairs)
 */
export type Labels = Record<string, string>;

/**
 * Counter metric - only increments
 */
export interface Counter {
  inc(labels?: Labels): void;
  value(labels?: Labels): number;
}

/**
 * Gauge metric - can increment and decrement
 */
export interface Gauge {
  set(value: number, labels?: Labels): void;
  inc(labels?: Labels): void;
  dec(labels?: Labels): void;
  value(labels?: Labels): number;
  getAll(): Array<{ labels: Labels; value: number }>;
}

/**
 * Histogram metric - collects observations
 */
export interface Histogram {
  observe(value: number, labels?: Labels): void;
  values(labels?: Labels): { count: number; sum: number; buckets: Record<number, number> };
}

/**
 * Metrics registry - stores all metrics and provides serialization
 */
export interface MetricsRegistry {
  /**
   * Create or get a counter
   */
  counter(name: string, help?: string): Counter;

  /**
   * Create or get a gauge
   */
  gauge(name: string, help?: string): Gauge;

  /**
   * Create or get a histogram with custom buckets
   */
  histogram(name: string, buckets?: number[], help?: string): Histogram;

  /**
   * Get all metrics as JSON object
   */
  toJSON(): Record<string, unknown>;

  /**
   * Reset all metrics
   */
  reset(): void;
}

/**
 * Internal counter implementation
 */
class CounterImpl implements Counter {
  private values = new Map<string, number>();

  private getKey(labels?: Labels): string {
    if (!labels || Object.keys(labels).length === 0) {
      return "_global_";
    }
    return Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${v}`)
      .join(",");
  }

  inc(labels?: Labels): void {
    const key = this.getKey(labels);
    this.values.set(key, (this.values.get(key) || 0) + 1);
  }

  value(labels?: Labels): number {
    return this.values.get(this.getKey(labels)) || 0;
  }
}

/**
 * Internal gauge implementation
 */
class GaugeImpl implements Gauge {
  private values = new Map<string, { labels: Labels; value: number }>();

  private getKey(labels?: Labels): string {
    if (!labels || Object.keys(labels).length === 0) {
      return "_global_";
    }
    const sortedLabels = Object.entries(labels).sort(([a], [b]) => a.localeCompare(b));
    return sortedLabels.map(([k, v]) => `${k}:${v}`).join(",");
  }

  set(value: number, labels?: Labels): void {
    const key = this.getKey(labels);
    this.values.set(key, { labels: labels || {}, value });
  }

  inc(labels?: Labels): void {
    const key = this.getKey(labels);
    const existing = this.values.get(key) || { labels: labels || {}, value: 0 };
    existing.value += 1;
    this.values.set(key, existing);
  }

  dec(labels?: Labels): void {
    const key = this.getKey(labels);
    const existing = this.values.get(key) || { labels: labels || {}, value: 0 };
    existing.value -= 1;
    this.values.set(key, existing);
  }

  value(labels?: Labels): number {
    return this.values.get(this.getKey(labels))?.value || 0;
  }

  getAll(): Array<{ labels: Labels; value: number }> {
    return Array.from(this.values.values());
  }
}

/**
 * Internal histogram implementation
 */
class HistogramImpl implements Histogram {
  private buckets: number[];
  private observations = new Map<
    string,
    { count: number; sum: number; buckets: Record<number, number> }
  >();

  constructor(buckets: number[]) {
    this.buckets = [...buckets].sort((a, b) => a - b);
  }

  private getKey(labels?: Labels): string {
    if (!labels || Object.keys(labels).length === 0) {
      return "_global_";
    }
    return Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${v}`)
      .join(",");
  }

  observe(value: number, labels?: Labels): void {
    const key = this.getKey(labels);
    const existing = this.observations.get(key) || {
      count: 0,
      sum: 0,
      buckets: {} as Record<number, number>,
    };

    // Initialize bucket counts
    for (const bucket of this.buckets) {
      existing.buckets[bucket] = existing.buckets[bucket] || 0;
    }

    existing.count += 1;
    existing.sum += value;

    // Count bucket
    for (const bucket of this.buckets) {
      if (value <= bucket) {
        existing.buckets[bucket] = (existing.buckets[bucket] || 0) + 1;
      }
    }

    this.observations.set(key, existing);
  }

  values(labels?: Labels): { count: number; sum: number; buckets: Record<number, number> } {
    return this.observations.get(this.getKey(labels)) || { count: 0, sum: 0, buckets: {} };
  }
}

/**
 * Metrics registry implementation
 */
export class MetricsRegistryImpl implements MetricsRegistry {
  private counters = new Map<string, CounterImpl>();
  private gauges = new Map<string, GaugeImpl>();
  private histograms = new Map<string, HistogramImpl>();
  private descriptions = new Map<string, string>();

  counter(name: string, help?: string): Counter {
    if (!this.counters.has(name)) {
      this.counters.set(name, new CounterImpl());
      if (help) this.descriptions.set(name, help);
    }
    return this.counters.get(name)!;
  }

  gauge(name: string, help?: string): Gauge {
    if (!this.gauges.has(name)) {
      this.gauges.set(name, new GaugeImpl());
      if (help) this.descriptions.set(name, help);
    }
    return this.gauges.get(name)!;
  }

  histogram(
    name: string,
    buckets: number[] = [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
    help?: string,
  ): Histogram {
    if (!this.histograms.has(name)) {
      this.histograms.set(name, new HistogramImpl(buckets));
      if (help) this.descriptions.set(name, help);
    }
    return this.histograms.get(name)!;
  }

  toJSON(): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    // Counters
    for (const [name, counter] of this.counters) {
      result[name] = {
        type: "counter",
        help: this.descriptions.get(name) || "",
        value: counter.value(),
      };
    }

    // Gauges
    for (const [name, gauge] of this.gauges) {
      result[name] = {
        type: "gauge",
        help: this.descriptions.get(name) || "",
        value: gauge.value(),
      };
    }

    // Histograms
    for (const [name, histogram] of this.histograms) {
      const values = histogram.values();
      result[name] = {
        type: "histogram",
        help: this.descriptions.get(name) || "",
        count: values.count,
        sum: values.sum,
        buckets: values.buckets,
      };
    }

    return result;
  }

  reset(): void {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
    this.descriptions.clear();
    logger.info("Metrics registry reset");
  }
}

/**
 * Global metrics registry instance
 */
export const metricsRegistry = new MetricsRegistryImpl();

// --- Metric Exports ---

// HTTP Metrics
export const httpRequestsTotal = metricsRegistry.counter(
  "goblin_http_requests_total",
  "Total HTTP requests",
);
export const httpRequestDuration = metricsRegistry.histogram(
  "goblin_http_request_duration_seconds",
  [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
  "HTTP request duration in seconds",
);

// MCP Metrics
export const mcpToolCallsTotal = metricsRegistry.counter(
  "goblin_mcp_tool_calls_total",
  "Total MCP tool calls",
);
export const mcpToolDuration = metricsRegistry.histogram(
  "goblin_mcp_tool_duration_seconds",
  [0.1, 0.5, 1, 2, 5, 10, 30, 60],
  "MCP tool execution duration in seconds",
);
export const mcpActiveConnections = metricsRegistry.gauge(
  "goblin_mcp_active_connections",
  "Active MCP connections",
);

// Helper to get formatted metrics for debugging
export function getMetricsJSON(): string {
  return JSON.stringify(metricsRegistry.toJSON(), null, 2);
}

// Helper to get compact metrics for health checks
export function getMetricsSummary(): {
  requests: number;
  errors: number;
  avgLatency: number;
  connections: number;
} {
  const totalRequests = httpRequestsTotal.value();
  const errorRequests = httpRequestsTotal.value({ status: "5xx" }) || 0;
  const durationValues = httpRequestDuration.values();
  const avgLatency = durationValues.count > 0 ? durationValues.sum / durationValues.count : 0;
  const connections = mcpActiveConnections.value();

  return {
    requests: totalRequests,
    errors: errorRequests,
    avgLatency: Math.round(avgLatency * 1000), // ms
    connections,
  };
}
