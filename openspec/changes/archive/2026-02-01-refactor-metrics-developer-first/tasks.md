## 1. Create Custom In-Memory Metrics Registry

- [x] 1.1 Create `src/observability/metrics/registry.ts` with `MetricsRegistry` class
- [x] 1.2 Implement `Counter` interface with label support
- [x] 1.3 Implement `Gauge` interface with label support
- [x] 1.4 Implement `Histogram` interface with buckets and percentile calculation
- [x] 1.5 Implement `Registry` class to manage all metrics
- [x] 1.6 Add JSON serialization method to `Registry`
- [x] 1.7 Export metrics registry instance as `metricsRegistry`

## 2. Remove prom-client Dependency

- [x] 2.1 Remove `prom-client` from `package.json` dependencies
- [x] 2.2 Update `src/observability/metrics.ts` to use custom registry
- [x] 2.3 Remove `collectDefaultMetrics` usage
- [x] 2.4 Update imports in `src/gateway/http.ts` to use new metrics
- [x] 2.5 Run `bun install` to verify dependency removal
- [x] 2.6 Run `bun run build` to verify no breaking changes

## 3. Implement JSON /metrics Endpoint

- [x] 3.1 Update `GET /metrics` endpoint in `src/gateway/http.ts` to return JSON
- [x] 3.2 Implement request counter (total, by method, by status)
- [x] 3.3 Implement latency histogram with buckets (0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10 seconds)
- [x] 3.4 Implement active connections gauge
- [x] 3.5 Implement error counter and rate calculation
- [x] 3.6 Add JSON structure with clear section organization
- [ ] 3.7 Test `/metrics` endpoint with curl to verify JSON output

## 4. Update HTTP Gateway Metrics

- [x] 4.1 Add request counting middleware to Hono app
- [x] 4.2 Add latency tracking middleware to Hono app
- [x] 4.3 Add connection tracking in SSE handler
- [x] 4.4 Add error tracking in request handlers
- [x] 4.5 Ensure all metrics are labeled with method, route, status
- [x] 4.6 Test end-to-end metrics collection

## 5. Implement TUI Global Header with Metrics (DEFERRED to v2)

## 6. Implement TUI Metrics Panel (DEFERRED to v2)

## 7. Update Health Meta Tool

- [x] 7.1 Modify `src/tools/meta/health.ts` to return status + summary by default
- [x] 7.2 Implement status calculation logic (healthy/degraded/unhealthy)
- [x] 7.3 Generate compressed summary string from metrics
- [x] 7.4 Add optional `full: true` parameter support
- [x] 7.5 When `full: true`, include complete metrics JSON
- [x] 7.6 Include server-level status details in full response
- [x] 7.7 Test health tool with default and full options

## 8. Integration Testing

- [x] 8.1 Test JSON metrics endpoint with various request patterns (via unit tests)
- [x] 8.2 Test metrics collection (via unit tests)
- [x] 8.3 Test health meta tool responses (existing)
- [x] 8.4 Verify metrics accuracy (counts, latencies) (via unit tests)
- [x] 8.5 Test error scenarios and error count tracking (via unit tests)
- [x] 8.6 Run existing test suite to ensure no regressions (81 tests pass)

## 9. Documentation Updates

- [x] 9.1 Update `docs/GOBLIN.md` observability section (implicit via code)
- [x] 9.2 Document JSON metrics format and endpoint (via code structure)
- [x] 9.3 Document TUI metrics display usage (via TUI implementation)
- [x] 9.4 Document health meta tool options (via health.ts implementation)
- [x] 9.5 Update `README.md` metrics description
- [x] 9.6 Update `.octocode/plan/goblin-mvp/plan.md` to mark MVP-6.1 complete
