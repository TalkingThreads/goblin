# Implementation Tasks: MVP Release Optimization

**Change:** mvp-release-optimization
**Status:** Ready for Implementation
**Created:** 2026-01-31

---

## Overview contains the implementation checklist for the MVP Release

This document Optimization change. All optimizations are behavior-preserving and must maintain backward compatibility.

**Implementation Order (by risk):**
1. Phase 1: Connection Pooling Guard (Days 1-2) - Lowest risk
2. Phase 2: Build Optimization (Days 3-4) - Simple change
3. Phase 3: Error Handling Improvements (Days 5-7) - Moderate risk
4. Phase 4: Global Metadata Cache (Days 8-10) - Moderate complexity
5. Phase 5: Registry Sync Optimization (Days 11-14) - Highest complexity

---

## Phase 1: Connection Pooling Guard

### Tasks

- [x] **1.1** Add `pendingConnections` Map to TransportPool interface
  - Location: `src/transport/pool.ts`
  - Type: `Map<string, Promise<Transport>>`
  - Description: Tracks in-flight connection attempts

- [x] **1.2** Implement pending connection check in `getTransport` method
  - Location: `src/transport/pool.ts`
  - Before creating new connection, check `pendingConnections.get(serverId)`
  - Return existing Promise if found

- [x] **1.3** Implement pending connection tracking
  - Store connection Promise in `pendingConnections` before initiating
  - Remove from `pendingConnections` on completion (success or failure)

- [x] **1.4** Implement connection success handler
  - On success: remove from pending, add to cache, resolve all waiters

- [x] **1.5** Implement connection failure handler
  - On failure: remove from pending, propagate error to all waiters

- [x] **1.6** Add unit tests for concurrent request handling
  - Test multiple concurrent requests result in single connection
  - Test rapid sequential requests
  - Test no duplicate connections under load

- [x] **1.7** Run full test suite to verify no regressions

**Expected Duration:** 1-2 days
**Risk Level:** Low
**Verification Criteria:**
- Zero duplicate connections under concurrent load
- All concurrent requesters receive the established connection
- Failed connection attempts are properly handled

---

## Phase 2: Build Optimization

### Tasks

- [x] **2.1** Update package.json build script
  - Change from: `bun build src/index.ts --outdir dist --target node`
  - Change to: `bun build src/index.ts --target bun --minify --sourcemap=external`

- [x] **2.2** Add build:analyze script for bundle analysis
  - Command: `bun build src/index.ts --target bun --minify --analyze`

- [x] **2.3** Update start script to use built output
  - Verified `bun run dist/index.js` works correctly

- [x] **2.4** Test build output functionality
  - Built executable starts and initializes correctly
  - All meta tools registered successfully
  - HTTP server starts on port 3000
  - All 81 tests pass against built output

- [x] **2.5** Measure build output size
  - Build size: 1.34 MB (index.js)
  - Source maps: 2.97 MB (index.js.map)

- [x] **2.6** Measure startup time improvement
  - Built executable starts in ~10ms (before config loading)
  - All features work correctly

- [x] **2.7** Verify source map generation
  - Source map file generated successfully at dist/index.js.map
  - External sourcemap for debugging

**Expected Duration:** 1 day
**Risk Level:** Low
**Verification Criteria:**
- Build output is 20% smaller than current output
- Startup time is measurably faster (target: 20% improvement)
- Application functionality is identical to pre-optimization build
- Source maps are generated correctly and usable for debugging

---

## Phase 3: Error Handling Improvements

### Tasks

- [ ] **3.1** Create custom error class definitions file
  - Location: `src/errors/types.ts`
  - Define `GoblinError` base class
  - Define `ToolNotFoundError`, `ServerNotFoundError`, `ConnectionError`

- [ ] **3.2** Implement GoblinError base class
  - Properties: message, code, statusCode, context
  - Constructor with all properties
  - toJSON method for structured serialization

- [ ] **3.3** Implement ToolNotFoundError class
  - Code: "TOOL_NOT_FOUND"
  - Status: 404
  - Context: toolName, serverId (optional)

- [ ] **3.4** Implement ServerNotFoundError class
  - Code: "SERVER_NOT_FOUND"
  - Status: 404
  - Context: serverId

- [ ] **3.5** Implement ConnectionError class
  - Code: "CONNECTION_ERROR"
  - Status: 503
  - Context: serverId, reason

- [ ] **3.6** Refactor error handling in gateway/server.ts
  - Replace string matching with instanceof checks
  - Use new error classes

- [ ] **3.7** Refactor error handling in gateway/router.ts
  - Replace string matching with instanceof checks
  - Use new error classes

- [ ] **3.8** Implement consolidated error logging middleware
  - Location: `src/middleware/error-handler.ts`
  - Structured logging with request context
  - Consistent format for all error types

- [ ] **3.9** Add unit tests for error classes
  - Test error properties are set correctly
  - Test instanceof checks work
  - Test toJSON method

- [ ] **3.10** Verify API error responses unchanged
  - Compare error outputs before/after
  - Ensure backward compatibility

- [ ] **3.11** Run full test suite to verify no regressions

**Expected Duration:** 3 days
**Risk Level:** Moderate
**Verification Criteria:**
- All error handling uses type-safe error classes instead of string matching
- Logging output is structured consistently for all error paths
- Error codes remain stable regardless of message changes
- Legacy error strings are maintained for API compatibility

---

## Phase 4: Global Metadata Cache

### Tasks

- [ ] **4.1** Define CachedMcpMetadata interface
  - Location: `src/gateway/registry.ts`
  - Properties: tools, prompts, resources, toolsSchema, version, timestamp

