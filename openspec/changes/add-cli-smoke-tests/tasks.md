# CLI and Smoke Testing Implementation Tasks

This document tracks all implementation tasks for CLI smoke testing infrastructure and test suite.

## 1. Test Infrastructure Setup

- [ ] 1.1 Create tests/smoke directory structure
- [ ] 1.2 Create tests/smoke/shared/ directory for shared utilities
- [ ] 1.3 Create tests/smoke/cli/ directory for CLI tests
- [ ] 1.4 Create tests/smoke/startup/ directory for startup tests
- [ ] 1.5 Create tests/smoke/health/ directory for health endpoint tests
- [ ] 1.6 Create tests/smoke/discovery/ directory for tool discovery tests
- [ ] 1.7 Create tests/smoke/shared/process-manager.ts for subprocess management
- [ ] 1.8 Create tests/smoke/shared/output-capture.ts for output capture utilities
- [ ] 1.9 Create tests/smoke/shared/http-client.ts for HTTP testing utilities
- [ ] 1.10 Create tests/smoke/shared/test-config.ts for test configuration
- [ ] 1.11 Update vitest.config.ts with smoke test settings
- [ ] 1.12 Configure smoke test timeouts (5s per test, 60s per suite)
- [ ] 1.13 Create tests/smoke/README.md with documentation

## 2. CLI Command Smoke Tests

### 2.1 Help Command Tests
- [ ] 2.1.1 Create tests/smoke/cli/help.test.ts
- [ ] 2.1.2 Test global help displayed (goblin --help)
- [ ] 2.1.3 Test command-specific help displayed (goblin start --help)
- [ ] 2.1.4 Test help output is readable and formatted
- [ ] 2.1.5 Test help includes all available commands

### 2.2 Version Command Tests
- [ ] 2.2.1 Create tests/smoke/cli/version.test.ts
- [ ] 2.2.2 Test version displayed correctly (goblin --version)
- [ ] 2.2.3 Test version matches package.json
- [ ] 2.2.4 Test version includes commit hash and build date

### 2.3 Start Command Tests
- [ ] 2.3.1 Create tests/smoke/cli/start.test.ts
- [ ] 2.3.2 Test gateway starts successfully
- [ ] 2.3.3 Test gateway starts with default settings
- [ ] 2.3.4 Test gateway starts with custom port
- [ ] 2.3.5 Test gateway starts with custom log level
- [ ] 2.3.6 Test gateway fails with invalid config

### 2.4 Stop Command Tests
- [ ] 2.4.1 Create tests/smoke/cli/stop.test.ts
- [ ] 2.4.2 Test gateway stops gracefully
- [ ] 2.4.3 Test stop non-running gateway
- [ ] 2.4.4 Test stop with timeout

### 2.5 Status Command Tests
- [ ] 2.5.1 Create tests/smoke/cli/status.test.ts
- [ ] 2.5.2 Test status shows running gateway
- [ ] 2.5.3 Test status shows stopped gateway
- [ ] 2.5.4 Test status includes process ID and uptime

### 2.6 Servers Command Tests
- [ ] 2.6.1 Create tests/smoke/cli/servers.test.ts
- [ ] 2.6.2 Test list connected servers
- [ ] 2.6.3 Test add server command
- [ ] 2.6.4 Test remove server command
- [ ] 2.6.5 Test servers command output formatting

## 3. Startup/Shutdown Smoke Tests

### 3.1 Clean Startup Tests
- [ ] 3.1.1 Create tests/smoke/startup/clean.test.ts
- [ ] 3.1.2 Test gateway starts with default settings
- [ ] 3.1.3 Test gateway starts with custom port
- [ ] 3.1.4 Test gateway starts with custom log level
- [ ] 3.1.5 Test gateway initializes within timeout

