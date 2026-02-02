# Comprehensive Unit Testing - Implementation Tasks

Based on the specs and design, create all implementation tasks for comprehensive unit testing.

## 1. Test Infrastructure Setup

- [ ] 1.1 Create test directory structure (meta-tools, registry, router, config, observability, transport, shared)
- [ ] 1.2 Create shared/mocks.ts with fs, http, timer mocks
- [ ] 1.3 Create shared/fixtures.ts with test data fixtures
- [ ] 1.4 Create shared/assertions.ts with custom test assertions
- [ ] 1.5 Update vitest.config.ts with coverage thresholds and reporters
- [ ] 1.6 Add test fixtures directory with sample configs, tools, resources
- [ ] 1.7 Create test utilities for async operation testing
- [ ] 1.8 Configure test environment (test timeouts, global setup/teardown)

## 2. Meta-Tools Unit Tests

### 2.1 Invocation Tests
- [ ] 2.1.1 Create tests/unit/meta-tools/invocation.test.ts
- [ ] 2.1.2 Test successful tool invocation with valid parameters
- [ ] 2.1.3 Test invocation with missing required parameters
- [ ] 2.1.4 Test invocation with invalid parameter types
- [ ] 2.1.5 Test invocation return value handling
- [ ] 2.1.6 Test invocation logging

### 2.2 Validation Tests
- [ ] 2.2.1 Create tests/unit/meta-tools/validation.test.ts
- [ ] 2.2.2 Test schema validation passes for valid input
- [ ] 2.2.3 Test schema validation fails for invalid input
- [ ] 2.2.4 Test custom validators execute correctly
- [ ] 2.2.5 Test validation error messages include field details
- [ ] 2.2.6 Test nested object validation

### 2.3 Catalog Tests
- [ ] 2.3.1 Create tests/unit/meta-tools/catalog.test.ts
- [ ] 2.3.2 Test list all tools in catalog
- [ ] 2.3.3 Test filter tools by name
- [ ] 2.3.4 Test search tools by description
- [ ] 2.3.5 Test catalog pagination
- [ ] 2.3.6 Test catalog sorting

### 2.4 CRUD Operation Tests
- [ ] 2.4.1 Create tests/unit/meta-tools/crud.test.ts
- [ ] 2.4.2 Test register new tool
- [ ] 2.4.3 Test update existing tool
- [ ] 2.4.4 Test remove tool from catalog
- [ ] 2.4.5 Test duplicate registration rejection
- [ ] 2.4.6 Test tool enable/disable

### 2.5 Error Handling Tests
- [ ] 2.5.1 Create tests/unit/meta-tools/error-handling.test.ts
- [ ] 2.5.2 Test tool invocation timeout
- [ ] 2.5.3 Test tool cancellation
- [ ] 2.5.4 Test unexpected tool failure handling
- [ ] 2.5.5 Test resource exhaustion handling

## 3. Registry Unit Tests

### 3.1 Registration Tests
- [ ] 3.1.1 Create tests/unit/registry/registration.test.ts
- [ ] 3.1.2 Test register tool with unique name
- [ ] 3.1.3 Test register tool with duplicate name (error case)
- [ ] 3.1.4 Test register tools from multiple namespaces
- [ ] 3.1.5 Test tool metadata preservation
- [ ] 3.1.6 Test tool versioning

### 3.2 Aliasing Tests
- [ ] 3.2.1 Create tests/unit/registry/aliasing.test.ts
- [ ] 3.2.2 Test create alias for tool
- [ ] 3.2.3 Test resolve alias chain
- [ ] 3.2.4 Test alias to non-existent tool (error case)
- [ ] 3.2.5 Test alias removal
- [ ] 3.2.6 Test alias conflict detection

### 3.3 Caching Tests
- [ ] 3.3.1 Create tests/unit/registry/caching.test.ts
- [ ] 3.3.2 Test cache hit returns cached value
- [ ] 3.3.3 Test cache miss queries source
- [ ] 3.3.4 Test cache expiration after TTL
- [ ] 3.3.5 Test manual cache invalidation
- [ ] 3.3.6 Test cache size limits

### 3.4 Namespace Tests
- [ ] 3.4.1 Create tests/unit/registry/namespace.test.ts
- [ ] 3.4.2 Test list tools in specific namespace
- [ ] 3.4.3 Test cross-namespace lookup
- [ ] 3.4.4 Test empty namespace defaults to global
- [ ] 3.4.5 Test namespace isolation
- [ ] 3.4.6 Test namespace creation/deletion

