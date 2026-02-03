# Optimization: Global Metadata Cache

**Spec ID:** optimization-global-cache
**Change:** mvp-release-optimization
**Status:** Draft
**Version:** 1.0.0

---

## Summary

Implement shared MCP metadata cache in Registry to eliminate per-session memory duplication, achieving 30% memory footprint reduction.

## Context

Currently, each GatewayServer instance independently transforms and caches MCP metadata (tools, prompts, resources, toolsSchema). This transformation is computationally expensive and the cached metadata is duplicated across all server instances, consuming significant memory in production environments.

## Design

### Current Behavior

```typescript
// Current: Per-instance caching
class GatewayServer {
  private metadataCache: Map<string, CachedMcpMetadata> = new Map();

  getMetadata(serverId: string): CachedMcpMetadata {
    const cached = this.metadataCache.get(serverId);
    if (cached) return cached;
    const metadata = this.transformToMcp(serverId);
    this.metadataCache.set(serverId, metadata);
    return metadata;
  }
}
```

### Proposed Behavior

```typescript
// Optimized: Shared cache at Registry level
class Registry {
  private cachedMcpMetadata: CachedMcpMetadata | null = null;

  getMcpMetadata(version?: number): { metadata: CachedMcpMetadata; version: number } {
    if (!this.cachedMcpMetadata || this.isCacheStale()) {
      this.cachedMcpMetadata = this.transformToMcp();
    }
    return {
      metadata: this.cachedMcpMetadata,
      version: this.cachedMcpMetadata.version
    };
  }

  invalidateCache(): void {
    this.cachedMcpMetadata = null;
  }
}
```

### Implementation Details

- Single shared cache at Registry level instead of per-instance caches
- Cache includes all transformed metadata (tools, prompts, resources, toolsSchema)
- Version numbers enable conditional updates and cache validation
- TTL mechanism prevents stale data (default 30 seconds)
- Automatic invalidation on server capability changes

## Requirements

### Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR1 | Registry must provide getMcpMetadata method returning unified metadata | MUST |
| FR2 | Cache must be invalidated when server capabilities change | MUST |
| FR3 | Version numbers must be returned with metadata | MUST |
| FR4 | TTL mechanism must prevent stale cache serving | MUST |
| FR5 | Multiple GatewayServer instances must share single cache | MUST |

### Non-Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| NFR1 | Memory footprint reduction of 30% for metadata storage | SHOULD |
| NFR2 | Cache access must be thread-safe (concurrent request handling) | MUST |
| NFR3 | Cache invalidation must complete before returning from server change | MUST |
| NFR4 | Metadata transformation performance must improve with caching | SHOULD |

## When/Then Scenarios

### Scenario 1: Cache Miss

```gherkin
WHEN a request for metadata is received AND cache is empty
THEN the transformation to MCP format must be performed
AND the result must be cached
AND the result must be returned with current version number
```

### Scenario 2: Cache Hit with Valid TTL

```gherkin
WHEN a request for metadata is received AND cache contains valid data
THEN the cached metadata must be returned
AND no transformation must be performed
AND the cached version number must be returned
```

### Scenario 3: Cache Hit with Expired TTL

```gherkin
WHEN a request for metadata is received AND cache TTL has expired
THEN the cached data must be discarded
AND new transformation must be performed
AND the new result must be cached
AND the new version number must be returned
```

### Scenario 4: Server Capabilities Change

```gherkin
WHEN server capabilities are modified
THEN the cache must be invalidated synchronously
AND subsequent metadata requests must trigger fresh transformation
AND no stale data must be served after invalidation
```

### Scenario 5: Conditional Request with Version

```gherkin
WHEN a metadata request includes a version number AND the current version matches
THEN an indication of no changes must be returned
AND the full metadata must not be returned
```

## API Surface

### Method Signature

```typescript
interface Registry {
  /**
   * Retrieves MCP metadata, using cached version if available and valid.
   *
   * @param version - Optional client-provided version number for cache validation
   * @returns Object containing metadata and current version number
   */
  getMcpMetadata(version?: number): { metadata: CachedMcpMetadata; version: number };

  /**
   * Invalidates the cached metadata, forcing regeneration on next access.
   */
  invalidateCache(): void;
}

interface CachedMcpMetadata {
  tools: Tool[];
  prompts: Prompt[];
  resources: Resource[];
  toolsSchema: JsonSchema7;
  version: number;
  timestamp: number;
}
```

### Files to Modify

- `src/gateway/registry.ts` - Add cache structure and methods
- `src/gateway/http.ts` - Use shared registry cache instead of instance cache
- Any other locations that currently cache MCP metadata

## Testing Strategy

### Unit Tests

- `getMcpMetadata with empty cache performs transformation`
- `getMcpMetadata with valid cache returns cached data`
- `getMcpMetadata with expired TTL triggers regeneration`
- `invalidateCache clears cached data`
- `version numbers are correctly assigned and returned`

### Integration Tests

- Memory profiling shows 30% reduction in metadata storage
- Cache invalidation occurs correctly on server capability changes
- Concurrent requests are handled correctly
- TTL mechanism works correctly over time

### Performance Tests

- Memory consumption comparison (before/after)
- Cache hit rate measurement
- Transformation time reduction verification

## Metrics and Validation

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Memory footprint for metadata | 30% reduction | Memory profiling tool |
| Cache hit rate | >80% under normal load | Runtime metrics |
| Transformation time | 100% reduction on cache hit | Performance benchmarking |
| Cache invalidation latency | <10ms | Performance benchmarking |

## Rollback Plan

1. Remove shared cache from Registry
2. Restore per-instance caching in GatewayServer
3. Run full test suite to verify restoration
4. Monitor memory metrics to confirm rollback success

## Dependencies

- None (this optimization is self-contained)

## Open Questions

### Question 1: Should cache TTL be configurable?

**From Design Document:** Yes, add TTL configuration to Registry options with default of 30 seconds.

**Implementation Note:** Add `metadataCacheTtl` configuration option to Registry initialization.

---

**Spec Created:** 2026-01-31
**Last Updated:** 2026-01-31
