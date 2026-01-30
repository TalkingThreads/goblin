# Change: Add Tool Router

## Why

Goblin needs a routing layer to direct incoming tool execution requests to the appropriate backend server. The Router acts as the traffic controller, resolving namespaced tool names to specific backend clients and enforcing execution policies like timeouts.

## What Changes

- Implement `Router` class for request forwarding
- Implement routing logic: `namespaced_name` → `backend_server` + `original_name`
- Add timeout enforcement for tool calls
- Integrate with `Registry` for lookup and `TransportPool` for execution

## Impact

- **Affected specs**: `gateway` capability
- **Affected code**:
  - `src/gateway/router.ts`
  - `src/index.ts` (integration)
