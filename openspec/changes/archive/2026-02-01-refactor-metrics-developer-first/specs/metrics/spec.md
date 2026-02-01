## metrics Specification

### Requirement: In-Memory Metrics Registry

The system SHALL implement a lightweight in-memory metrics registry without external dependencies.

#### Scenario: Counter operations
- **WHEN** `counter.inc()` is called
- **THEN** increment the counter value by 1
- **AND** return the new value

#### Scenario: Gauge operations
- **WHEN** `gauge.set(value)` is called
- **THEN** set the gauge to the specified value
- **AND** return the new value

#### Scenario: Histogram operations
- **WHEN** `histogram.observe(value)` is called
- **THEN** record the value in the appropriate bucket
- **AND** increment count and sum

#### Scenario: Label support
- **WHEN** metrics are recorded with labels
- **THEN** store separate metric values per label combination
- **AND** allow querying with or without label filters

### Requirement: JSON Metrics Endpoint

The system SHALL provide a JSON metrics endpoint at `/metrics`.

#### Scenario: Request JSON metrics
- **WHEN** client sends GET request to `/metrics`
- **THEN** return metrics in JSON format
- **AND** include all tracked metrics (requests, latency, connections, errors)

#### Scenario: Metrics content
- **WHEN** `/metrics` is called
- **THEN** include:
  - Request counts (total, by method, by status)
  - Latency percentiles (p50, p95, p99)
  - Active connection count
  - Error count and rate

#### Scenario: No external dependencies
- **WHEN** metrics endpoint is called
- **THEN** function without requiring Prometheus or other external services

### Requirement: TUI Metrics Display

The TUI SHALL display real-time metrics with a focus on server status and errors.

#### Scenario: Global metrics header
- **WHEN** TUI is running
- **THEN** display a persistent header with:
  - Server status summary (up/down count)
  - Error count (color-coded: green=0, red>0)
  - Active connections count

#### Scenario: Metrics panel visibility
- **WHEN** user presses hotkey (e.g., 'm')
- **THEN** toggle visibility of the metrics panel
- **AND** show detailed metrics when visible

#### Scenario: Metrics panel content
- **WHEN** metrics panel is visible
- **THEN** display:
  - Request rate over time (sparkline or trend)
  - Latency distribution (p50, p95, p99)
  - Per-server connection counts
  - Error breakdown by server

### Requirement: Health Meta Tool

The `health` meta tool SHALL provide quick status checks with optional detailed metrics.

#### Scenario: Default health response
- **WHEN** agent calls `health` without options
- **THEN** return:
  - `status`: "healthy" | "degraded" | "unhealthy"
  - `summary`: Compressed human-readable summary
  - `errors`: List of current errors (empty if none)

#### Scenario: Full metrics response
- **WHEN** agent calls `health` with `full: true`
- **THEN** return default response PLUS:
  - `metrics`: Complete JSON metrics object
  - `servers`: Per-server status details

#### Scenario: Status determination
- **WHEN** health status is calculated
- **THEN** base on:
  - All servers up: "healthy"
  - Some servers down: "degraded"
  - No servers up or critical errors: "unhealthy"

### Requirement: Metrics Categories

The system SHALL track metrics in the following categories.

#### Scenario: HTTP metrics
- **WHEN** HTTP requests are processed
- **THEN** record:
  - Total request count
  - Count by HTTP method (GET, POST, etc.)
  - Count by status code (200, 404, 500, etc.)
  - Request duration for latency calculation

#### Scenario: Connection metrics
- **WHEN** connections are established or closed
- **THEN** track:
  - Active connection count
  - Connections per server
  - Transport type per connection

#### Scenario: Error metrics
- **WHEN** errors occur during request processing
- **THEN** track:
  - Total error count
  - Errors by type
  - Error rate (errors / total requests)
