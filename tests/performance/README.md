# Goblin Performance Tests

Performance tests for validating Goblin's performance characteristics under various conditions.

## Running Performance Tests

```bash
# Run all performance tests
bun run perf

# Run specific category
bun run perf:load        # Load tests
bun run perf:memory      # Memory tests
bun run perf:latency     # Latency tests
bun run perf:throughput  # Throughput tests
bun run perf:baseline    # Baseline tests
```

## Test Categories

### Load Tests (`tests/performance/load/`)
- `concurrent.test.ts` - Concurrent client handling (100, 250, 500 clients)
- `sustained.test.ts` - Sustained load over extended periods (1h, 8h)
- `rampup.test.ts` - Load ramp-up behavior

### Memory Tests (`tests/performance/memory/`)
- `stability.test.ts` - Memory stability during extended operations

### Latency Tests (`tests/performance/latency/`)
- `target.test.ts` - Latency target verification (p50 < 50ms, p95 < 100ms, p99 < 200ms)

### Throughput Tests (`tests/performance/throughput/`)
- `capacity.test.ts` - Maximum throughput capacity and saturation point

### Baseline Tests (`tests/performance/baseline/`)
- `storage.test.ts` - Baseline storage and retrieval
- `comparison.test.ts` - Baseline comparison and regression detection

## Configuration

Performance tests are configured via environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `PERFORMANCE_GATEWAY_URL` | Gateway URL to test | `http://localhost:3000` |
| `PERFORMANCE_TEST_DURATION` | Test duration in ms | `60000` |
| `PERFORMANCE_CONCURRENT_CLIENTS` | Number of concurrent clients | `100` |
| `PERFORMANCE_TIMEOUT` | Test timeout in ms | `300000` |

## Baselines

Performance baselines are stored in `benchmarks/` directory. Baselines are used for regression detection and comparison.

### Creating a Baseline

```bash
# Run performance tests to create initial baseline
bun run perf
```

### Comparing Against Baseline

Baselines are automatically compared during test runs. Significant regressions will be reported.

## Performance Targets

| Metric | Target | Threshold |
|--------|--------|-----------|
| p50 Latency | < 50ms | 10% regression |
| p95 Latency | < 100ms | 15% regression |
| p99 Latency | < 200ms | 20% regression |
| Throughput | > 1000 RPS | 10% regression |
| Memory Growth | < 100MB | 20% regression |

## CI Integration

Performance tests run nightly in CI and can be triggered manually via GitHub Actions workflow dispatch.

## Shared Utilities

- `load-generator.ts` - Synthetic load generation
- `memory-monitor.ts` - Memory usage monitoring
- `latency-measurer.ts` - High-precision latency measurement
- `throughput-tester.ts` - Throughput capacity testing
- `baseline-manager.ts` - Performance baseline management
- `test-config.ts` - Shared test configuration
