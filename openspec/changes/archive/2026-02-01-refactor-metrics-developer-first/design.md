## Context

Goblin currently uses `prom-client` for metrics, which requires a separate Prometheus server and creates unnecessary overhead for developers. We need a developer-first metrics system that works out of the box.

## Goals / Non-Goals

**Goals:**
- Remove `prom-client` dependency
- Provide JSON metrics endpoint for local development
- Add real-time metrics display in TUI
- Improve `health` meta tool for better debugging
- Keep Prometheus format as v2 opt-in feature

**Non-Goals:**
- Full Prometheus compatibility in MVP (deferred to v2)
- Advanced metrics (histogram queries, rate calculations) - defer to v2
- Multi-process metrics aggregation - defer to v2

## Decisions

### Decision 1: Custom In-Memory Metrics Registry

**Choice:** Implement a lightweight custom metrics registry instead of using `prom-client`.

**Rationale:**
- Zero external dependencies for metrics
- Simple counter, gauge, and histogram support
- JSON serialization built-in
- Minimal memory footprint

**Implementation:**
```typescript
interface Counter {
  inc(labels?: Record<string, string>): void;
  value(labels?: Record<string, string>): number;
}

interface Gauge {
  set(value: number, labels?: Record<string, string>): void;
  inc(labels?: Record<string, string>): void;
  dec(labels?: Record<string, string>): void;
  value(labels?: Record<string, string>): number;
}

interface Histogram {
  observe(value: number, labels?: Record<string, string>): void;
  values(labels?: Record<string, string>): { count: number; sum: number; buckets: Record<number, number> };
}
```

### Decision 2: JSON Metrics Format

**Choice:** Default metrics format is JSON, optimized for debugging and TUI consumption.

**Rationale:**
- Human-readable for developers
- Easy to parse in any language
- Supports hierarchical data structure
- No external tools needed

**Format:**
```json
{
  "requests": {
    "total": 1234,
    "byMethod": { "GET": 1000, "POST": 234 },
    "byStatus": { "200": 1200, "404": 34 }
  },
  "latency": {
    "p50": 0.012,
    "p95": 0.045,
    "p99": 0.128,
    "unit": "seconds"
  },
  "connections": { "active": 8 },
  "errors": { "total": 2, "rate": 0.0016 }
}
```

### Decision 3: TUI Metrics Display Strategy

**Choice:** Integrated summary header + dedicated metrics panel (based on TUI/UX consultation).

**Rationale:**
- Errors and status visible at all times (global header)
- Detailed metrics available on demand (dedicated panel)
- Doesn't crowd the screen with numbers
- Matches operator mental models

**Implementation:**
- Global header: Server status count, error count (color-coded)
- Metrics panel: Sparklines, detailed breakdowns, per-server stats
- Navigation: Toggle metrics panel with hotkey

### Decision 4: Health Meta Tool Response Format

**Choice:** Status + compressed summary by default, optional full metrics.

**Rationale:**
- Quick status checks for agents don't need full metrics
- Debugging scenarios can request full details
- Reduces token usage in agent conversations

**Format:**
```typescript
// Default response
{
  "status": "healthy" | "degraded" | "unhealthy",
  "summary": "2 servers up, 0 errors, latency p95: 45ms",
  "errors": [] // Empty if healthy
}

// With full: true
{
  "status": "healthy",
  "full": true,
  "metrics": { /* full JSON metrics */ }
}
```

## Metrics Tracked

### HTTP Gateway Metrics
- Request count (total, by method, by status)
- Latency histogram (p50, p95, p99)
- Active connections
- Error count and rate

### Server Metrics
- Connection count per server
- Tool call count per server
- Tool error count per server
- Latency per server

### System Metrics
- Memory usage (via Bun.memory())
- Uptime
- Garbage collection hints
