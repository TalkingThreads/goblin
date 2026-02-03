# MVP Release Optimization Design Document

**Date:** January 31, 2026
**Status:** Draft
**Author:** Goblin Development Team

---

## Context

Goblin codebase exploration identified 5 key optimization opportunities for the upcoming MVP release. These optimizations focus on performance improvements that maintain backward compatibility while reducing resource consumption and improving response times. The codebase analysis revealed specific areas where conservative, behavior-preserving changes can yield significant benefits without introducing breaking changes or new features.

The first optimization opportunity centers on Registry Synchronization. Currently, the registry performs a full synchronization on every change notification from MCP servers. This approach is inefficient because change notifications typically indicate updates to specific capabilities (tools, prompts, or resources), yet the system fetches all capability data regardless of the notification type. For deployments with multiple servers and frequent capability updates, this results in unnecessary network overhead and increased latency.

The second optimization addresses Global Metadata Cache duplication. Analysis of the GatewayServer implementation reveals that each server instance independently transforms and caches MCP metadata. This per-session memory duplication becomes significant in production environments where multiple gateway instances serve requests simultaneously. The transformation process itself—converting server capabilities into MCP-compliant metadata structures—is computationally expensive and repeated unnecessarily.

Connection Pooling Concurrency presents the third optimization opportunity. During high-concurrency scenarios, particularly during startup or after connection failures, multiple concurrent requests may attempt to establish connections to the same MCP server. This "thundering herd" problem results in duplicate connection attempts, wasted network resources, and potential connection limit exhaustion on target servers. The current implementation lacks coordination mechanisms to prevent these duplicate attempts.

Build Optimization represents the fourth opportunity. While Goblin is built with Bun and utilizes Bun-specific APIs (Bun.serve), the current build configuration does not leverage Bun's native optimization capabilities. The build process targets a generic Node.js environment instead of Bun-specific optimizations, and minification is not enabled. These omissions result in larger binary sizes and slower startup times compared to what Bun can provide.

The fifth optimization addresses Error Handling patterns. Current error handling relies on string matching to identify error types, which is fragile and prone to breakage when error messages change. Additionally, error logging patterns include excessive overhead from repeated string construction and inconsistent logging formats across different error paths. This makes error tracking and debugging more difficult while adding unnecessary performance overhead.

**Current State:** The Goblin codebase is functional and working, with all core features implemented and tested. Performance profiling and codebase analysis have identified specific optimization opportunities that can be implemented conservatively without affecting behavior or breaking existing APIs.

**Constraints:** All optimizations must be conservative, meaning they should not change external behavior or break existing APIs. Each optimization must have a clear rollback path in case unexpected issues arise. Changes should be incremental and testable at each step. No new features may be introduced as part of this optimization effort, and no schema changes are permitted.

---

## Goals / Non-Goals

### Goals

The primary goal of this optimization effort is to improve Goblin's performance characteristics for production deployment while maintaining complete backward compatibility. Each optimization targets specific, measurable improvements that can be verified through benchmarking and testing.

**Registry Synchronization Optimization:** The target is to reduce network overhead from registry synchronization operations by 50% compared to current baseline measurements. This will be achieved by fetching only the specific capabilities that changed rather than performing full synchronization on every notification. Success will be measured by monitoring network traffic patterns and comparing pre-optimization and post-optimization byte counts for synchronization operations.

**Memory Footprint Reduction:** The goal is to reduce per-session memory footprint by 30% through elimination of duplicate metadata caching across GatewayServer instances. This reduction applies specifically to the memory consumed by cached MCP metadata structures. Measurement will be conducted using memory profiling tools to compare baseline and optimized memory consumption under equivalent load conditions.

**Concurrency Improvement:** The objective is to prevent duplicate connection attempts during concurrency spikes, eliminating wasted network resources and potential connection limit issues. Success is measured by verifying that concurrent requests for the same server result in a single connection attempt, with all requesters receiving the established connection.

**Build Output Optimization:** The target is 20% faster application startup time through optimized build output. This includes both the time to load the application binary and the initialization phase before the server begins accepting requests. Measurement will use standardized timing scripts to compare startup duration before and after optimization.

**Error Handling Cleanup:** The goal is to eliminate fragile string matching patterns and consolidate logging overhead. Success is measured by code review verification that all error handling uses type-safe patterns and that logging is consolidated appropriately.

### Non-Goals

