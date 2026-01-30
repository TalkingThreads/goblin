## 1. Interface
- [x] 1.1 Define `Transport` interface in `src/transport/interface.ts`
- [x] 1.2 Define `TransportState` enum (disconnected, connecting, connected, error)
- [x] 1.3 Define `TransportEvents` interface (error, close)

## 2. STDIO Transport
- [x] 2.1 Implement `StdioTransport` class in `src/transport/stdio.ts`
- [x] 2.2 Use `StdioClientTransport` from SDK
- [x] 2.3 Implement process spawning and lifecycle management
- [x] 2.4 Add error handling for process crashes

## 3. HTTP Transport
- [x] 3.1 Implement `HttpTransport` class in `src/transport/http.ts`
- [x] 3.2 Use `SSEClientTransport` (or StreamableHTTP) from SDK
- [x] 3.3 Implement URL parsing and connection setup
- [x] 3.4 Add reconnection logic support

## 4. Connection Pool
- [x] 4.1 Implement `TransportPool` class in `src/transport/pool.ts`
- [x] 4.2 Map server IDs to transport instances
- [x] 4.3 Implement `getTransport(serverId)` and `releaseTransport(serverId)`
- [x] 4.4 Add health check capability

## 5. Integration
- [x] 5.1 Create `src/transport/index.ts` barrel export
- [x] 5.2 Add unit tests for transports (mocking SDK)
- [x] 5.3 Add integration tests with dummy MCP servers
