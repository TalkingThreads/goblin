## Why

The current implementation uses `prom-client` for metrics, which:
- Creates unnecessary dependency overhead for local development
- Requires running a separate Prometheus server to be useful
- Doesn't align with our "Developer-First" philosophy
- Adds memory overhead even when metrics aren't being used

The goal is to provide a lightweight, zero-dependency metrics system that works out of the box for developers, with optional Prometheus support for production deployments.

## What Changes

- Replace `prom-client` dependency with custom in-memory metrics registry
- Implement JSON `/metrics` endpoint for developer debugging
- Add real-time metrics panel to TUI (focusing on server status and errors)
- Update `health` meta tool to return status + compressed error summary by default
- Lazy-load Prometheus format export for v2 (separate feature)

## Capabilities

### Modified Capabilities
- `observability`: Now uses in-memory metrics with JSON format (default) + Prometheus (v2 opt-in)

## Impact

- `src/observability/metrics.ts`: Complete refactor to custom registry
- `src/gateway/http.ts`: Update to use new metrics system
- `src/tui/`: Add metrics panel components
- `src/tools/meta/health.ts`: Update health meta tool
- `package.json`: Remove `prom-client` dependency
- `docs/GOBLIN.md`: Update observability documentation
