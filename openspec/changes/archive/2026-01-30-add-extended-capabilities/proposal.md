# Change: Add Extended Capabilities (Prompts & Resources)

## Why

To act as a fully transparent gateway, Goblin must aggregate not just Tools, but also Prompts and Resources from backend servers. This allows clients (like Claude) to access prompts and resources distributed across multiple backends through a single connection.

## What Changes

- Update `Registry` to support syncing and storing `Prompts` and `Resources`.
- Update `GatewayServer` to handle `prompts/list`, `prompts/get`, `resources/list`, `resources/read`, and `resources/templates/list`.
- Implement aggregation logic (namespacing prompts/resources by server ID).
- Update capabilities advertisement.

## Impact

- **Affected specs**: `gateway`, `registry`
- **Affected code**:
  - `src/gateway/types.ts`
  - `src/gateway/registry.ts`
  - `src/gateway/server.ts`
