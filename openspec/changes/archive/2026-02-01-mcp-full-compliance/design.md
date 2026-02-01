## Context

Goblin is an MCP gateway that aggregates multiple backend MCP servers behind a single unified endpoint. The current implementation handles core MCP primitives (tools, prompts, resources) but lacks several advanced protocol features required for full compliance. This design covers the implementation of these missing features to achieve full MCP protocol compatibility.

**Current State:**
- GatewayServer implements tools/prompts/resources list, get/call/read operations
- Registry aggregates capabilities from backend servers with namespacing
- Router routes requests to appropriate backends with caching
- Transport layer supports HTTP/SSE for client connections
- Notification forwarding for list_changed events exists

**Missing Features:**
- Resource subscriptions (subscribe/unsubscribe/updated)
- Sampling (createMessage requests from servers)
- Elicitation (requestInput for user input)
- Parameter completion (completion/complete)
- Roots management (list/list_changed)
- Server logging (notifications/message)
- Explicit version negotiation

**Constraints:**
- Must maintain transparent proxy behavior
- Cannot break existing functionality
- Must integrate with existing registry/router patterns
- Must scale with multiple clients and backends
- Must handle subscription lifecycle properly

**Stakeholders:**
- Developers using Goblin as MCP gateway
- MCP server developers expecting full protocol support
- AI agents using sampling and elicitation features
- End users interacting with elicitation prompts

## Goals / Non-Goals

**Goals:**
- Enable resource subscriptions for reactive resource monitoring
- Support sampling requests from backend servers to clients
- Implement elicitation for user input requests
- Add parameter completion for better developer experience
- Support roots management for filesystem boundaries
- Route server logs to clients for observability
- Implement explicit version negotiation for compatibility
- Maintain transparent gateway behavior throughout

**Non-Goals:**
- No local LLM integration (sampling routes to clients only)
- No file system access beyond configured roots
- No interactive CLI for elicitation (handled by clients)
- No persistent subscription storage (in-memory only)
- No advanced sampling policies (pass-through from clients)
- No UI for any new features (TUI handles discovery)

## Decisions

### Decision 1: Subscription Tracking Architecture

**Choice:** Centralized subscription registry in GatewayServer with per-client subscription sets

**Rationale:**
- Subscriptions are client-specific and must be cleaned up on disconnect
- Gateway needs to route notifications to correct clients
- Registry already handles capability aggregation - keep subscriptions separate to avoid complexity
- In-memory storage is sufficient for MVP (subscriptions transient)

**Implementation:**
```typescript
interface Subscription {
  clientId: string;
  uri: string;
  serverId: string;
  subscribedAt: Date;
}

class SubscriptionManager {
  private subscriptions = new Map<string, Set<string>>(); // uri -> Set<clientId>
  private clientSubscriptions = new Map<string, Set<string>>(); // clientId -> Set<uri>

  subscribe(clientId: string, uri: string, serverId: string): void {
    // Add to both indices
    // Validate URI exists before subscribing
  }

  unsubscribe(clientId: string, uri: string): void {
    // Remove from both indices
  }

  getSubscribers(uri: string): string[] {
    // Return all client IDs subscribed to this URI
  }

  getClientSubscriptions(clientId: string): string[] {
    // Return all URIs this client is subscribed to
  }

  cleanupClient(clientId: string): void {
    // Remove all subscriptions for disconnected client
  }
}
```

