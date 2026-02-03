## Context

Performance test infrastructure has several issues:

1. **Memory Monitor** (`memory-monitor.ts`):
   - Duplicate `takeSnapshot()` code between `monitor()` and `takeSnapshot()` methods
   - `getCurrentUsage()` duplicates `takeSnapshot()` logic
   - No cleanup if test is interrupted

2. **Load Generator** (`load-generator.ts`):
   - No progress reporting during long tests
   - Limited error handling details
   - No abort mechanism for long-running tests

3. **Test Server** (`test-server.ts`):
   - Server URL resolution can be inconsistent
   - Health check timeout is fixed at 5 seconds

## Goals / Non-Goals

**Goals:**
- Fix code duplication in memory-monitor.ts
- Add proper cleanup handling
- Improve error reporting and progress indicators
- Add abort mechanisms for long-running tests

**Non-Goals:**
- Change test assertions or logic
- Add new test cases
- Modify test durations

## Decisions

### 1. Memory Monitor Refactoring

**Decision**: Eliminate duplicate code, improve cleanup

```typescript
export class MemoryMonitor {
  private snapshots: MemorySnapshot[] = [];
  private intervalId: NodeJS.Timeout | null = null;
  private isMonitoring = false;
  private abortController: AbortController | null = null;

  // Single source of truth for snapshot creation
  private createSnapshot(): MemorySnapshot {
    const usage = process.memoryUsage();
    return {
      timestamp: Date.now(),
      heapUsed: usage.heapUsed,
      heapTotal: usage.heapTotal,
      external: usage.external,
      arrayBuffers: usage.arrayBuffers || 0,
      rss: usage.rss,
    };
  }

  async monitor(duration: number, config: MemoryConfig): Promise<MemoryResult> {
    this.snapshots = [];
    this.isMonitoring = true;
    this.abortController = new AbortController();

    const intervalMs = config.intervalMs;
    const maxSamples = config.sampleCount || Math.floor(duration / intervalMs);

    return new Promise((resolve, reject) => {
      let sampleCount = 0;
      let peakSnapshot = this.getEmptySnapshot();

      const collectMemory = () => {
        if (!this.isMonitoring || this.abortController?.signal.aborted) {
          this.stop();
          return;
        }

        const snapshot = this.createSnapshot();
        this.snapshots.push(snapshot);
        sampleCount++;

        if (snapshot.heapUsed > peakSnapshot.heapUsed) {
          peakSnapshot = snapshot;
        }

        if (sampleCount < maxSamples && !this.abortController?.signal.aborted) {
          this.intervalId = setTimeout(collectMemory, intervalMs);
        } else {
          this.stop();
          resolve(this.analyzeResults(peakSnapshot, config.warmupSamples || 3));
        }
      };

      collectMemory();
    });
  }

  takeSnapshot(): MemorySnapshot {
    return this.createSnapshot();
  }

  stop(): void {
    this.isMonitoring = false;
    this.abortController?.abort();
    if (this.intervalId) {
      clearTimeout(this.intervalId);
      this.intervalId = null;
    }
  }

  // Remove getCurrentUsage() - use takeSnapshot() instead
}
```

### 2. Load Generator Improvements

**Decision**: Add progress reporting and better error handling

```typescript
export class LoadGenerator {
  async generateLoad(config: LoadConfig, onProgress?: (result: LoadResult) => void): Promise<LoadResult> {
    // ... existing code ...

    return new Promise((resolve, reject) => {
      let resolved = false;

      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          reject(new Error(`Load test timed out after ${duration}ms`));
        }
      }, duration + 30000);

      try {
        const tracker = autocannon(opts);

        tracker.on("error", (error: Error) => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            reject(new Error(`Load test failed: ${error.message}`));
          }
        });

        tracker.on("done", (result) => {
          if (resolved) return;
          resolved = true;
          clearTimeout(timeout);

          const loadResult = this.convertAutocannonResult(result);
          
          if (onProgress) {
            onProgress(loadResult);
          }
          
          resolve(loadResult);
        });
      } catch (error) {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          reject(error instanceof Error ? error : new Error(String(error)));
        }
      }
    });
  }
}
```

### 3. Test Server Improvements

**Decision**: Add abort signal support and consistent URL resolution

```typescript
export async function checkServerHealth(
  gatewayUrl?: string, 
  signal?: AbortSignal
): Promise<HealthCheckResult> {
  const url = gatewayUrl || serverUrl || `http://${DEFAULT_HOST}:${DEFAULT_PORT}`;
  const start = Date.now();

  try {
    const controller = new AbortController();
    const timeout = signal ? Math.min(5000, signal.timeout) : 5000;
    
    const response = await fetch(`${url}/health`, {
      signal: controller.signal,
    });

    const latency = Date.now() - start;

    if (response.ok) {
      return { healthy: true, message: "Server is healthy", latency };
    }

    return { healthy: false, message: `Server returned status ${response.status}`, latency };
  } catch (error) {
    return { healthy: false, message: error instanceof Error ? error.message : "Connection failed" };
  }
}
```

## Files to Modify

1. `tests/performance/shared/memory-monitor.ts` - Refactor, remove duplication, add abort
2. `tests/performance/shared/load-generator.ts` - Add progress callback, improve errors
3. `tests/performance/shared/test-server.ts` - Add abort signal support

## Risks / Trade-offs

**[Risk] Refactoring may introduce bugs**
→ Changing working code carries risk
→ **Mitigation**: Test changes thoroughly, keep backup of original behavior

**[Risk] Breaking existing test imports**
→ If tests rely on specific method signatures
→ **Mitigation**: Maintain backward compatible interfaces

## Migration Plan

1. Refactor memory-monitor.ts:
   - Create single `createSnapshot()` method
   - Remove duplicate `takeSnapshot()` calls
   - Add abort controller
   - Test cleanup works

2. Improve load-generator.ts:
   - Add optional progress callback
   - Improve error messages
   - Test abort mechanism

3. Improve test-server.ts:
   - Add abort signal support
   - Test health check with signals

4. Run all performance tests to verify no regressions

## Open Questions

1. Should we add a progress bar for long-running tests? (Nice to have)
2. Should we add a timeout override via environment variable?
