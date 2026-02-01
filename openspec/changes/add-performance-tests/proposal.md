## Why

Goblin needs performance tests to ensure it can handle production workloads reliably. Without systematic performance testing, performance regressions can go undetected, leading to degraded user experience and potential system instability. Performance tests are critical for validating that the gateway meets its latency targets (<50ms routing overhead), handles concurrent load gracefully, and does not leak memory during extended operations. These tests enable proactive performance management and provide confidence during refactoring and optimization efforts.

## What Changes

- Write load tests for gateway with many concurrent tool calls (100+ concurrent clients)
- Write memory usage tests to monitor for leaks during extended operations (1+ hour sustained load)
- Write latency tests to verify <50ms routing overhead target is maintained
- Write throughput tests to determine maximum request handling capacity
- Create performance baseline and regression detection framework
- Add performance tests to CI/CD pipeline for continuous monitoring

All performance tests use realistic workloads, measure key metrics, and establish performance baselines with alerting on regression.

## Capabilities

### New Capabilities

- `performance-load-tests`: Load tests validating gateway behavior under high concurrent tool call volume with 100+ simultaneous clients
- `performance-memory-tests`: Memory leak detection tests monitoring heap usage, object allocations, and garbage collection during extended operations
- `performance-latency-tests`: Latency tests verifying <50ms routing overhead target with p50, p95, p99 percentile measurements
- `performance-throughput-tests`: Throughput tests determining maximum request handling capacity and saturation point
- `performance-baseline-framework`: Performance baseline framework for tracking metrics over time and detecting regressions

### Modified Capabilities

- None (new test coverage only, no behavior changes)

## Impact

### Affected Code

- `tests/performance/load/`: New test directory for load testing scenarios
- `tests/performance/memory/`: New test directory for memory leak detection tests
- `tests/performance/latency/`: New test directory for latency measurement tests
- `tests/performance/throughput/`: New test directory for throughput capacity tests
- `tests/performance/shared/`: Shared utilities for performance testing (load generators, metrics collectors, baseline manager)
- `tests/performance/fixtures/`: Test fixtures for performance testing (test servers, workloads, configurations)
- `benchmarks/`: Directory for performance benchmarks and baseline data

### Testing Framework

- Bun test for running performance tests
- Autocannon oroha for HTTP load generation
- Node.js performance hooks for memory profiling
- Custom metrics collection for latency and throughput

### Dependencies

- May require load testing tools (autocannon,oha)
- May require memory profiling tools (clinic.js, node-memwatch)
- Performance monitoring dashboard (optional)

### Security Considerations

- Performance tests use isolated test environments
- Tests do not expose sensitive performance data
- Load testing does not affect production systems
- Test data is generated and does not contain real user information