This optimization effort explicitly excludes several potential improvements to maintain focus and minimize risk. No breaking API changes will be introduced; all external interfaces must remain identical in behavior and signature. The optimization effort does not include any new features beyond the performance improvements described above.

No schema changes are permitted for configuration files, API responses, or internal data structures. Configuration files must remain compatible with existing deployments, and API responses must be byte-for-byte identical to current outputs to prevent breaking client integrations.

Performance regression in any metric is explicitly prohibited. If any optimization results in slower performance in any scenario, that optimization must be reverted and an alternative approach developed. This includes edge cases and unusual usage patterns that may not be captured in primary test suites.

The optimization effort does not address scalability improvements beyond the specific issues identified. While the optimizations may improve scalability indirectly, addressing broader scalability concerns is outside the scope of this effort.

---

## Decisions

### Decision 1: Registry Sync Strategy

**Choice:** Targeted capability sync based on notification type

**Status:** Approved

**Rationale:**

The change notification mechanism from MCP servers already includes information about which capability was modified. The notification types distinguish between tools, prompts, and resources, indicating precisely which aspect of the server state changed. Rather than ignoring this information and fetching all capability data, the registry can use this signal to fetch only the affected capabilities.

A single fetch operation for the specific changed capability is simpler to implement and reason about than attempting to compute incremental diffs between cached and current states. The incremental diff approach would require tracking detailed version information for each capability and handling complex merge scenarios. The targeted fetch approach maintains consistency guarantees while significantly reducing the amount of data transferred.

The backward-compatible fallback ensures that existing notification sources that do not specify capability type continue to function correctly. This approach minimizes risk by preserving existing behavior while enabling optimization for sources that provide detailed notifications.

**Implementation:**

```typescript
/**
 * Synchronizes a server's capabilities, fetching only the specified capability type
 * if provided, or performing a full sync as fallback.
 * 
 * @param serverId - The unique identifier of the server to synchronize
 * @param capability - Optional capability type to sync; if undefined, performs full sync
 * @returns Promise resolving when synchronization completes
 */
async syncServer(serverId: string, capability?: "tools" | "prompts" | "resources"): Promise<void> {
  const server = this.getServer(serverId);
  if (!server) {
    throw new ServerNotFoundError(serverId);
  }

  if (capability) {
    switch (capability) {
      case "tools":
        await this.syncTools(serverId);
        break;
      case "prompts":
        await this.syncPrompts(serverId);
        break;
      case "resources":
        await this.syncResources(serverId);
        break;
    }
  } else {
    await this.fullSync(serverId);
  }
}

/**
 * Performs a full synchronization of all server capabilities.
 * Used as fallback when capability type is not specified.
 */
private async fullSync(serverId: string): Promise<void> {
  await Promise.all([
    this.syncTools(serverId),
    this.syncPrompts(serverId),
    this.syncResources(serverId)
  ]);
}
```

**Verification Criteria:**

- Registry sync operations for specific capabilities transfer 50% less data than full sync operations
- All existing tests pass without modification
- Fallback path (full sync) is exercised only when capability is undefined
- Error handling for invalid capability types is implemented

---

### Decision 2: Global Metadata Cache

**Choice:** Shared cache in Registry, invalidated on server changes

**Status:** Approved

**Rationale:**

The MCP metadata transformation process—converting server capabilities into the standardized MCP metadata format—is computationally expensive. This transformation involves iterating through all tools, prompts, and resources, applying schema transformations, and constructing the unified metadata structure. Each GatewayServer instance independently performs this transformation, resulting in duplicated work and memory consumption.

By implementing a shared cache at the Registry level, all GatewayServer instances can share a single cached copy of the metadata structure. The cache is invalidated whenever server capabilities change, ensuring that subsequent requests receive updated metadata. Version numbers track cache validity, allowing clients to provide their cached version and receive only updates if the version has changed.

This approach eliminates the per-session memory duplication while maintaining correctness through explicit invalidation on server changes. The implementation is straightforward and does not require changes to the external API or client behavior.

**Implementation:**

