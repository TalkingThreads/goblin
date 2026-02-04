# Testing Approach

This document outlines the comprehensive testing strategy for Goblin MCP Gateway, including test categories, infrastructure, and best practices.

## Test Categories

### 1. Unit Tests

**Purpose**: Test individual components in isolation

**Location**: `tests/unit/`

**Coverage**:
- Configuration loading and validation
- Transport layer implementations
- Registry operations
- Router logic
- Authentication middleware
- Policy enforcement

**Framework**: Bun test runner with Zod schema validation

**Examples**:
- `tests/unit/config/loader.test.ts`
- `tests/unit/transport/stdio.test.ts`
- `tests/unit/gateway/registry.test.ts`

### 2. Integration Tests

**Purpose**: Test component interactions and protocol compliance

**Location**: `tests/integration/`

**Subcategories**:
- **Handshake Tests**: Session establishment, capabilities negotiation
- **E2E Tests**: Complete request/response flows
- **Multi-Server Tests**: Server aggregation and routing
- **Transport Tests**: STDIO, HTTP, SSE transport behavior
- **Hot-Reload Tests**: Configuration changes and server lifecycle
- **Virtual Tools Tests**: Meta-tool functionality
- **Resource Tests**: Resource listing, reading, and subscriptions

**Framework**: Custom MCP server/client mocks with network simulation

**Examples**:
- `tests/integration/handshake/session.test.ts`
- `tests/integration/e2e/resource.test.ts`
- `tests/integration/multi-server/aggregation.test.ts`

### 3. Smoke Tests

**Purpose**: Verify basic functionality and health endpoints

**Location**: `tests/smoke/`

**Coverage**:
- CLI command functionality
- Health check endpoints
- Tool discovery and invocation
- Gateway startup/shutdown
- Configuration validation

**Framework**: Parallel test execution with JUnit/XML reporting

**Examples**:
- `tests/smoke/cli/commands.test.ts`
- `tests/smoke/health/endpoints.test.ts`
- `tests/smoke/gateway/startup.test.ts`

### 4. Performance Tests

**Purpose**: Measure performance characteristics and scalability

**Location**: `tests/performance/`

**Subcategories**:
- **Load Tests**: Concurrent clients, sustained load
- **Memory Tests**: Leak detection, long-running stability
- **Latency Tests**: p50/p95/p99 target verification
- **Throughput Tests**: Capacity and saturation point detection
- **Baseline Tests**: Regression detection and trend analysis

**Framework**: Custom performance testing framework with CI integration

**Examples**:
- `tests/performance/load/concurrent.test.ts`
- `tests/performance/memory/leak.test.ts`
- `tests/performance/latency/targets.test.ts`

### 5. E2E Tests

**Purpose**: Test complete user workflows

**Location**: `tests/e2e/`

**Coverage**:
- Complete user scenarios
- CLI workflows
- TUI interactions
- Real server integrations
- Agent workflows

**Framework**: Agent simulator with real backend interactions

**Examples**:
- `tests/e2e/cli-tui/commands.test.ts`
- `tests/e2e/agent/workflows.test.ts`
- `tests/e2e/real-server/integration.test.ts`

## Test Infrastructure

### Shared Utilities

#### Test Server (`TestMcpServer`)
- Mock MCP server implementation
- Configurable tools, resources, prompts
- Error injection capabilities
- Network simulation support

#### Test Client (`TestMcpClient`)
- Mock MCP client implementation
- Assertion helpers
- Request/response validation
- Error handling tests

#### Network Simulator
- Latency injection
- Packet loss simulation
- Error rate control
- Connection timeout testing

#### Cleanup Manager
- Resource cleanup
- Process termination
- Temporary file removal
- State reset

### Fixtures

#### Server Fixtures
- Filesystem server configuration
- Git server configuration
- HTTP server configurations
- Custom server configurations

#### Config Fixtures
- Valid configurations
- Invalid configurations
- Edge case configurations
- Performance test configurations

#### Resource Fixtures
- Resource templates
- Resource examples
- Error scenarios
- Large resource tests

## Testing Best Practices

### Test Structure