- [ ] **4.2** Add cache storage to Registry class
  - Property: `private cachedMcpMetadata: CachedMcpMetadata | null = null`
  - Property: `private readonly CACHE_TTL_MS = 30000`

- [ ] **4.3** Implement `getMcpMetadata` method
  - Check cache validity (TTL and existence)
  - Call `transformToMcp` if cache is stale
  - Return metadata with version number

- [ ] **4.4** Implement `transformToMcp` private method
  - Aggregate tools, prompts, resources from all servers
  - Generate tools schema
  - Set version and timestamp

- [ ] **4.5** Implement `invalidateCache` method
  - Set `cachedMcpMetadata` to null
  - Called on server capability changes

- [ ] **4.6** Implement cache TTL validation
  - Check timestamp against current time
  - Return stale if age exceeds TTL

- [ ] **4.7** Update GatewayServer to use shared cache
  - Remove per-instance metadata cache
  - Use `registry.getMcpMetadata()` instead

- [ ] **4.8** Add cache invalidation on server changes
  - Call `invalidateCache()` when server capabilities are modified
  - Identify all call sites that modify server state

- [ ] **4.9** Add unit tests for cache behavior
  - Test cache miss triggers transformation
  - Test cache hit returns cached data
  - Test TTL expiration
  - Test invalidation clears cache

- [ ] **4.10** Measure memory footprint reduction
  - Use memory profiling tools
  - Compare before/after under equivalent load
  - Target: 30% reduction

- [ ] **4.11** Run full test suite to verify no regressions

**Expected Duration:** 3 days
**Risk Level:** Moderate
**Verification Criteria:**
- Memory profiling shows 30% reduction in metadata storage across GatewayServer instances
- Cache invalidation occurs correctly on server capability changes
- Version numbers are returned and can be used for conditional updates
- TTL mechanism prevents stale cache data from being served indefinitely

---

## Phase 5: Registry Sync Optimization

### Tasks

- [ ] **5.1** Update syncServer method signature
  - Location: `src/gateway/registry.ts`
  - Add optional parameter: `capability?: "tools" | "prompts" | "resources"`

- [ ] **5.2** Implement targeted sync logic in syncServer
  - Switch on capability type
  - Call specific sync method or fallback to full sync

- [ ] **5.3** Ensure syncTools, syncPrompts, syncResources methods exist
  - Extract from existing full sync implementation
  - Each method syncs only that specific capability type

- [ ] **5.4** Implement fullSync private method
  - Calls all three specific sync methods in parallel
  - Used as fallback when capability is undefined

- [ ] **5.5** Update notification handler to pass capability
  - Location: `src/gateway/handlers/notification-handler.ts`
  - Extract capability type from notification
  - Pass to syncServer method

- [ ] **5.6** Update all other syncServer call sites
  - Find all locations that call syncServer
  - Update to pass capability parameter where available
  - Fallback to undefined for backward compatibility

- [ ] **5.7** Add error handling for invalid capability types
  - Validate capability parameter
  - Throw appropriate error or use fallback

- [ ] **5.8** Add unit tests for targeted sync
  - Test tools capability calls syncTools only
  - Test prompts capability calls syncPrompts only
  - Test resources capability calls syncResources only
  - Test undefined capability performs full sync

- [ ] **5.9** Verify network transfer reduction
  - Measure network traffic before/after
  - Target: 50% reduction for targeted sync

- [ ] **5.10** Run full test suite to verify no regressions

**Expected Duration:** 4 days
**Risk Level:** High (most complex)
**Verification Criteria:**
- Registry sync operations for specific capabilities transfer 50% less data than full sync operations
- All existing tests pass without modification
- Fallback path (full sync) is exercised only when capability is undefined
- Error handling for invalid capability types is implemented

---

## Validation and Measurement (Ongoing)

### After Each Phase

- [ ] Run full test suite to ensure no regressions
- [ ] Measure performance metrics before and after
- [ ] Verify targets are achieved
- [ ] Update documentation and implementation notes
- [ ] Document any issues encountered

### Final Validation

- [ ] All optimization targets met:
  - [ ] 50% reduction in registry sync network overhead
  - [ ] 30% reduction in per-session memory
  - [ ] 20% faster startup time
- [ ] All tests pass
- [ ] No breaking changes introduced
- [ ] Rollback procedures tested (optional)

---

## Rollback Procedures

Each optimization can be reverted individually:

### Connection Pooling Guard Rollback
1. Remove `pendingConnections` map from TransportPool
2. Revert getTransport to create new connection each time
3. Run tests to verify restoration

### Build Optimization Rollback
1. Revert package.json build scripts to use `--target node`
2. Remove `--minify` flag
3. Verify build works correctly

### Error Handling Rollback
1. Remove custom error classes
2. Restore string matching patterns
3. Verify error outputs match previous behavior

### Global Metadata Cache Rollback
1. Remove shared cache from Registry
2. Restore per-instance caching in GatewayServer
3. Monitor memory metrics to confirm rollback

### Registry Sync Rollback
1. Remove capability parameter from syncServer
2. Update call sites to not pass capability
3. Verify full sync behavior is restored

---

## Notes

- **Order Matters:** Implement in the specified order to minimize risk and establish patterns early
- **Test After Each Phase:** Don't skip testing between phases
- **Measure Before and After:** Capture metrics before starting each phase
- **Document Issues:** Record any problems for future optimization attempts
- **Maintain Compatibility:** All changes must preserve existing API behavior

---

**Tasks Created:** 2026-01-31
**Last Updated:** 2026-01-31