```typescript
interface CachedMcpMetadata {
  tools: Tool[];
  prompts: Prompt[];
  resources: Resource[];
  toolsSchema: JsonSchema7;
  version: number;
  timestamp: number;
}

class Registry {
  private cachedMcpMetadata: CachedMcpMetadata | null = null;
  private readonly CACHE_TTL_MS = 30000; // Default TTL of 30 seconds

  /**
   * Retrieves MCP metadata, using cached version if available and valid.
   * 
   * @param version - Optional client-provided version number for cache validation
   * @returns Object containing metadata and current version number
   */
  getMcpMetadata(version?: number): { metadata: CachedMcpMetadata; version: number } {
    if (!this.cachedMcpMetadata || this.isCacheStale()) {
      this.cachedMcpMetadata = this.transformToMcp();
    }
    
    return {
      metadata: this.cachedMcpMetadata,
      version: this.cachedMcpMetadata.version
    };
  }

  /**
   * Transforms server capabilities into MCP metadata format.
   * This is the expensive operation that benefits from caching.
   */
  private transformToMcp(): CachedMcpMetadata {
    const servers = this.listServers();
    const allTools: Tool[] = [];
    const allPrompts: Prompt[] = [];
    const allResources: Resource[] = [];

    for (const server of servers) {
      const capabilities = this.getServerCapabilities(server.id);
      allTools.push(...capabilities.tools);
      allPrompts.push(...capabilities.prompts);
      allResources.push(...capabilities.resources);
    }

    return {
      tools: allTools,
      prompts: allPrompts,
      resources: allResources,
      toolsSchema: this.generateToolsSchema(allTools),
      version: Date.now(),
      timestamp: Date.now()
    };
  }

  /**
   * Invalidates the cached metadata, forcing regeneration on next access.
   * Called automatically when server capabilities change.
   */
  invalidateCache(): void {
    this.cachedMcpMetadata = null;
  }

  private isCacheStale(): boolean {
    if (!this.cachedMcpMetadata) {
      return true;
    }
    const age = Date.now() - this.cachedMcpMetadata.timestamp;
    return age > this.CACHE_TTL_MS;
  }
}
```

**Verification Criteria:**

- Memory profiling shows 30% reduction in metadata storage across GatewayServer instances
- Cache invalidation occurs correctly on server capability changes
- Version numbers are returned and can be used for conditional updates
- TTL mechanism prevents stale cache data from being served indefinitely

---

### Decision 3: Connection Pooling Guard

**Choice:** Promise-based pending connection map

**Status:** Approved

**Rationale:**

The thundering herd problem during high concurrency occurs when multiple concurrent requests attempt to establish connections to the same MCP server. Each request creates an independent connection attempt, wasting network resources and potentially exhausting connection limits on the target server. A simple coordination mechanism can prevent these duplicate attempts.

Using a Promise-based pending connection map is the most straightforward solution. When a connection request arrives, the pool first checks if a connection for that server already exists in the cache. If not, it checks whether a connection attempt is already in progress (stored as a Promise). If such a pending connection exists, the new request waits for that Promise to resolve rather than initiating a new connection.

This approach leverages built-in Promise caching behavior, where multiple awaiters of the same Promise all receive the same resolution value. The implementation is simple to understand, easy to test, and has clear semantics for when connections succeed or fail.

**Implementation:**

```typescript
interface TransportPool {
  cache: Map<string, Transport>;
  pendingConnections: Map<string, Promise<Transport>>;
}

/**
 * Retrieves an established transport for the specified server, creating one if necessary.
 * Prevents duplicate connection attempts by tracking pending connections.
 * 
 * @param serverId - The unique identifier of the server to connect to
 * @returns Promise resolving to an established Transport instance
 */
async getTransport(serverId: string): Promise<Transport> {
  // Return cached transport if available
  const cached = this.cache.get(serverId);
  if (cached) {
    return Promise.resolve(cached);
  }

  // Check for pending connection attempt
  const pending = this.pendingConnections.get(serverId);
  if (pending) {
    return pending;
  }

  // Initiate new connection
  const connectionPromise = this.createConnection(serverId);
  this.pendingConnections.set(serverId, connectionPromise);

  connectionPromise
    .then(transport => {
      this.pendingConnections.delete(serverId);
      this.cache.set(serverId, transport);
    })
    .catch(error => {
      this.pendingConnections.delete(serverId);
      throw error;
    });

  return connectionPromise;
}

/**
 * Creates a new transport connection to the specified server.
 */
private async createConnection(serverId: string): Promise<Transport> {
  const server = this.getServerConfig(serverId);
  const transport = new ServerTransport(server);
  await transport.connect();
  return transport;
}
```

**Verification Criteria:**

- Concurrent requests for the same server result in exactly one connection attempt
- All concurrent requesters receive the established connection
- Failed connection attempts are properly handled and do not block future attempts
- Connection failures are reported correctly to all waiting requesters