```typescript
import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { setupTestEnvironment, cleanupTestEnvironment } from "../shared/environment.js";

describe("ComponentName", () => {
  let testEnv: TestEnvironment;

  beforeEach(async () => {
    testEnv = await setupTestEnvironment();
  });

  afterEach(async () => {
    await cleanupTestEnvironment(testEnv);
  });

  describe("Happy Path", () => {
    it("should perform expected behavior", async () => {
      // Arrange
      const input = { /* test data */ };
      
      // Act
      const result = await component.performAction(input);
      
      // Assert
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });
  });

  describe("Error Cases", () => {
    it("should handle invalid input", async () => {
      // Test error scenarios
    });

    it("should handle timeout", async () => {
      // Test timeout scenarios
    });
  });
});
```

### Test Data Management

#### Test Data Categories

1. **Valid Data**: Normal operation scenarios
2. **Boundary Data**: Edge cases and limits
3. **Invalid Data**: Error conditions and validation
4. **Performance Data**: Large datasets and stress tests

#### Data Generation

- Use factory functions for test data creation
- Parameterize tests for different scenarios
- Use realistic data patterns
- Include negative test cases

### Test Coverage Guidelines

#### Minimum Coverage Requirements

| Component | Unit Tests | Integration Tests | Smoke Tests |
|-----------|------------|-------------------|-------------|
| Configuration | 80% | 100% | 100% |
| Transport Layer | 90% | 100% | 100% |
| Gateway Logic | 85% | 100% | 100% |
| CLI Commands | 75% | 100% | 100% |
| TUI Components | 70% | 100% | 50% |

#### Coverage Targets

- **Unit Tests**: 80% line coverage minimum
- **Integration Tests**: 100% scenario coverage
- **Smoke Tests**: 100% critical path coverage
- **Performance Tests**: Baseline measurements for all endpoints

### Test Execution

#### Local Development

```bash
# Run all tests
bun test

# Run specific test file
bun test tests/unit/gateway/router.test.ts

# Run with coverage
bun test --coverage

# Run in watch mode
bun test --watch
```

#### CI Pipeline

```yaml
# GitHub Actions example
- name: Run tests
  run: |
    bun test --coverage
    bun run lint
    bun run typecheck
```

#### Performance Testing

```bash
# Run performance tests
bun test tests/performance/

# Run specific performance suite
bun test tests/performance/load/

# Generate performance report
bun test tests/performance/ --reporter=junit
```

## Test Data Management

### Test Environment Setup

#### Environment Variables

```typescript
// Test-specific configuration
process.env.TEST_MODE = "true";
process.env.LOG_LEVEL = "error";
process.env.CONFIG_PATH = "./tests/fixtures/config.json";
```

#### Temporary Directories

- Use system temp directories
- Clean up after tests
- Isolate test data
- Use unique identifiers

### Mock Strategy

#### When to Mock

1. **External Dependencies**: Network calls, file system, databases
2. **Time-Dependent Code**: Date/time, timers, delays
3. **Random Behavior**: UUIDs, random numbers, shuffling
4. **Heavy Operations**: Large computations, I/O operations

#### Mock Implementation

```typescript
// Mock transport for testing
class MockTransport implements Transport {
  async connect(): Promise<void> {
    // Mock connection logic
  }

  async send(request: Request): Promise<Response> {
    // Mock response logic
  }

  async disconnect(): Promise<void> {
    // Mock disconnection logic
  }
}
```

## Performance Testing

### Load Testing

#### Concurrent Clients
- Test with 1, 10, 100, 1000 concurrent clients
- Measure response times and error rates
- Identify bottlenecks and scaling limits

#### Sustained Load
- Test for 1 minute, 5 minutes, 30 minutes
- Monitor memory usage and GC activity
- Verify stability under continuous load

### Memory Testing

#### Leak Detection
- Monitor heap usage over time
- Identify growing memory patterns
- Test with large datasets
- Verify cleanup operations

#### Stress Testing
- Test with maximum connections
- Test with large request sizes
- Test with rapid configuration changes
- Verify graceful degradation

### Latency Testing

