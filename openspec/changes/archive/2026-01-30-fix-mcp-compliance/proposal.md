# Change: Fix MCP Compliance

## Why

Verification against the MCP standard revealed compliance gaps in the current implementation:
1. **False Advertising**: `GatewayServer` declares `prompts` and `resources` capabilities but does not implement them. This violates the spec and causes client errors.
2. **Stale Data**: `Registry` does not listen for `notifications/tools/list_changed` from backends, meaning the gateway's tool list becomes stale if a backend adds/removes tools dynamically.
3. **Missing Notifications**: `GatewayServer` does not send `notifications/tools/list_changed` to clients when the registry updates.

## What Changes

- Update `GatewayServer` to remove unimplemented capabilities.
- Implement `Registry` logic to listen for backend notifications and re-sync.
- Implement `GatewayServer` logic to broadcast notifications to connected clients.
- Add `Registry.updateServer()` method.

## Impact

- **Affected specs**: `gateway`, `registry`
- **Affected code**:
  - `src/gateway/server.ts`
  - `src/gateway/registry.ts`
  - `src/gateway/types.ts`
