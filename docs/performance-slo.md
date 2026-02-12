# Goblin Performance SLOs (Service Level Objectives)

This document defines the Service Level Objectives (SLOs) for Goblin MCP Gateway performance.

## Overview

These SLOs ensure Goblin provides a responsive and reliable experience for MCP clients while maintaining efficient resource utilization.

## Latency SLOs

### MCP Protocol Operations

| Operation | P95 Target | P99 Target | Critical Threshold | Measurement |
|-----------|-----------|-----------|-------------------|-------------|
| **Initialization** | < 100ms | < 200ms | > 500ms | Time from connection to `initialize` response |
| **Tool Listing** | < 50ms | < 100ms | > 200ms | `tools/list` request duration |
| **Tool Invocation** | < 100ms | < 250ms | > 500ms | `tools/call` request duration |
| **Resource Reading** | < 50ms | < 100ms | > 200ms | `resources/read` request duration |
| **Prompt Retrieval** | < 50ms | < 100ms | > 200ms | `prompts/get` request duration |
| **Ping Round-trip** | < 10ms | < 25ms | > 50ms | `ping` request duration |

### HTTP Gateway Operations

| Operation | P95 Target | P99 Target | Critical Threshold | Measurement |
|-----------|-----------|-----------|-------------------|-------------|
| **Health Check** | < 5ms | < 10ms | > 25ms | `/health` endpoint response time |
| **Status Endpoint** | < 10ms | < 25ms | > 50ms | `/status` endpoint response time |
| **Tool Catalog** | < 50ms | < 100ms | > 200ms | `/tools` endpoint response time |
| **Server List** | < 25ms | < 50ms | > 100ms | `/servers` endpoint response time |

## Throughput SLOs

### Concurrent Operations

| Metric | Target | Critical Threshold | Measurement |
|--------|--------|-------------------|-------------|
| **Max Concurrent Tools** | 100+ | < 50 | Simultaneous tool invocations |
| **Max Active Sessions** | 1000+ | < 500 | Concurrent MCP sessions |
| **Requests/Second** | 1000+ | < 500 | Total gateway throughput |

### Backend Server Management

| Metric | Target | Critical Threshold | Measurement |
|--------|--------|-------------------|-------------|
| **Server Connections** | 50+ | < 25 | Max connected backend servers |
| **Connection Pool** | 100+ | < 50 | Max pooled connections |

## Availability SLOs

### Uptime

| Metric | Target | Critical Threshold | Measurement |
|--------|--------|-------------------|-------------|
| **Gateway Uptime** | 99.9% | < 99% | Monthly availability |
| **Backend Health** | 99% | < 95% | Backend server availability |

### Error Rates

| Metric | Target | Critical Threshold | Measurement |
|--------|--------|-------------------|-------------|
| **Request Errors** | < 0.1% | > 1% | 5xx errors / total requests |
| **Timeout Rate** | < 0.5% | > 2% | Timeout errors / total requests |
| **Initialization Failures** | < 0.1% | > 1% | Failed handshakes / total |

## Resource SLOs

### Memory Usage

| Metric | Target | Critical Threshold | Measurement |
|--------|--------|-------------------|-------------|
| **Memory per Session** | < 10MB | > 50MB | Average heap per active session |
| **Total Memory** | < 1GB | > 2GB | Peak resident set size |
| **Memory Leak** | 0% growth | > 10% | Memory increase over 1 hour |

### CPU Usage

| Metric | Target | Critical Threshold | Measurement |
|--------|--------|-------------------|-------------|
| **Idle CPU** | < 5% | > 20% | CPU usage with no load |
| **Load CPU** | < 70% | > 90% | CPU usage under typical load |
| **Peak CPU** | < 85% | > 95% | CPU usage under peak load |

## Scalability SLOs

### Horizontal Scaling

| Metric | Target | Critical Threshold | Measurement |
|--------|--------|-------------------|-------------|
| **Tool Scale** | 1000+ | < 500 | Total registered tools |
| **Resource Scale** | 500+ | < 250 | Total registered resources |
| **Prompt Scale** | 100+ | < 50 | Total registered prompts |

### Cache Performance

| Metric | Target | Critical Threshold | Measurement |
|--------|--------|-------------------|-------------|
| **Tool List Cache Hit** | > 95% | < 80% | Cache hit rate for tool lists |
| **Cache Invalidation** | < 1ms | > 5ms | Time to invalidate cache |

## Monitoring & Alerting

### Key Metrics to Monitor

1. **mcpInitializationDuration** - Histogram of initialization time
2. **mcpRequestDuration** - Histogram of request duration by method
3. **mcpActiveSessions** - Gauge of active sessions
4. **mcpTimeoutsTotal** - Counter of timeout errors
5. **mcpCancellationsTotal** - Counter of cancellations

### Alerting Thresholds

| Metric | Warning | Critical | Emergency |
|--------|---------|----------|-----------|
| P95 Latency | > 150ms | > 300ms | > 500ms |
| Error Rate | > 0.5% | > 1% | > 5% |
| Memory Usage | > 500MB | > 1GB | > 1.5GB |
| Active Sessions | > 800 | > 900 | > 1000 |

## Testing & Validation

### Performance Test Suite

Run the full performance test suite:

```bash
# All performance tests
bun test tests/performance

# Protocol-specific benchmarks
bun test tests/performance/protocol-overhead

# Load tests
bun test tests/performance/load

# Memory tests
bun test tests/performance/memory

# Latency tests
bun test tests/performance/latency
```

### Continuous Monitoring

Performance tests run automatically:
- **On PR**: Quick smoke tests
- **Nightly**: Full performance suite
- **Weekly**: Baseline comparison

### SLO Compliance Dashboard

View real-time SLO compliance:

```bash
# Start gateway with metrics
bun run start

# View metrics
curl http://localhost:3000/metrics

# Check health
curl http://localhost:3000/health
```

## SLO Review Process

### Quarterly Review

1. Analyze actual performance vs SLOs
2. Review error budgets
3. Adjust targets based on usage patterns
4. Document learnings and improvements

### Error Budget Policy

- Monthly error budget: 0.1% (43 minutes downtime)
- If budget exceeded: Freeze feature work, focus on reliability
- If budget healthy: Can take more risks with new features

## Escalation

### Performance Degradation

1. **Warning** (> 150ms P95): Monitor closely, investigate trends
2. **Critical** (> 300ms P95): Page on-call engineer
3. **Emergency** (> 500ms P95): All-hands response

### Resource Exhaustion

1. **Memory > 80%**: Scale horizontally or restart
2. **Connections > 90%**: Reject new connections gracefully
3. **CPU > 85%**: Throttle non-critical operations

## References

- [MCP Protocol Compliance](./mcp-compliance.md)
- [Performance Test Suite](../tests/performance/README.md)
- [Monitoring Setup](./monitoring.md)
- [Runbook: Performance Issues](./runbooks/performance.md)