### 3.2 Graceful Shutdown Tests
- [ ] 3.2.1 Create tests/smoke/startup/graceful.test.ts
- [ ] 3.2.2 Test shutdown on SIGTERM
- [ ] 3.2.3 Test shutdown on SIGINT
- [ ] 3.2.4 Test shutdown with active connections
- [ ] 3.2.5 Test shutdown waits for in-flight requests

### 3.3 Forced Shutdown Tests
- [ ] 3.3.1 Create tests/smoke/startup/forced.test.ts
- [ ] 3.3.2 Test force shutdown after timeout
- [ ] 3.3.3 Test force shutdown with active requests
- [ ] 3.3.4 Test force shutdown cleanup

### 3.4 Restart Tests
- [ ] 3.4.1 Create tests/smoke/startup/restart.test.ts
- [ ] 3.4.2 Test restart preserves connection state
- [ ] 3.4.3 Test restart with config reload
- [ ] 3.4.4 Test restart without data loss

### 3.5 Startup Error Tests
- [ ] 3.5.1 Create tests/smoke/startup/errors.test.ts
- [ ] 3.5.2 Test port already in use error
- [ ] 3.5.3 Test invalid configuration file error
- [ ] 3.5.4 Test missing required dependencies error
- [ ] 3.5.5 Test error messages are helpful

### 3.6 Resource Cleanup Tests
- [ ] 3.6.1 Create tests/smoke/startup/cleanup.test.ts
- [ ] 3.6.2 Test file descriptors closed on shutdown
- [ ] 3.6.3 Test backend connections closed on shutdown
- [ ] 3.6.4 Test temporary files cleaned on shutdown
- [ ] 3.6.5 Test memory cleanup on shutdown

## 4. Health Endpoint Smoke Tests

### 4.1 Health Check Tests
- [ ] 4.1.1 Create tests/smoke/health/health.test.ts
- [ ] 4.1.2 Test /health endpoint returns 200
- [ ] 4.1.3 Test /health endpoint includes timestamp
- [ ] 4.1.4 Test /health endpoint includes version
- [ ] 4.1.5 Test /health endpoint response time

### 4.2 Readiness Check Tests
- [ ] 4.2.1 Create tests/smoke/health/ready.test.ts
- [ ] 4.2.2 Test /ready endpoint returns 200 when ready
- [ ] 4.2.3 Test /ready endpoint returns 503 when not ready
- [ ] 4.2.4 Test /ready endpoint includes backend status
- [ ] 4.2.5 Test /ready endpoint updates dynamically

### 4.3 Metrics Tests
- [ ] 4.3.1 Create tests/smoke/health/metrics.test.ts
- [ ] 4.3.2 Test /metrics endpoint returns 200
- [ ] 4.3.3 Test /metrics endpoint includes gateway metrics
- [ ] 4.3.4 Test /metrics endpoint format is valid
- [ ] 4.3.5 Test /metrics endpoint includes connection metrics

### 4.4 Kubernetes Probe Tests
- [ ] 4.4.1 Create tests/smoke/health/probes.test.ts
- [ ] 4.4.2 Test health endpoint suitable for liveness probe
- [ ] 4.4.3 Test ready endpoint suitable for readiness probe
- [ ] 4.4.4 Test endpoints handle probe frequency
- [ ] 4.4.5 Test endpoints respond quickly under load

### 4.5 Authentication Tests
- [ ] 4.5.1 Create tests/smoke/health/auth.test.ts
- [ ] 4.5.2 Test health endpoint accessible without auth
- [ ] 4.5.3 Test metrics endpoint requires auth when configured
- [ ] 4.5.4 Test health endpoints bypass rate limiting
- [ ] 4.5.5 Test invalid token returns 401

## 5. Tool Discovery Smoke Tests

### 5.1 Tool Listing Tests
- [ ] 5.1.1 Create tests/smoke/discovery/listing.test.ts
- [ ] 5.1.2 Test tools listed from single backend
- [ ] 5.1.3 Test tools listed from multiple backends
- [ ] 5.1.4 Test tool listing is fast
- [ ] 5.1.5 Test tool listing includes metadata