### 3.5 Error Handling Tests
- [ ] 3.5.1 Create tests/unit/registry/error-handling.test.ts
- [ ] 3.5.2 Test lookup non-existent tool (error case)
- [ ] 3.5.3 Test unregister tool with active subscriptions (error case)
- [ ] 3.5.4 Test registry shutdown cleanup
- [ ] 3.5.5 Test concurrent modification handling
- [ ] 3.5.6 Test invalid tool definition rejection

## 4. Router Unit Tests

### 4.1 Routing Tests
- [ ] 4.1.1 Create tests/unit/router/routing.test.ts
- [ ] 4.1.2 Test route request to correct server
- [ ] 4.1.3 Test route request with tool name
- [ ] 4.1.4 Test route request to default server
- [ ] 4.1.5 Test request payload forwarding
- [ ] 4.1.6 Test response forwarding

### 4.2 Namespacing Tests
- [ ] 4.2.1 Create tests/unit/router/namespacing.test.ts
- [ ] 4.2.2 Test namespace-prefixed request routing
- [ ] 4.2.3 Test missing namespace defaults to global
- [ ] 4.2.4 Test invalid namespace handling (error case)
- [ ] 4.2.5 Test namespace extraction and passing
- [ ] 4.2.6 Test namespace-specific routing rules

### 4.3 Error Handling Tests
- [ ] 4.3.1 Create tests/unit/router/error-handling.test.ts
- [ ] 4.3.2 Test server not found (error case)
- [ ] 4.3.3 Test server temporarily unavailable (error case)
- [ ] 4.3.4 Test server returns error response
- [ ] 4.3.5 Test malformed request rejection
- [ ] 4.3.6 Test authentication failure handling

### 4.4 Timeout Tests
- [ ] 4.4.1 Create tests/unit/router/timeout.test.ts
- [ ] 4.4.2 Test request completes before timeout
- [ ] 4.4.3 Test request exceeds timeout (error case)
- [ ] 4.4.4 Test timeout configuration per server
- [ ] 4.4.5 Test timeout with partial response
- [ ] 4.4.6 Test timeout cancellation

### 4.5 Edge Case Tests
- [ ] 4.5.1 Create tests/unit/router/edge-cases.test.ts
- [ ] 4.5.2 Test circular routing detection (error case)
- [ ] 4.5.3 Test request with special characters
- [ ] 4.5.4 Test empty request handling (error case)
- [ ] 4.5.5 Test concurrent requests to same server
- [ ] 4.5.6 Test server overload handling (error case)

## 5. Config Unit Tests

### 5.1 Atomic Updates Tests
- [ ] 5.1.1 Create tests/unit/config/atomic-updates.test.ts
- [ ] 5.1.2 Test successful atomic update
- [ ] 5.1.3 Test partial update failure with rollback
- [ ] 5.1.4 Test concurrent atomic updates
- [ ] 5.1.5 Test update transaction isolation
- [ ] 5.1.6 Test update notification

### 5.2 Rollback Tests
- [ ] 5.2.1 Create tests/unit/config/rollback.test.ts
- [ ] 5.2.2 Test manual rollback to previous version
- [ ] 5.2.3 Test automatic rollback on validation failure
- [ ] 5.2.4 Test multi-step rollback
- [ ] 5.2.5 Test rollback history limits
- [ ] 5.2.6 Test rollback with active connections

### 5.3 Hot Reload Tests
- [ ] 5.3.1 Create tests/unit/config/hot-reload.test.ts
- [ ] 5.3.2 Test hot reload triggers on file change
- [ ] 5.3.3 Test hot reload with invalid configuration
- [ ] 5.3.4 Test hot reload during active operations
- [ ] 5.3.5 Test hot reload debouncing
- [ ] 5.3.6 Test hot reload notification

### 5.4 Schema Validation Tests
- [ ] 5.4.1 Create tests/unit/config/schema-validation.test.ts
- [ ] 5.4.2 Test valid configuration passes validation
- [ ] 5.4.3 Test invalid configuration fails validation
- [ ] 5.4.4 Test unknown fields are rejected
- [ ] 5.4.5 Test default values are applied
- [ ] 5.4.6 Test custom schema rules

### 5.5 Error Recovery Tests
- [ ] 5.5.1 Create tests/unit/config/error-recovery.test.ts
- [ ] 5.5.2 Test missing configuration file (error case)
- [ ] 5.5.3 Test corrupted configuration file (error case)
- [ ] 5.5.4 Test permission denied on config file (error case)
- [ ] 5.5.5 Test configuration migration
- [ ] 5.5.6 Test config corruption recovery

## 6. Observability Unit Tests

### 6.1 Logger Output Tests
- [ ] 6.1.1 Create tests/unit/observability/logger.test.ts
- [ ] 6.1.2 Test structured log output contains required fields
- [ ] 6.1.3 Test log level filtering
- [ ] 6.1.4 Test child logger inherits parent settings
- [ ] 6.1.5 Test log message with error and stack trace
- [ ] 6.1.6 Test log message formatting

