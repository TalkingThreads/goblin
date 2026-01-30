# Change: Add Transport Layer

## Why

Goblin needs a robust transport layer to connect to backend MCP servers via different protocols (STDIO, HTTP/SSE). This layer abstracts the connection details and manages the lifecycle of `Client` instances from the MCP SDK.

## What Changes

- Define `Transport` interface for uniform connection management
- Implement `StdioTransport` using `@modelcontextprotocol/sdk/client/stdio`
- Implement `HttpTransport` using `@modelcontextprotocol/sdk/client/sse` (or streamableHttp)
- Implement `TransportPool` for reusing connections
- Add health checks and error handling for connections

## Impact

- **Affected specs**: New capability `transport`
- **Affected code**:
  - `src/transport/interface.ts`
  - `src/transport/stdio.ts`
  - `src/transport/http.ts`
  - `src/transport/pool.ts`
  - `src/transport/index.ts`
