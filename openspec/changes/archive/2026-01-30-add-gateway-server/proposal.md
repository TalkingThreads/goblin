# Change: Add Gateway Server

## Why

To function as an MCP gateway, Goblin must expose an MCP server interface to downstream clients (like Claude Desktop). This server aggregates tools from multiple backends and presents them as a unified catalog.

## What Changes

- Implement `GatewayServer` class wrapping the SDK `Server`
- Implement dynamic `tools/list` handler backed by `Registry`
- Implement dynamic `tools/call` handler backed by `Router`
- Support connecting transports (preparation for HTTP layer)

## Impact

- **Affected specs**: `gateway` capability
- **Affected code**:
  - `src/gateway/server.ts`
  - `src/gateway/index.ts`
