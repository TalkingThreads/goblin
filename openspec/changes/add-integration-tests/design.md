# Integration Tests Design Document

## Context

Goblin currently lacks comprehensive integration tests that validate the complete MCP protocol flow end-to-end. While unit tests cover individual components, integration tests are essential for validating:
- Full MCP handshake and capability negotiation between clients, gateway, and backends
- Multi-server aggregation with 2+ backend servers working simultaneously
- Transport layer resilience under failure conditions
- Hot reload behavior when configuration changes during active connections
- Complex virtual tool workflows executing in parallel
- Resource management through the gateway with real file/resource access

Current state: Only basic example tests exist without systematic end-to-end validation.

Constraints: Tests must use real MCP client/server connections (not mocked at protocol level), use Bun test framework, run in reasonable time (< 5 minutes per suite), and be isolated for parallel execution.

## Goals / Non-Goals

**Goals:**
- Validate complete MCP handshake flow (initialize, capabilities, result)
- Verify end-to-end request/response through gateway with real servers
- Test multi-server aggregation (load balancing, failover, tool routing)
- Verify transport resilience (retry logic, circuit breaking, reconnection)
- Validate hot reload during active connections
- Test complex virtual tool workflows with parallelism
- Verify resource management (file access, caching, streaming)

**Non-Goals:**
- Unit tests (handled separately)
- Performance/load testing (separate test suite)
- Security penetration testing (separate security tests)
- UI/CLI testing (handled by TUI integration tests)

## Decisions

### Decision 1: Test Architecture

**Choice:** Real MCP connections with embedded test servers

**Rationale:**
- Tests actual protocol behavior, not mocked responses
- Embedded servers are easier to manage than external fixtures
- Full protocol stack validation including edge cases
- Tests can run in CI without external dependencies

**Implementation:**
```typescript
// tests/integration/shared/test-server.ts
class TestMcpServer {
  private server: Server;
  private connection: ServerSession;
  
  async start(): Promise<void> {
    this.server = new Server({ name: "test-server" });
    // Register test tools/resources
    await this.server.connect(stdioTransport);
  }
  
  async stop(): Promise<void> {
    await this.server.close();
  }
}

// tests/integration/handshake/handshake.test.ts
describe("MCP Handshake", () => {
  let gateway: TestGateway;
  let backendServer: TestMcpServer;
  
  beforeEach(async () => {
    backendServer = new TestMcpServer();
    await backendServer.start();
    gateway = new TestGateway({ backends: [backendServer] });
    await gateway.start();
  });
  
  afterEach(async () => {
    await gateway.stop();
    await backendServer.stop();
  });
  
  it("completes full handshake", async () => {
    const client = new Client({ name: "test-client" });
    await client.connect(gatewayTransport);
    const result = await client.initialize();
    expect(result.protocolVersion).toEqual("2025-11-05");
    expect(result.capabilities).toBeDefined();
  });
});
```

### Decision 2: Test Server Fixtures

**Choice:** Modular test server fixtures with configurable capabilities

**Rationale:**
- Reusable across test suites
- Easy to configure different capability combinations
- Supports testing edge cases (slow servers, error servers)

**Implementation:**
```typescript
// tests/shared/fixtures/test-servers.ts
interface TestServerConfig {
  name: string;
  tools?: Tool[];
  resources?: Resource[];
  prompts?: Prompt[];
  latency?: number;
  errorRate?: number;
}

class TestMcpServer {
  private config: TestServerConfig;
  private responses: Map<string, Response> = new Map();
  
  constructor(config: TestServerConfig) {
    this.config = config;
  }
  
  withTool(name: string, handler: ToolHandler): this {
    // Add tool to server
    return this;
  }
  
  withLatency(ms: number): this {
    this.config.latency = ms;
    return this;
  }
  
  withErrorRate(rate: number): this {
    this.config.errorRate = rate;
    return this;
  }
}
```

### Decision 3: Test Client Framework

**Choice:** Dedicated test client with assertion helpers

**Rationale:**
- Simplifies common test patterns
- Provides readable assertions
- Encapsulates connection management