### 6.2 Logger Redaction Tests
- [ ] 6.2.1 Create tests/unit/observability/redaction.test.ts
- [ ] 6.2.2 Test sensitive fields are redacted
- [ ] 6.2.3 Test custom redaction rules
- [ ] 6.2.4 Test nested sensitive data redaction
- [ ] 6.2.5 Test redaction performance
- [ ] 6.2.6 Test redaction bypass for authorized contexts

### 6.3 Metrics Collection Tests
- [ ] 6.3.1 Create tests/unit/observability/metrics.test.ts
- [ ] 6.3.2 Test counter increments correctly
- [ ] 6.3.3 Test histogram records values
- [ ] 6.3.4 Test gauge sets value
- [ ] 6.3.5 Test metrics are labeled correctly
- [ ] 6.3.6 Test metrics are thread-safe

### 6.4 Metrics Output Format Tests
- [ ] 6.4.1 Create tests/unit/observability/metrics-format.test.ts
- [ ] 6.4.2 Test counter format is correct (Prometheus)
- [ ] 6.4.3 Test histogram format includes buckets
- [ ] 6.4.4 Test metric family output
- [ ] 6.4.5 Test metrics are sorted correctly
- [ ] 6.4.6 Test metrics escaping for special characters

### 6.5 Error Handling Tests
- [ ] 6.5.1 Create tests/unit/observability/error-handling.test.ts
- [ ] 6.5.2 Test logger handles cyclic references
- [ ] 6.5.3 Test metrics handle high cardinality
- [ ] 6.5.4 Test logger fallback on failure
- [ ] 6.5.5 Test metrics registration conflicts (error case)
- [ ] 6.5.6 Test logging during shutdown

## 7. Transport Unit Tests

### 7.1 STDIO Transport Tests
- [ ] 7.1.1 Create tests/unit/transport/stdio.test.ts
- [ ] 7.1.2 Test STDIO transport initializes correctly
- [ ] 7.1.3 Test STDIO transport sends message
- [ ] 7.1.4 Test STDIO transport receives message
- [ ] 7.1.5 Test STDIO transport handles close
- [ ] 7.1.6 Test STDIO transport encoding

### 7.2 HTTP Transport Tests
- [ ] 7.2.1 Create tests/unit/transport/http.test.ts
- [ ] 7.2.2 Test HTTP transport initializes correctly
- [ ] 7.2.3 Test HTTP transport accepts connection
- [ ] 7.2.4 Test HTTP transport sends message
- [ ] 7.2.5 Test HTTP transport SSE streaming
- [ ] 7.2.6 Test HTTP transport request/response correlation

### 7.3 Connection Pooling Tests
- [ ] 7.3.1 Create tests/unit/transport/pooling.test.ts
- [ ] 7.3.2 Test pool creates connections as needed
- [ ] 7.3.3 Test pool reuses connections
- [ ] 7.3.4 Test pool respects maximum size
- [ ] 7.3.5 Test pool cleans up idle connections
- [ ] 7.3.6 Test pool connection lifecycle

### 7.4 Health Check Tests
- [ ] 7.4.1 Create tests/unit/transport/health-check.test.ts
- [ ] 7.4.2 Test health check returns healthy status
- [ ] 7.4.3 Test health check detects failure
- [ ] 7.4.4 Test health check includes dependencies
- [ ] 7.4.5 Test health check performance
- [ ] 7.4.6 Test health check caching

### 7.5 Reconnection Tests
- [ ] 7.5.1 Create tests/unit/transport/reconnection.test.ts
- [ ] 7.5.2 Test automatic reconnection on disconnect
- [ ] 7.5.3 Test reconnection success
- [ ] 7.5.4 Test reconnection after max retries (error case)
- [ ] 7.5.5 Test reconnection during active requests
- [ ] 7.5.6 Test reconnection with exponential backoff

### 7.6 Error Handling Tests
- [ ] 7.6.1 Create tests/unit/transport/error-handling.test.ts
- [ ] 7.6.2 Test invalid message format (error case)
- [ ] 7.6.3 Test unknown method handling (error case)
- [ ] 7.6.4 Test transport buffer overflow (error case)
- [ ] 7.6.5 Test TLS/SSL certificate validation (error case)
- [ ] 7.6.6 Test network partition handling

## 8. Test Integration

- [ ] 8.1 Run full test suite to verify all tests pass
- [ ] 8.2 Verify coverage thresholds are met
- [ ] 8.3 Add tests to CI pipeline
- [ ] 8.4 Create test documentation/README
- [ ] 8.5 Verify tests run in parallel where safe
- [ ] 8.6 Add test performance benchmarks