#### Target Verification
- Verify p50 < 50ms for tool listing
- Verify p95 < 100ms for tool invocation
- Verify p99 < 200ms for resource operations
- Monitor latency distribution

#### Network Simulation
- Test with 50ms, 100ms, 500ms latency
- Test with 1%, 5%, 10% packet loss
- Test with varying bandwidth limits
- Verify timeout handling

## Debugging Tests

### Common Issues

#### Test Flakiness
- Use proper test isolation
- Avoid shared state
- Use deterministic test data
- Add appropriate timeouts

#### Performance Issues
- Monitor test execution time
- Identify slow tests
- Optimize test setup/teardown
- Use appropriate mocking

#### Resource Leaks
- Verify cleanup operations
- Monitor file handles and network connections
- Test with multiple test runs
- Use memory profiling tools

### Debugging Tools

#### Test Logs
- Enable detailed logging for failing tests
- Use structured logging for test output
- Capture network traffic for integration tests
- Monitor system resources during tests

#### Debugging Techniques

```bash
# Debug specific test
bun test tests/unit/gateway/router.test.ts --inspect

# Debug with verbose output
bun test --verbose

# Debug with specific timeout
bun test --timeout=10000
```

## CI/CD Integration

### Automated Testing

#### Pre-commit Hooks
- Run linting and type checking
- Run unit tests for changed files
- Verify formatting
- Check for security issues

#### Pull Request Validation
- Run full test suite
- Generate coverage reports
- Check for breaking changes
- Validate documentation

#### Release Testing
- Run comprehensive test suite
- Performance regression testing
- Security vulnerability scanning
- Documentation validation

## Test Maintenance

### Test Updates

#### When Tests Fail
1. **Verify Test Logic**: Ensure test is correct
2. **Check Implementation**: Verify code behavior
3. **Update Test**: Modify test if behavior changed
4. **Document Changes**: Update test documentation

#### Test Refactoring
- Extract common setup code
- Improve test readability
- Add descriptive test names
- Remove duplicate test logic

### Test Documentation

#### Test Documentation Standards

```typescript
/**
 * Test: ComponentName_HappyPath
 * 
 * Description: Tests successful operation of component
 * 
 * Scenario: Normal usage with valid input
 * Expected Result: Operation completes successfully
 * 
 * Dependencies: Mock dependencies configured
 * Preconditions: Test environment setup
 * Postconditions: Resources cleaned up
 */
```

## Resources

### Testing Tools

- **Bun Test**: Test runner and assertion library
- **Zod**: Schema validation for test data
- **MiniSearch**: Search functionality testing
- **Jest**: Alternative test runner (if needed)

### Testing References

- [Bun Test Documentation](https://bun.sh/docs/cli/test)
- [Testing Best Practices](https://testingjavascript.com/)
- [Performance Testing Guide](https://k6.io/docs/)
- [Integration Testing Patterns](https://martinfowler.com/articles/practical-test-pyramid.html)

## Version History

### Test Framework Evolution

- **v0.1.0**: Basic unit tests with Bun
- **v0.2.0**: Integration test infrastructure
- **v0.3.0**: Performance testing framework
- **v0.4.0**: Comprehensive test suite with 1000+ tests
- **v1.0.0**: Planned advanced testing features

### Future Enhancements

- **Property-Based Testing**: Automated test case generation
- **Chaos Engineering**: Random failure injection
- **Visual Testing**: UI component testing
- **Contract Testing**: API contract verification
- **Load Testing as Code**: Automated performance testing

## Contributing Tests

### Test Contribution Guidelines

1. **Test Coverage**: Ensure new features are tested
2. **Test Quality**: Write clear, maintainable tests
3. **Test Performance**: Keep tests fast and efficient
4. **Test Documentation**: Document test purpose and scenarios
5. **Test Isolation**: Ensure tests don't interfere with each other

### Test Review Process

1. **Code Review**: Review test implementation
2. **Coverage Check**: Verify test coverage
3. **Performance Check**: Ensure tests don't impact performance
4. **Documentation Review**: Verify test documentation
5. **Integration Check**: Ensure tests integrate with CI/CD