---

### Decision 4: Build Optimization

**Choice:** Bun-specific target with minification

**Status:** Approved

**Rationale:**

Goblin is built with Bun and uses Bun-specific APIs throughout the codebase, including Bun.serve for HTTP handling and Bun-specific runtime features. Despite this, the current build configuration targets a generic Node.js environment, missing opportunities for Bun-specific optimizations.

Bun's build tool provides significant optimizations when targeting the Bun runtime specifically. These include tree-shaking optimizations that eliminate unused code, native module handling appropriate for Bun's module resolution, and platform-specific code generation. Additionally, enabling minification reduces the final binary size and can improve parsing and loading times.

The minification process removes unnecessary whitespace, shortens variable names where safe, and performs other size-reducing transformations. For production deployments, smaller binary sizes translate to faster deployments, reduced storage requirements, and potentially faster initial loading.

**Implementation:**

```json
{
  "scripts": {
    "build": "bun build src/index.ts --target bun --minify --sourcemap=external",
    "build:node": "bun build src/index.ts --outdir dist --target node",
    "build:analyze": "bun build src/index.ts --target bun --minify --analyze"
  }
}
```

**Configuration Details:**

The `--target bun` flag instructs Bun's build tool to optimize for the Bun runtime specifically. This enables Bun's native module resolution, eliminates polyfills for Bun-provided APIs, and applies Bun-specific code generation optimizations.

The `--minify` flag enables minification of the output, reducing file size through whitespace removal, identifier shortening, and constant folding. This is safe for production builds where debugging is performed using external source maps.

The `--sourcemap=external` flag generates source maps in a separate file rather than embedding them in the binary. This keeps the main binary small while maintaining the ability to debug production issues through the external map files.

**Verification Criteria:**

- Build output is 20% smaller than current output
- Startup time is measurably faster (target: 20% improvement)
- Application functionality is identical to pre-optimization build
- Source maps are generated correctly and usable for debugging

---

### Decision 5: Error Handling

**Choice:** Custom error classes with structured logging

**Status:** Approved

**Rationale:**

Current error handling relies on string matching to identify error types. This approach is fragile because error messages may change during refactoring or localization, breaking the matching logic unexpectedly. Additionally, inconsistent logging patterns across error handlers make error tracking and debugging more difficult.

Introducing custom error classes provides type-safe error identification. Each error type is represented by a dedicated class with consistent properties, eliminating reliance on fragile string matching. Error codes provide stable identifiers that remain constant even if display messages change.

Consolidating logging patterns ensures that all errors are logged with consistent structure and appropriate context. Rather than constructing log messages through string concatenation, structured logging includes relevant context as named properties. This improves log parsing and analysis while reducing the overhead of string manipulation.

**Implementation:**

```typescript
/**
 * Base error class for all Goblin-specific errors.
 */
class GoblinError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public context?: Record<string, unknown>
  ) {
    super(message);
    this.name = "GoblinError";
    Error.captureStackTrace(this, GoblinError);
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      context: this.context,
      stack: this.stack
    };
  }
}

/**
 * Error thrown when a requested tool is not found.
 */
class ToolNotFoundError extends GoblinError {
  constructor(toolName: string, serverId?: string) {
    super(
      `Tool not found: ${toolName}`,
      "TOOL_NOT_FOUND",
      404,
      { toolName, serverId }
    );
    this.name = "ToolNotFoundError";
  }
}

/**
 * Error thrown when a server is not registered.
 */
class ServerNotFoundError extends GoblinError {
  constructor(serverId: string) {
    super(
      `Server not found: ${serverId}`,
      "SERVER_NOT_FOUND",
      404,
      { serverId }
    );
    this.name = "ServerNotFoundError";
  }
}

/**
 * Error thrown when connection to a server fails.
 */
class ConnectionError extends GoblinError {
  constructor(serverId: string, reason: string) {
    super(
      `Connection failed to server: ${serverId}`,
      "CONNECTION_ERROR",
      503,
      { serverId, reason }
    );
    this.name = "ConnectionError";
  }
}
```

**Consolidated Logging Implementation:**

