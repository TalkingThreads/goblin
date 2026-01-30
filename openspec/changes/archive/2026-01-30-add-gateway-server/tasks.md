## 1. Gateway Server
- [x] 1.1 Implement `GatewayServer` class in `src/gateway/server.ts`
- [x] 1.2 Initialize low-level SDK `Server` with capabilities
- [x] 1.3 Register `ListToolsRequestSchema` handler to use `Registry.listTools()`
- [x] 1.4 Register `CallToolRequestSchema` handler to use `Router.callTool()`
- [x] 1.5 Add error handling for routing failures (map to `McpError`)

## 2. Integration
- [x] 2.1 Export `GatewayServer` from `src/gateway/index.ts`
- [x] 2.2 Update `src/index.ts` to initialize `GatewayServer` (placeholder for transport)

## 3. Testing
- [x] 3.1 Add unit tests for `tools/list` handling
- [x] 3.2 Add unit tests for `tools/call` handling
- [x] 3.3 Verify error mapping
