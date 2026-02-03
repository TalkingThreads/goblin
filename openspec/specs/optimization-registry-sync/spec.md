# Optimization: Targeted Registry Synchronization

**Spec ID:** optimization-registry-sync
**Change:** mvp-release-optimization
**Status:** Draft
**Version:** 1.0.0

---

## Summary

Optimize registry synchronization to fetch only changed capabilities instead of performing full sync on every notification, reducing network overhead by 50%.

## Context

Currently, the registry performs full synchronization on every change notification from MCP servers, transferring all capability data regardless of what changed. Change notifications indicate which capability was modified (tools, prompts, or resources), enabling targeted sync operations.

## Design

### Current Behavior

```typescript
// Current: Full sync on every notification
async function handleServerChange(serverId: string, notification: ChangeNotification): Promise<void> {
  await registry.syncServer(serverId); // Always fetches all capabilities
}
```

### Proposed Behavior

```typescript
// Optimized: Targeted sync based on notification type
async function handleServerChange(serverId: string, notification: ChangeNotification): Promise<void> {
  const capability = notification.capability; // "tools" | "prompts" | "resources" | undefined
  await registry.syncServer(serverId, capability);
}
```

### Implementation Details

The `syncServer` method accepts an optional capability parameter:
- When capability is provided, fetches only that specific capability type
- When capability is undefined, performs full sync as fallback
- Backward compatible with existing notification sources

## Requirements

### Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR1 | Registry must accept optional capability parameter in syncServer method | MUST |
| FR2 | When capability is specified, only that capability type must be synced | MUST |
| FR3 | When capability is undefined, full sync must be performed (backward compatibility) | MUST |
| FR4 | Error handling for invalid capability types must be implemented | MUST |
| FR5 | Sync operations must complete before returning success | MUST |

### Non-Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| NFR1 | Network overhead reduction of 50% for targeted sync operations | SHOULD |
| NFR2 | Performance must not degrade for fallback full sync operations | MUST |
| NFR3 | Error messages must remain consistent with current behavior | MUST |

## When/Then Scenarios

### Scenario 1: Tool Change Notification

```gherkin
WHEN a tool change notification is received
THEN only the tools capability must be synchronized
AND network transfer must be limited to tool data
AND prompts and resources must not be fetched
```

### Scenario 2: Prompt Change Notification

```gherkin
WHEN a prompt change notification is received
THEN only the prompts capability must be synchronized
AND network transfer must be limited to prompt data
AND tools and resources must not be fetched
```

### Scenario 3: Resource Change Notification

```gherkin
WHEN a resource change notification is received
THEN only the resources capability must be synchronized
AND network transfer must be limited to resource data
AND tools and prompts must not be fetched
```

### Scenario 4: Legacy Notification Without Capability

```gherkin
WHEN a legacy notification without capability type is received
THEN a full synchronization must be performed
AND all capabilities (tools, prompts, resources) must be fetched
AND behavior must match current implementation
```

### Scenario 5: Invalid Capability Type

```gherkin
WHEN a notification with an invalid capability type is received
THEN an appropriate error must be logged
AND the operation must fail safely without corrupting state
```

## API Surface

### Method Signature

```typescript
interface Registry {
  /**
   * Synchronizes a server's capabilities, fetching only the specified capability type
   * if provided, or performing a full sync as fallback.
   *
   * @param serverId - The unique identifier of the server to synchronize
   * @param capability - Optional capability type to sync; if undefined, performs full sync
   * @returns Promise resolving when synchronization completes
   */
  syncServer(serverId: string, capability?: "tools" | "prompts" | "resources"): Promise<void>;
}
```

### Call Sites to Update

- `src/gateway/handlers/notification-handler.ts` - Update to pass capability from notification
- `src/gateway/server.ts` - Update sync calls to include capability parameter
- Any other locations that call `registry.syncServer()`

## Testing Strategy

### Unit Tests

- `syncServer with tools capability calls syncTools only`
- `syncServer with prompts capability calls syncPrompts only`
- `syncServer with resources capability calls syncResources only`
- `syncServer without capability performs full sync`
- `syncServer with invalid capability throws appropriate error`

### Integration Tests

- Verify network transfer is reduced for targeted sync
- Verify backward compatibility with legacy notifications
- Verify cache invalidation works correctly after targeted sync

## Metrics and Validation

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Network bytes per sync operation | 50% reduction for targeted sync | Network traffic analysis |
| Sync operation latency | No regression for targeted sync | Performance benchmarking |
| Test coverage | 100% for affected code | Code coverage report |

## Rollback Plan

1. Revert `syncServer` method to not accept capability parameter
2. Update all call sites to not pass capability
3. Run full test suite to verify restoration of previous behavior
4. Monitor network metrics to confirm rollback success

## Dependencies

- None (this optimization is self-contained)

## Open Questions

None at this time.

---

**Spec Created:** 2026-01-31
**Last Updated:** 2026-01-31
