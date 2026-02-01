# Optimization: Connection Pooling Guard

**Spec ID:** optimization-connection-guard
**Change:** mvp-release-optimization
**Status:** Draft
**Version:** 1.0.0

---

## Summary

Implement Promise-based concurrency guard to prevent duplicate connection attempts to the same MCP server during high-concurrency scenarios.

## Context

During high-concurrency scenarios (startup, recovery from failures), multiple concurrent requests may attempt to establish connections to the same MCP server. This "thundering herd" problem results in duplicate connection attempts, wasted network resources, and potential connection limit exhaustion on target servers.

## Design

### Current Behavior

```typescript
// Current: No coordination between concurrent connection attempts
async function getTransport(serverId: string): Promise<Transport> {
  const cached = this.cache.get(serverId);
  if (cached) return cached;
  // No check for pending connections
  return this.createConnection(serverId); // Creates new connection every time
}
```

### Proposed Behavior

```typescript
// Optimized: Promise-based pending connection deduplication
async function getTransport(serverId: string): Promise<Transport> {
  const cached = this.cache.get(serverId);
  if (cached) return cached;

  const pending = this.pendingConnections.get(serverId);
  if (pending) return pending; // Wait for existing connection attempt

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
```

### Implementation Details

- `pendingConnections` Map tracks in-flight connection attempts as Promises
- Concurrent requests for same server wait for single pending connection Promise
- Successful connections move from pending to cache
- Failed connections are cleaned up and errors propagated to all waiters
- Uses built-in Promise semantics (multiple awaiters share same result)

## Requirements

### Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR1 | getTransport must check for pending connections before creating new | MUST |
| FR2 | Concurrent requests for same server must receive same connection | MUST |
| FR3 | Failed connections must be cleaned up from pending map | MUST |
| FR4 | Connection errors must be propagated to all waiting requesters | MUST |
| FR5 | Successful connections must be cached for subsequent requests | MUST |

### Non-Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| NFR1 | Zero duplicate connections under concurrent load | MUST |
| NFR2 | No indefinite blocking on connection failures | MUST |
| NFR3 | Memory usage must not grow unbounded with connection attempts | MUST |
| NFR4 | Performance must not degrade for single concurrent request | MUST |

## When/Then Scenarios

### Scenario 1: Cached Connection Available

```gherkin
WHEN a transport request is received AND cached connection exists
THEN the cached transport must be returned immediately
AND no connection attempt must be initiated
```

### Scenario 2: Single Concurrent Request

```gherkin
WHEN a single transport request is received AND no cached or pending connection exists
THEN a new connection must be initiated
AND the pending connection must be tracked
AND the result must be returned when connection completes
```

### Scenario 3: Multiple Concurrent Requests Same Server

```gherkin
WHEN multiple concurrent requests for the same server are received AND no cached connection exists
THEN exactly one connection attempt must be initiated
AND all requests must wait for the same pending connection Promise
AND all requests must receive the established connection on completion
```

### Scenario 4: Connection Success

```gherkin
WHEN a connection attempt succeeds
THEN the pending entry must be removed from pendingConnections
AND the transport must be cached
AND all waiting requests must receive the transport
```

### Scenario 5: Connection Failure

```gherkin
WHEN a connection attempt fails
THEN the pending entry must be removed from pendingConnections
AND all waiting requests must receive the error
AND subsequent requests must initiate a new connection attempt
```

### Scenario 6: Rapid Sequential Requests

```gherkin
WHEN multiple requests arrive in rapid sequence for the same server
THEN the first request initiates connection
AND subsequent requests wait for the pending connection
AND all requests succeed with the cached connection
```

## API Surface

### Method Signature

```typescript
interface TransportPool {
  /**
   * Retrieves an established transport for the specified server, creating one if necessary.
   * Prevents duplicate connection attempts by tracking pending connections.
   *
   * @param serverId - The unique identifier of the server to connect to
   * @returns Promise resolving to an established Transport instance
   */
  getTransport(serverId: string): Promise<Transport>;

  /**
   * Clears all cached and pending connections.
   */
  clear(): void;
}

interface TransportPoolInternal {
  cache: Map<string, Transport>;
  pendingConnections: Map<string, Promise<Transport>>;
}
```

### Files to Modify

- `src/transport/pool.ts` - Add pendingConnections map and coordination logic
- Any other locations that manage transport connections

## Testing Strategy

### Unit Tests

- `getTransport with cached connection returns cached`
- `getTransport without cache creates new connection`
- `getTransport with pending connection waits for existing`
- `multiple concurrent requests result in single connection`
- `connection failure propagates error to all waiters`
- `cleanup occurs on both success and failure`

### Integration Tests

- High-concurrency load test verifies single connection
- Connection failure scenario test
- Rapid sequential request test
- Multiple different servers test (isolation)

### Performance Tests

- No performance regression for single request
- Reduced resource usage under concurrent load
- Connection count verification under load

## Metrics and Validation

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Duplicate connections under concurrent load | 0 | Connection count monitoring |
| Request latency under concurrent load | No regression | Performance benchmarking |
| Connection attempts per server under load | 1 per server per concurrency window | Connection count monitoring |
| Error propagation latency | <100ms | Performance benchmarking |

## Rollback Plan

1. Remove pendingConnections tracking from getTransport
2. Restore previous behavior of independent connection attempts
3. Run full test suite to verify restoration
4. Monitor connection metrics to confirm rollback success

## Dependencies

- None (this optimization is self-contained)

## Open Questions

None at this time.

---

**Spec Created:** 2026-01-31
**Last Updated:** 2026-01-31
