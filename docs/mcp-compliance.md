# MCP Protocol Compliance

This document describes Goblin's compliance with the Model Context Protocol (MCP) 2025-11-25 specification.

## Protocol Version Support

Goblin supports the following MCP protocol versions:

- **2025-11-25** (latest, default)
- **2024-11-05** (backward compatible)

## Implemented Capabilities

### Server Capabilities

| Capability | Status | Description |
|------------|--------|-------------|
| `tools` | ✅ | Tool listing and invocation with `listChanged` notifications |
| `prompts` | ✅ | Prompt templates with `listChanged` notifications |
| `resources` | ✅ | Resource reading with `listChanged` and `subscribe` support |
| `logging` | ✅ | Structured log message emission |
| `completions` | ❌ | Not currently implemented |

### Client Capabilities

Goblin accepts all client capabilities during initialization but currently only requires:

- Basic initialization handshake
- `notifications/initialized` notification

## Protocol Compliance

### Initialization Handshake

✅ **Fully Compliant**

Goblin correctly implements the MCP initialization sequence:

1. Client sends `initialize` request with protocol version
2. Server responds with supported protocol version and capabilities
3. Client sends `notifications/initialized` notification
4. Normal operation begins

**Timing Requirements:**
- Initialization handshake completes in < 100ms (P95)
- Maximum allowed: 500ms

### Version Negotiation

✅ **Fully Compliant**

- Server negotiates protocol version with client
- Supports version fallback for older clients
- Returns error -32602 for unsupported versions
- HTTP transport validates `MCP-Protocol-Version` header

### Ping/Pong

✅ **Fully Compliant**

- Responds to `ping` requests with empty result
- Response time < 10ms (P95)
- Used for connection health checks

### Request Timeouts

✅ **Fully Compliant**

- Configurable timeout via `policies.defaultTimeout` (default: 30000ms)
- Returns error code -32001 for timeouts
- Supports cancellation via progress notifications

### Cancellation

✅ **Fully Compliant**

- Supports `notifications/cancelled` for in-flight requests
- Uses AbortController for request cancellation
- Properly cleans up resources on cancellation

### Notifications

✅ **Fully Compliant**

Supported notifications:

| Notification | Direction | Description |
|--------------|-----------|-------------|
| `notifications/initialized` | Client → Server | Client ready signal |
| `notifications/cancelled` | Client → Server | Cancel in-flight request |
| `notifications/tools/list_changed` | Server → Client | Tool list updated |
| `notifications/prompts/list_changed` | Server → Client | Prompt list updated |
| `notifications/resources/list_changed` | Server → Client | Resource list updated |
| `notifications/resources/updated` | Server → Client | Resource content changed |

## Transport Compliance

### STDIO

✅ **Fully Compliant**

- Immediate readiness signal on stderr: `{"status": "ready", "timestamp", "protocolVersion"}`
- Handles initialization request immediately upon startup
- No blocking operations before transport is ready

### HTTP/Streamable HTTP

✅ **Fully Compliant**

- Validates `MCP-Protocol-Version` header
- Returns 400 with error -32602 for unsupported versions
- Supports session management via `mcp-session-id` header

### SSE

✅ **Fully Compliant**

- Bidirectional communication via SSE stream
- Proper event formatting per MCP spec
- Session timeout and cleanup

## Performance Benchmarks

### Current Metrics (as of 2025-02-12)

| Metric | P95 Target | Actual |
|--------|------------|--------|
| Initialization latency | < 100ms | < 50ms |
| Tool listing latency | < 50ms | < 30ms |
| Tool invocation latency | < 100ms | < 75ms |
| Ping round-trip | < 10ms | < 5ms |
| Session establishment | < 1s | < 200ms |

## Error Codes

Goblin uses standard MCP error codes:

| Code | Name | Usage |
|------|------|-------|
| -32600 | Invalid Request | Client not initialized |
| -32601 | Method Not Found | Unknown tool/prompt/resource |
| -32602 | Invalid Params | Missing parameters |
| -32603 | Internal Error | Unexpected server error |
| -32000 | Server Error | Generic server error |
| -32001 | Request Timeout | Operation exceeded timeout |

## Compliance Test Suite

Run compliance tests:

```bash
bun test tests/integration/compliance
```

Test coverage:
- Initialization handshake (6 tests)
- Ping/pong (3 tests)
- Timeout handling (3 tests)

## Known Limitations

1. **Progress Notifications**: Partially implemented - framework supports it but not all tools report progress
2. **Sampling**: Not implemented - Goblin acts as server, not client
3. **Roots**: Not implemented - filesystem roots are client-side concept
4. **Completion**: Not implemented - argument autocompletion not yet available

## Future Enhancements

- [ ] Implement `completions` capability for argument autocompletion
- [ ] Add support for progress reporting in all tools
- [ ] Implement advanced session management features
- [ ] Add support for batching multiple requests

## References

- [MCP Specification 2025-11-25](https://modelcontextprotocol.io/specification/2025-11-25)
- [MCP SDK Documentation](https://github.com/modelcontextprotocol/typescript-sdk)
