# Integration Tests

Integration tests verify that multiple components work correctly together.

## Structure

```
tests/integration/
├── api/              # API endpoint tests
├── compliance/        # MCP protocol compliance tests
├── e2e/              # End-to-end protocol tests
├── everything-server/ # Full server integration tests
├── handshake/         # Connection handshake tests
├── hot-reload/        # Configuration hot-reload tests
├── multi-server/      # Multi-server interaction tests
├── resources/         # Resource handling tests
├── transport/         # Transport protocol tests
└── virtual-tools/     # Virtual tools tests
```

## Running

```bash
# Run all integration tests
bun test tests/integration/

# Run specific category
bun test tests/integration/transport/
bun test tests/integration/multi-server/

# Single file
bun test tests/integration/transport/http.test.ts
```

## Test Utilities

### Shared Utilities

Located in `tests/shared/`:

- `environment.ts` - Test environment setup
- `test-server.ts` - Mock MCP server for testing

### Smoke Test Helpers

Located in `tests/smoke/shared/`:

- `test-config.ts` - Test configuration utilities
- `test-process.ts` - Process spawning helpers

## Patterns

### Test Server Setup

```typescript
import { createTestServer } from "../shared/test-server";

test("integration scenario", async () => {
  const server = await createTestServer({
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-filesystem", "/tmp"],
  });

  await server.start();
  // Test logic...
  await server.stop();
});
```

### Client Testing

```typescript
import { createClient } from "../shared/test-client";

test("client-server interaction", async () => {
  const client = await createClient("http://localhost:3000/mcp");
  
  const result = await client.request("tools/list", {});
  expect(result.tools).toBeDefined();
});
```

## Best Practices

1. **Real Components**: Use real transport, not mocks
2. **Cleanup**: Always stop servers/processes in teardown
3. **Unique Ports**: Use dynamic port allocation to avoid conflicts
4. **Timeout Handling**: Account for server startup time
5. **Error Context**: Log helpful errors when tests fail