**Implementation:**
```typescript
// tests/shared/test-client.ts
class TestMcpClient {
  private client: Client;
  private connection: Connection;
  
  async connect(transport: Transport): Promise<void> {
    this.client = new Client({ name: "test-client" });
    await this.client.connect(transport);
  }
  
  async listTools(): Promise<Tool[]> {
    const result = await this.client.listTools();
    return result.tools;
  }
  
  async callTool(name: string, args?: Record<string, unknown>): Promise<ToolResult> {
    const result = await this.client.callTool({ name, arguments: args });
    return result;
  }
  
  async subscribeResource(uri: string): Promise<void> {
    await this.client.subscribeResource({ uri });
  }
  
  async readResource(uri: string): Promise<ResourceContent[]> {
    const result = await this.client.readResource({ uri });
    return result.contents;
  }
  
  assertToolResult(result: ToolResult): ToolResultAssertions {
    return new ToolResultAssertions(result);
  }
}
```

### Decision 4: Network Simulation

**Choice:** Configurable latency and failure injection

**Rationale:**
- Test retry logic without actual slow networks
- Test circuit breaking with predictable failures
- Reproducible test conditions

**Implementation:**
```typescript
// tests/shared/network-simulator.ts
class NetworkSimulator {
  private latency: number = 0;
  private errorRate: number = 0;
  private failures: Map<string, number> = new Map();
  
  setLatency(ms: number): void {
    this.latency = ms;
  }
  
  setErrorRate(rate: number): void {
    this.errorRate = rate;
  }
  
  async wrap<T>(operation: () => Promise<T>): Promise<T> {
    if (this.latency > 0) {
      await delay(this.latency);
    }
    if (Math.random() < this.errorRate) {
      throw new NetworkError("Simulated failure");
    }
    return operation();
  }
}
```

### Decision 5: Test Isolation

**Choice:** Per-suite ports, cleanup hooks, shared state management

**Rationale:**
- Prevent test interference
- Enable parallel execution
- Clean state for each test

**Implementation:**
```typescript
describe("Integration Tests", () => {
  let gateway: TestGateway;
  let cleanup: CleanupManager;
  
  beforeEach(() => {
    cleanup = new CleanupManager();
    gateway = new TestGateway({
      port: getAvailablePort(),
      cleanup,
    });
  });
  
  afterEach(async () => {
    await cleanup.run();
  });
  
  it("test case", async () => {
    // Test implementation
  });
});
```

## Risks / Trade-offs

### [Risk] Test flakiness with real connections
**→ Mitigation:** Use deterministic timeouts, retry failing tests once, log connection details on failure

### [Risk] Long-running test suites
**→ Mitigation:** Parallelize independent test suites, use smaller test servers, set strict timeout per test

### [Risk] Resource contention (ports, files)
**→ Mitigation:** Dynamic port allocation, temp file management, cleanup hooks for all resources

### [Risk] Network simulation complexity
**→ Mitigation:** Start with simple latency injection, add failure modes incrementally, keep simulation code separate

## Migration Plan

1. Create test directory structure (handshake, e2e, multi-server, transport, hot-reload, virtual-tools, resources)
2. Create shared test utilities (test servers, clients, network simulator, fixtures)
3. Implement test server fixtures with configurable capabilities
4. Implement test client with assertion helpers
5. Write handshake tests (full MCP flow, capability negotiation)
6. Write e2e communication tests (request/response, streaming)
7. Write multi-server tests (aggregation, load balancing, failover)
8. Write transport failure tests (resilience, retry, circuit breaking)
9. Write hot reload tests (config changes during active connections)
10. Write virtual tool tests (parallel execution, dependencies)
11. Write resource tests (file access, caching, streaming)
12. Run full test suite and verify all tests pass
13. Add integration tests to CI pipeline

Rollback: Remove integration test directories and update package.json/vitest.config.ts

## Open Questions

1. Should we use Docker containers for test servers? (No, embedded is simpler for now)
2. How many backend servers for multi-server tests? (2-3 is sufficient for most scenarios)
3. What timeout for integration tests? (30 seconds per test, 5 minutes per suite)
4. Should tests be tagged for selective execution? (Yes, by category)
