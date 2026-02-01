# Health Endpoint Tests Specification

This document specifies the health check, readiness check, metrics, and liveness probe endpoints for the Goblin MCP Gateway.

## Requirement: Health check endpoint

The gateway SHALL provide a `/health` endpoint that returns service health status.

### Scenario: Health endpoint returns 200

- **WHEN** client sends GET request to `/health`
- **THEN** response status SHALL be `200 OK`
- **AND** response body SHALL be JSON
- **AND** health status SHALL be `"healthy"`

### Scenario: Health endpoint includes timestamp

- **WHEN** client sends GET request to `/health`
- **THEN** response SHALL include timestamp
- **AND** timestamp SHALL be valid ISO 8601 format
- **AND** timestamp SHALL be recent

### Scenario: Health endpoint includes version

- **WHEN** client sends GET request to `/health`
- **THEN** response SHALL include version information
- **AND** version SHALL match gateway version

### Scenario: Health endpoint is fast

- **WHEN** client sends GET request to `/health`
- **THEN** response time SHALL be under `100ms`
- **AND** endpoint SHALL not block on other operations

---

## Requirement: Readiness check endpoint

The gateway SHALL provide a `/ready` endpoint that returns service readiness status.

### Scenario: Ready endpoint returns 200 when ready

- **WHEN** gateway is fully started and client sends GET to `/ready`
- **THEN** response status SHALL be `200 OK`
- **AND** response body SHALL indicate `ready: true`
- **AND** backend count SHALL be included

### Scenario: Ready endpoint returns 503 when not ready

- **WHEN** gateway is starting and client sends GET to `/ready`
- **THEN** response status SHALL be `503 Service Unavailable`
- **AND** response body SHALL indicate `ready: false`
- **AND** reason SHALL be included

### Scenario: Ready endpoint includes backend status

- **WHEN** client sends GET request to `/ready`
- **THEN** response SHALL include backend information
- **AND** each backend status SHALL be shown
- **AND** connected backends SHALL be indicated

### Scenario: Ready endpoint updates dynamically

- **WHEN** backend connects/disconnects and client sends GET to `/ready`
- **THEN** response SHALL reflect current backend state
- **AND** backend count SHALL be accurate

---

## Requirement: Metrics endpoint

The gateway SHALL provide a `/metrics` endpoint for Prometheus monitoring.

### Scenario: Metrics endpoint returns 200

- **WHEN** client sends GET request to `/metrics`
- **THEN** response status SHALL be `200 OK`
- **AND** content type SHALL be `text/plain`

### Scenario: Metrics endpoint includes gateway metrics

- **WHEN** client sends GET request to `/metrics`
- **THEN** metrics SHALL include gateway-specific metrics
- **AND** metric names SHALL follow naming convention
- **AND** metrics SHALL include labels

### Scenario: Metrics endpoint format is valid

- **WHEN** client sends GET request to `/metrics`
- **THEN** output SHALL be valid Prometheus format
- **AND** each metric SHALL have type comment
- **AND** each metric SHALL have help text

### Scenario: Metrics endpoint includes connection metrics

- **WHEN** client sends GET request to `/metrics`
- **THEN** metrics SHALL include client connection count
- **AND** metrics SHALL include backend connection count
- **AND** metrics SHALL include request count

---

## Requirement: Liveness probe compatibility

The gateway endpoints SHALL be compatible with Kubernetes liveness probes.

### Scenario: Health endpoint suitable for liveness probe

- **WHEN** used as Kubernetes liveness probe
- **THEN** endpoint SHALL return `200` for healthy state
- **AND** endpoint SHALL return non-`200` for unhealthy state
- **AND** endpoint SHALL not perform heavy operations

### Scenario: Readiness endpoint suitable for readiness probe

- **WHEN** used as Kubernetes readiness probe
- **THEN** endpoint SHALL return `200` when ready
- **AND** endpoint SHALL return `503` when not ready
- **AND** endpoint SHALL respond quickly

### Scenario: Endpoints handle probe frequency

- **WHEN** probes are sent frequently (multiple per second)
- **THEN** endpoints SHALL handle load without degradation
- **AND** endpoints SHALL not block
- **AND** responses SHALL remain fast

---

## Requirement: Health endpoint authentication

The gateway SHALL support optional authentication for health endpoints.

### Scenario: Health endpoint accessible without auth

- **WHEN** authentication is configured
- **THEN** `/health` endpoint SHALL be accessible without token
- **AND** `/health` endpoint SHALL not require authentication

### Scenario: Metrics endpoint requires authentication when configured

- **WHEN** metrics authentication is configured
- **THEN** `/metrics` endpoint SHALL require valid token
- **AND** invalid token SHALL return `401`

### Scenario: Health endpoints bypass rate limiting

- **WHEN** rate limiting is configured
- **THEN** `/health` endpoint SHALL not be rate limited
- **AND** `/ready` endpoint SHALL not be rate limited
