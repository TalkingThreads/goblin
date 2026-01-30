# Change: Add HTTP Server (Hono)

## Why

To support remote MCP clients (like Claude Desktop via SSE), Goblin needs an HTTP server. Hono is chosen for its performance, standards compliance, and ecosystem.

## What Changes

- Implement `HttpGateway` class using Hono
- Implement `/sse` endpoint for client connections
- Implement `/messages` endpoint for client requests
- Implement `HonoTransportAdapter` to bridge Hono SSE to MCP SDK
- Implement session management (mapping sessionId -> transport)
- Integrate with `GatewayServer` factory pattern (one server per connection)

## Impact

- **Affected specs**: `gateway` capability
- **Affected code**:
  - `src/gateway/http.ts` (New)
  - `src/transport/hono-adapter.ts` (New)
  - `src/index.ts` (Integration)