**Alternatives Considered:**
- Distributed subscription tracking (too complex)
- Per-server subscription tracking (doesn't handle client routing)

### Decision 2: Sampling Request Routing

**Choice:** Transparent proxy with client-side policy enforcement

**Rationale:**
- Gateway should not interpret or modify sampling requests
- Client has policy control over sampling (rates, models, etc.)
- Keep gateway logic simple - just route requests/responses
- SDK handles most sampling complexity

**Implementation:**
```typescript
// GatewayServer sampling handler
this.server.setRequestHandler(CreateMessageRequestSchema, async (request) => {
  const { requestId, ...params } = request.params;

  // Route to appropriate client (round-robin or policy-based)
  const client = this.selectClientForSampling();

  // Forward request with original requestId
  const response = await client.createMessage(params, { requestId });

  // Return response directly ( Gateway doesn't modify)
  return response;
});
```

**Alternatives Considered:**
- Gateway-managed sampling queue (adds complexity, delays)
- Local sampling fallback (outside scope)

### Decision 3: Elicitation Flow

**Choice:** Proxy with request tracking and timeout handling

**Rationale:**
- Elicitation is blocking - client must respond before server continues
- Gateway must track pending elicitation requests
- Timeouts are essential to prevent hanging
- Cancellation support needed for disconnects

**Implementation:**
```typescript
interface PendingElicitation {
  requestId: string;
  clientId: string;
  serverId: string;
  prompt: string;
  requestedAt: Date;
  timeoutMs: number;
}

class ElicitationManager {
  private pending = new Map<string, PendingElicitation>();

  async requestInput(
    clientId: string,
    serverId: string,
    prompt: string,
    timeoutMs: number = 30000
  ): Promise<ElicitationResponse> {
    const requestId = generateRequestId();

    this.pending.set(requestId, {
      requestId,
      clientId,
      serverId,
      prompt,
      requestedAt: new Date(),
      timeoutMs,
    });

    try {
      return await this.waitForResponse(requestId, timeoutMs);
    } finally {
      this.pending.delete(requestId);
    }
  }

  resolve(requestId: string, response: ElicitationResponse): void {
    // Wake waiting elicitation
  }

  reject(requestId: string, error: string): void {
    // Handle error/timeout
  }
}
```

**Alternatives Considered:**
- Store-and-forward elicitation (too complex, ordering issues)
- Direct client-server elicitation (bypasses gateway, defeats purpose)

### Decision 4: Parameter Completion Routing

**Choice:** Aggregate completions from all backend servers

**Rationale:**
- Multiple servers may provide completions for same argument
- Gateway should collect and merge results
- Simple prefix matching is sufficient for MVP
- Can add fuzzy matching later

**Implementation:**
```typescript
// completion/complete handler
this.server.setRequestHandler(CompleteRequestSchema, async (request) => {
  const { ref, argument, value } = request.params;
  const completions: Completion[] = [];

  // Collect from all servers that might have matching tools
  for (const [serverId, client] of this.activeClients) {
    try {
      const result = await client.complete({
        ref,
        argument,
        value,
      });
      completions.push(...result.completions);
    } catch {
      // Server doesn't support completion or error - skip
    }
  }

  // Deduplicate and return
  return { completions: dedupe(completions) };
});
```

**Alternatives Considered:**
- Cached completions (stale data risk)
- Per-server completion routing (client needs to know which server)

### Decision 5: Roots Management

**Choice:** Client-provided roots with gateway propagation to backends

**Rationale:**
- Roots are client-specific (each client may have different filesystem access)
- Gateway collects roots from connecting clients
- Propagates relevant roots to backends
- Backends respect root boundaries when providing resources

**Implementation:**
```typescript
interface Root {
  uri: string;
  name?: string;
  capabilities?: RootCapabilities;
}

class RootsManager {
  private clientRoots = new Map<string, Root[]>(); // clientId -> roots

  async handleListRoots(clientId: string): Promise<{ roots: Root[] }> {
    // Return configured roots for this client
    return { roots: this.clientRoots.get(clientId) || [] };
  }

  async propagateRootsToServer(serverId: string, clientId: string): Promise<void> {
    const client = this.getClient(clientId);
    const roots = this.clientRoots.get(clientId) || [];

    // Notify server of roots via notification or during capability negotiation
    await client.notification({
      method: "notifications/roots/list_changed",
      params: { roots },
    });
  }
}
```

**Alternatives Considered:**
- Static root configuration (doesn't account for client differences)
- Per-server root filtering (complex, error-prone)

### Decision 6: Server Logging Proxy

**Choice:** Level-aware log routing with filtering

**Rationale:**
- Servers send logs at various levels (debug, info, warning, error)
- Gateway should route logs to interested clients
- Clients may want to filter log levels
- Minimal transformation - preserve log structure

**Implementation:**
```typescript
// notifications/message handler from backends
client.setNotificationHandler(MessageNotificationSchema, async (notification) => {
  const { level, data, logger: loggerName } = notification.params;

  // Route to all connected clients that want logs
  for (const [clientId, clientLogLevel] of this.logSubscribers) {
    if (shouldRouteLog(level, clientLogLevel)) {
      await this.notifyClient(clientId, {
        method: "notifications/message",
        params: { level, data, logger: loggerName },
      });
    }
  }
});
```

**Alternatives Considered:**
- Log aggregation and storage (outside scope)
- Log filtering at gateway (adds latency, complexity)

### Decision 7: Version Negotiation

**Choice:** SDK-based with explicit version tracking

**Rationale:**
- MCP SDK handles most version negotiation automatically
- Gateway should track supported versions explicitly
- Document version compatibility in error messages
- Graceful degradation when versions mismatch

**Implementation:**
```typescript
const SUPPORTED_VERSIONS = ["2025-11-05", "2025-11-25"];

function negotiateVersion(clientVersion: string): string {
  if (SUPPORTED_VERSIONS.includes(clientVersion)) {
    return clientVersion;
  }

  // Find closest compatible version or use oldest supported
  const compatible = findCompatibleVersion(clientVersion, SUPPORTED_VERSIONS);
  if (compatible) {
    logger.warn({ clientVersion, using: compatible }, "Version mismatch, using compatible");
    return compatible;
  }

  throw new McpError(
    ErrorCode.InvalidRequest,
    `Unsupported protocol version: ${clientVersion}. Supported: ${SUPPORTED_VERSIONS.join(", ")}`
  );
}
```

**Alternatives Considered:**
- Dynamic version discovery (complex, unnecessary)
- Multiple protocol versions simultaneously (overkill)

## Risks / Trade-offs

### [Risk] Subscription Memory Leak
**→ Mitigation:** Track subscriptions per client connection. Clean up on disconnect. Add max subscriptions per client limit.

### [Risk] Elicitation Timeout Handling
**→ Mitigation:** Implement timeout on all elicitation requests. Reject with clear error if client doesn't respond. Track pending elicitations to prevent accumulation.

### [Risk] Sampling Loop Detection
**→ Mitigation:** Clients are responsible for loop detection in sampling policies. Gateway doesn't track sampling chains (complexity vs correctness tradeoff).

### [Risk] Log Message Flooding
**→ Mitigation:** Clients can filter log levels. Add rate limiting per client if needed. Log sampling for high-volume servers.

### [Risk] Root Propagation Latency
**→ Mitigation:** Propagate roots immediately on client connection. Cache roots for reconnection. Backends should handle missing roots gracefully.

### [Risk] Completion Performance
**→ Mitigation:** Timeout completion requests after reasonable period. Parallelize requests to multiple backends. Cache completions with short TTL.

### [Risk] Version Compatibility Gaps
**→ Mitigation:** Test with multiple SDK versions. Document supported versions clearly. Add integration tests for version negotiation.

## Migration Plan

### Phase 1: Critical Gaps (Weeks 1-3)

1. Enable resource subscription capability in GatewayServer
2. Implement SubscriptionManager
3. Add subscribe/unsubscribe handlers
4. Route notifications/resources/updated
5. Test subscription lifecycle

### Phase 2: Enhanced Features (Weeks 4-6)

1. Implement sampling handler and routing
2. Implement elicitation manager and handlers
3. Add completion handler with aggregation
4. Implement roots manager and handlers
5. Add logging notification handler

### Phase 3: Versioning (Week 7)

1. Document supported versions
2. Add explicit version checks
3. Add graceful degradation
4. Test version negotiation

### Rollback Strategy

Each feature can be disabled independently via capability flags:
- subscriptions: `gateway.capabilities.resources.subscribe = false`
- sampling: `gateway.capabilities.sampling = false`
- elicitation: `gateway.capabilities.elicitation = false`
- completion: `gateway.capabilities.completion = false`
- roots: `gateway.capabilities.roots = false`
- logging: `gateway.capabilities.logging = false`

If issues arise, disable affected capability to restore previous behavior.

## Open Questions

1. **Should elicitation support multiple response options?** (Currently supports single response - would need design for multiple choice)

2. **Should subscription wildcard matching be supported?** (e.g., subscribe to `file:///docs/**` - requires template matching logic)

3. **Should roots be configurable at gateway level?** (Currently client-provided only - may need server-configured defaults)

4. **Should sampling include budget/limit enforcement?** (Currently pass-through - policy enforcement is client responsibility)

5. **Should completion support fuzzy matching?** (Currently exact prefix matching - fuzzy would improve DX but add complexity)

## Implementation Pattern

```
┌─────────────────────────────────────────────────────────────────┐
│              MCP COMPLIANCE IMPLEMENTATION                       │
└─────────────────────────────────────────────────────────────────┘

  Backend Servers                          Goblin Gateway
        │                                        │
        │  1. Subscribe to resource             │
        │ ─────────────────────────────────────►│
        │  2. Track subscription              │
        │     (SubscriptionManager)            │
        │                                        │
        │  3. Resource changes               │
        │ ◄────────────────────────────────────│
        │  4. Forward notification            │
        │     to subscribed clients           │
        │                                        │
        │  5. Sampling request               │
        │ ◄────────────────────────────────────│
        │  6. Route to client                │
        │     (SamplingManager)               │
        │ ─────────────────────────────────────►│
        │  7. Client responds                │
        │ ◄────────────────────────────────────│
        │  8. Forward response               │
        │     to requesting server            │
        │                                        │
        │  9. Elicitation request           │
        │ ◄────────────────────────────────────│
        │ 10. Route to client               │
        │     (ElicitationManager)           │
        │ 11. Client provides input         │
        │ ◄────────────────────────────────────│
        │ 12. Forward response              │
        │     to requesting server           │
        │                                        │
        │  13. Client provides roots        │
        │ ◄────────────────────────────────────│
        │  14. Propagate to backends        │
        │     (RootsManager)                 │
        │ ─────────────────────────────────────►│
        │  15. Server sends logs           │
        │ ◄────────────────────────────────────│
        │  16. Route to clients           │
        │     (LoggingManager)              │
```

This follows the same transparent proxy pattern as existing tool/prompt/resource aggregation.
