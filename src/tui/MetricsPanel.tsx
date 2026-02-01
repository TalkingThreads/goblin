import { useState, useEffect } from "react";
import { Box, Text } from "ink";
import { mcpActiveConnections, mcpToolCallsTotal, httpRequestDuration } from "../observability/metrics.js";

/**
 * Format number with units
 */
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
}

/**
 * Calculate percentile from histogram values
 */
function calculatePercentile(values: { count: number; sum: number; buckets: Record<number, number> }, percentile: number): number {
  if (values.count === 0) return 0;
  const targetCount = values.count * percentile;
  let cumulative = 0;
  const sortedBuckets = Object.entries(values.buckets)
    .map(([bucket, count]) => [Number(bucket), count] as [number, number])
    .sort((a, b) => a[0] - b[0]);

  for (const [bucket, count] of sortedBuckets) {
    cumulative += count;
    if (cumulative >= targetCount) {
      return bucket * 1000; // Convert to ms
    }
  }
  const lastBucket = sortedBuckets[sortedBuckets.length - 1];
  return (lastBucket?.[0] || 0) * 1000;
}

/**
 * MetricsPanel displays real-time system metrics in the TUI
 */
const MetricsPanel = () => {
  const [metrics, setMetrics] = useState({
    totalRequests: 0,
    totalErrors: 0,
    avgLatency: 0,
    p50Latency: 0,
    p95Latency: 0,
    p99Latency: 0,
    connections: 0,
    requestsPerSecond: 0,
  });

  const [prevMetrics, setPrevMetrics] = useState({
    totalRequests: 0,
    timestamp: Date.now(),
  });

  useEffect(() => {
    const interval = setInterval(() => {
      // Get current metrics
      const httpValues = httpRequestDuration.values();
      const totalRequests = httpValues.count;
      const avgLatency = totalRequests > 0 ? (httpValues.sum / totalRequests) * 1000 : 0;
      const p50 = calculatePercentile(httpValues, 0.5);
      const p95 = calculatePercentile(httpValues, 0.95);
      const p99 = calculatePercentile(httpValues, 0.99);

      // Calculate requests per second
      const now = Date.now();
      const timeDiff = (now - prevMetrics.timestamp) / 1000;
      const requestsDiff = totalRequests - prevMetrics.totalRequests;
      const rps = timeDiff > 0 ? requestsDiff / timeDiff : 0;

      // Get connection count
      const connectionGauges = mcpActiveConnections.getAll();
      const connections = connectionGauges.reduce((sum, g) => sum + g.value, 0);

      // Get error count (approximate from labels)
      const errorCalls = mcpToolCallsTotal.value({ status: "error" }) || 0;

      setMetrics({
        totalRequests,
        totalErrors: errorCalls,
        avgLatency,
        p50Latency: p50,
        p95Latency: p95,
        p99Latency: p99,
        connections,
        requestsPerSecond: rps,
      });

      setPrevMetrics({
        totalRequests,
        timestamp: now,
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [prevMetrics]);

  return (
    <Box flexDirection="column" borderStyle="single" paddingX={1} flexGrow={2} marginLeft={1}>
      <Box marginBottom={1}>
        <Text bold underline color="magenta">METRICS</Text>
      </Box>

      {/* Request Rate */}
      <Box marginBottom={0}>
        <Box width={20}>
          <Text bold>Requests/sec:</Text>
        </Box>
        <Text color={metrics.requestsPerSecond > 10 ? "green" : metrics.requestsPerSecond > 0 ? "yellow" : "gray"}>
          {metrics.requestsPerSecond.toFixed(1)}
        </Text>
      </Box>

      {/* Total Requests */}
      <Box marginBottom={0}>
        <Box width={20}>
          <Text bold>Total Requests:</Text>
        </Box>
        <Text>{formatNumber(metrics.totalRequests)}</Text>
      </Box>

      {/* Error Count */}
      <Box marginBottom={0}>
        <Box width={20}>
          <Text bold>Errors:</Text>
        </Box>
        <Text color={metrics.totalErrors > 0 ? "red" : "green"}>
          {metrics.totalErrors}
        </Text>
        <Text color="gray"> ({metrics.totalRequests > 0 ? ((metrics.totalErrors / metrics.totalRequests) * 100).toFixed(2) : 0}%)</Text>
      </Box>

      {/* Latency Percentiles */}
      <Box marginBottom={0} marginTop={1}>
        <Text bold color="cyan">Latency (ms):</Text>
      </Box>
      <Box marginLeft={2}>
        <Box width={15}>
          <Text dimColor>p50:</Text>
        </Box>
        <Text color={metrics.p50Latency < 100 ? "green" : metrics.p50Latency < 500 ? "yellow" : "red"}>
          {metrics.p50Latency.toFixed(0)}ms
        </Text>
      </Box>
      <Box marginLeft={2}>
        <Box width={15}>
          <Text dimColor>p95:</Text>
        </Box>
        <Text color={metrics.p95Latency < 200 ? "green" : metrics.p95Latency < 1000 ? "yellow" : "red"}>
          {metrics.p95Latency.toFixed(0)}ms
        </Text>
      </Box>
      <Box marginLeft={2}>
        <Box width={15}>
          <Text dimColor>p99:</Text>
        </Box>
        <Text color={metrics.p99Latency < 500 ? "green" : metrics.p99Latency < 2000 ? "yellow" : "red"}>
          {metrics.p99Latency.toFixed(0)}ms
        </Text>
      </Box>

      {/* Connections */}
      <Box marginBottom={0} marginTop={1}>
        <Box width={20}>
          <Text bold>Active Connections:</Text>
        </Box>
        <Text color="blue">{metrics.connections}</Text>
      </Box>

      {/* Connection Breakdown by Server */}
      <Box marginBottom={0} marginTop={1}>
        <Text bold color="cyan">By Server:</Text>
      </Box>
      {mcpActiveConnections.getAll().map((gauge) => (
        <Box key={gauge.labels["server"]} marginLeft={2}>
          <Box width={20}>
            <Text dimColor>{gauge.labels["server"]}:</Text>
          </Box>
          <Text color={gauge.value > 0 ? "green" : "gray"}>{gauge.value}</Text>
        </Box>
      ))}
      {mcpActiveConnections.getAll().length === 0 && (
        <Box marginLeft={2}>
          <Text color="gray">No active connections</Text>
        </Box>
      )}
    </Box>
  );
};

export default MetricsPanel;