### 5.2 Tool Filtering Tests
- [ ] 5.2.1 Create tests/smoke/discovery/filtering.test.ts
- [ ] 5.2.2 Test filter tools by prefix
- [ ] 5.2.3 Test filter tools by backend
- [ ] 5.2.4 Test empty filter returns all tools
- [ ] 5.2.5 Test filter combination

### 5.3 Tool Invocation Tests
- [ ] 5.3.1 Create tests/smoke/discovery/invocation.test.ts
- [ ] 5.3.2 Test tool invoked on correct backend
- [ ] 5.3.3 Test tool invocation with arguments
- [ ] 5.3.4 Test tool invocation result format
- [ ] 5.3.5 Test tool invocation error handling

### 5.4 Backend Connection Tests
- [ ] 5.4.1 Create tests/smoke/discovery/connection.test.ts
- [ ] 5.4.2 Test new tools appear after backend connects
- [ ] 5.4.3 Test tools removed after backend disconnects
- [ ] 5.4.4 Test tool list updates are consistent
- [ ] 5.4.5 Test rapid backend connect/disconnect

### 5.5 Tool Schema Tests
- [ ] 5.5.1 Create tests/smoke/discovery/schema.test.ts
- [ ] 5.5.2 Test valid tool schemas accepted
- [ ] 5.5.3 Test invalid tool schema rejected
- [ ] 5.5.4 Test tool schema includes all required fields
- [ ] 5.5.5 Test tool schema validation errors

### 5.6 Tool Availability Tests
- [ ] 5.6.1 Create tests/smoke/discovery/availability.test.ts
- [ ] 5.6.2 Test tool marked available when backend connected
- [ ] 5.6.3 Test tool marked unavailable when backend disconnected
- [ ] 5.6.4 Test tool availability updates in real-time
- [ ] 5.6.5 Test unavailable tool returns appropriate error

## 6. Smoke Test Integration

- [ ] 6.1 Create smoke test runner script
- [ ] 6.2 Add smoke tests to package.json scripts
- [ ] 6.3 Add smoke tests to CI pipeline (pre-commit hook)
- [ ] 6.4 Set up smoke test reporting
- [ ] 6.5 Verify all smoke tests pass
- [ ] 6.6 Measure smoke test execution time (target: < 60 seconds)
- [ ] 6.7 Document smoke test usage and best practices
- [ ] 6.8 Create smoke test configuration file
- [ ] 6.9 Set up parallel test execution where safe
- [ ] 6.10 Add smoke test coverage to README

---

## Task Dependencies

### Priority 1: Infrastructure
- 1.1 → 1.2-1.6 → 1.7-1.10 → 1.11-1.13

### Priority 2: CLI Tests
- 1.13 → 2.1.1-2.6.1 (can be done in parallel)

### Priority 3: Startup Tests
- 1.13 → 3.1.1-3.6.1 (can be done in parallel with 2.x)

### Priority 4: Health Tests
- 1.13 → 4.1.1-4.5.1 (can be done in parallel with 2.x, 3.x)

### Priority 5: Discovery Tests
- 1.13 → 5.1.1-5.6.1 (can be done in parallel with 2.x, 3.x, 4.x)

### Priority 6: Integration
- All previous sections → 6.1-6.10

## Test Execution Order

1. Infrastructure setup (1.1-1.13)
2. CLI tests (2.1.1-2.6.1)
3. Startup tests (3.1.1-3.6.1)
4. Health tests (4.1.1-4.5.1)
5. Discovery tests (5.1.1-5.6.1)
6. Integration (6.1-6.10)

## Success Criteria

- All tests created with proper structure
- All tests pass locally
- Smoke test suite runs in under 60 seconds
- CI pipeline includes smoke tests
- Documentation is complete and accurate