```typescript
/**
 * Handles an incoming request with consolidated logging.
 */
async function handleRequest(request: Request): Promise<Response> {
  const start = Date.now();
  const requestId = generateRequestId();
  
  try {
    const result = await router.route(request);
    
    logger.info({
      requestId,
      method: request.method,
      path: request.path,
      statusCode: result.status,
      durationMs: Date.now() - start
    }, "Request completed");
    
    return result;
  } catch (error) {
    if (error instanceof GoblinError) {
      logger.error({
        requestId,
        method: request.method,
        path: request.path,
        errorCode: error.code,
        statusCode: error.statusCode,
        durationMs: Date.now() - start,
        context: error.context
      }, error.message);
    } else {
      logger.error({
        requestId,
        method: request.method,
        path: request.path,
        errorType: error.constructor.name,
        durationMs: Date.now() - start
      }, "Unexpected error occurred");
    }
    
    throw error;
  }
}
```

**Verification Criteria:**

- All error handling uses type-safe error classes instead of string matching
- Logging output is structured consistently for all error paths
- Error codes remain stable regardless of message changes
- Legacy error strings are maintained for API compatibility

---

## Risks / Trade-offs

### Risk: Cache Invalidation Timing

**Description:** The global metadata cache relies on explicit invalidation when server capabilities change. There is a risk that invalidation may not occur in all necessary scenarios, leading to stale cache data being served to clients.

**Impact:** Medium - Incorrect metadata could cause client operations to fail or behave unexpectedly.

**Mitigation:** Invalidate cache synchronously on all server change operations. Use version numbers in cache entries and consider adding TTL-based fallback invalidation. Implement integration tests that verify cache invalidation behavior. Add monitoring to detect potential cache staleness issues in production.

**Detection:** Cache invalidation issues would manifest as clients receiving outdated tool, prompt, or resource listings. Monitoring can track metadata version changes to detect unexpected staleness.

---

### Risk: Build Compatibility

**Description:** Optimizing the build for Bun-specific targets may introduce compatibility issues if the application is eventually run on Node.js or other runtimes. While Goblin currently uses Bun exclusively, maintaining flexibility for other runtimes may be desirable.

**Impact:** Low - Goblin is designed to run on Bun, and the optimization improves rather than degrades functionality.

**Mitigation:** Test build output thoroughly on target platforms. Keep the Node.js build target as an alternative in package.json. Document the build optimization and its requirements clearly. Verify that all Bun-specific APIs are correctly handled in the optimized build.

**Detection:** Build compatibility issues would be immediately apparent if the optimized build fails to start or exhibits runtime errors. Pre-deployment testing will catch these issues.

---

### Risk: Error Handling Regression

**Description:** Refactoring error handling from string matching to type-safe classes could introduce behavioral differences if error handling logic relied on specific string patterns that are not preserved in the new implementation.

**Impact:** Medium - Incorrect error handling could cause unexpected behavior or information leakage.

**Mitigation:** Extensive testing of all error paths before and after refactoring. Compare error outputs (messages, codes, status) to ensure identical behavior. Maintain legacy error strings in API responses for backward compatibility. Add integration tests that verify error handling across all known error scenarios.

**Detection:** Error handling regressions would manifest as different error responses for equivalent error conditions. Automated tests comparing pre-optimization and post-optimization error outputs will detect these differences.

---

### Risk: Connection Race Conditions

**Description:** The promise-based connection pooling guard must handle all race conditions correctly, including rapid sequential requests, concurrent requests with varying timing, and connection failures at different stages of completion.

**Impact:** High - Incorrect handling could cause connection leaks, failed requests, or indefinite blocking.

**Mitigation:** Test high-concurrency scenarios with multiple concurrent requests. Add integration tests that verify single-connection behavior under load. Test failure scenarios to ensure pending connections are cleaned up correctly. Consider adding timeout handling for connection attempts.

**Detection:** Connection race conditions would manifest as duplicate connections, connection leaks, or requests hanging indefinitely. Load testing and concurrency tests will detect these issues.

---

## Migration Plan

The optimization implementation follows a specific order based on risk profile and dependencies. Lower-risk changes are implemented first to establish patterns and verify tooling, while higher-risk changes are implemented later after the codebase has been stabilized.

**Phase 1: Connection Pooling Guard (Days 1-2)**

Implement the promise-based pending connection map in the TransportPool. This change has the lowest risk and provides immediate benefit by preventing duplicate connections during concurrency spikes. The implementation is isolated to the TransportPool class with no external API changes. After implementation, run existing concurrency tests to verify behavior, then add new concurrency tests to specifically validate the single-connection guarantee.

**Phase 2: Build Optimization (Days 3-4)**

Update package.json build scripts to use Bun-specific targeting and minification. This change is straightforward and has clear, measurable impact. Test the build output to verify functionality is preserved, then measure startup time improvement. Document the build optimization and verify source map generation works correctly.

**Phase 3: Error Handling Improvements (Days 5-7)**

Implement custom error classes and refactor error handling throughout the codebase. This moderate-risk change improves code quality and enables better error tracking. Implement error classes first, then refactor error handling in each module. Verify all existing tests pass after refactoring, and confirm error outputs remain identical for API compatibility.

**Phase 4: Global Metadata Cache (Days 8-10)**

Implement shared cache in Registry with invalidation on server changes. This change has moderate complexity and provides significant memory benefit. Implement the cache structure first, then add invalidation hooks to all server modification operations. Test cache behavior with memory profiling to verify the 30% reduction target.

**Phase 5: Registry Sync Optimization (Days 11-14)**

Implement targeted capability sync based on notification type. This is the most complex optimization with the highest potential benefit. Update the syncServer method to accept capability parameter, update all call sites to pass capability where available, implement fallback for callers that cannot provide capability, and test both paths thoroughly.

**Phase 6: Validation and Measurement (Ongoing)**

After each phase, run the full test suite to ensure no regressions. Measure performance metrics before and after each optimization to verify targets are achieved. Update documentation and implementation notes as needed. If any optimization fails to meet targets or introduces issues, follow the rollback procedure.

**Rollback Procedure:**

Each optimization is implemented as an independent change that can be reverted individually. For code changes, revert the specific git commits implementing the optimization. For configuration changes, restore the previous configuration values. Re-run tests after rollback to verify the previous state is restored. Document any issues encountered to inform future optimization attempts.

---

## Open Questions

### Question 1: Should cache TTL be configurable?

**Recommendation:** Yes, add TTL configuration to the Registry options.

**Considerations:**

A configurable TTL allows operators to balance between cache efficiency and freshness based on their specific deployment patterns. Some deployments may have frequent server changes requiring short TTLs, while others may have stable configurations that benefit from longer TTLs.

**Proposed Solution:**

Add a `metadataCacheTtl` configuration option to the Registry initialization options, with a default value of 30 seconds. Document the option and its impact on memory usage versus freshness.

---

### Question 2: How to measure build optimization impact?

**Recommendation:** Use a standardized timing script that measures cold and warm startup times.

**Considerations:**

Build optimization impact should be measured consistently to enable meaningful comparison. Startup time is the primary metric, but binary size and memory footprint during startup are also relevant.

**Proposed Solution:**

Create a `scripts/benchmark-startup.sh` script that:
- Measures time from process start to accepting connections (cold start)
- Measures time for subsequent restarts (warm start, affected by OS caching)
- Reports binary size
- Measures initial memory footprint

Run this script before and after build optimization to quantify improvements.

---

### Question 3: Should we keep legacy error strings for compatibility?

**Recommendation:** Yes, maintain legacy error strings in API responses for backward compatibility.

**Considerations:**

Existing clients may depend on specific error message strings for error handling. Changing these strings could break client integrations unexpectedly.

**Proposed Solution:**

Custom error classes include the legacy error message as the primary message string, ensuring API responses remain byte-for-byte identical to current behavior. Additional context is provided through the `context` property for debugging purposes without affecting the visible error message.

---

## Appendix A: Implementation Checklist

- [ ] Implement promise-based connection pooling guard
- [ ] Update package.json with optimized build scripts
- [ ] Verify build output functionality
- [ ] Measure startup time improvement
- [ ] Create custom error classes
- [ ] Refactor error handling throughout codebase
- [ ] Verify API error responses unchanged
- [ ] Implement shared metadata cache in Registry
- [ ] Add cache invalidation on server changes
- [ ] Measure memory footprint reduction
- [ ] Implement targeted capability sync
- [ ] Update call sites to pass capability parameter
- [ ] Verify sync optimization benefit
- [ ] Run full test suite after each phase
- [ ] Document optimization changes

---

## Appendix B: Reference Implementation

See the following files for implementation details:

- `src/registry/registry.ts` - Registry sync and cache implementation
- `src/transport/pool.ts` - Connection pooling guard
- `src/errors/types.ts` - Custom error class definitions
- `package.json` - Build script updates
- `src/middleware/error-handler.ts` - Consolidated error logging

---

**Document Version:** 1.0
**Last Updated:** 2026-01-31
