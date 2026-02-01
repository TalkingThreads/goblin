## Context

Goblin needs CLI and smoke tests to ensure basic functionality works correctly after builds and deployments. These tests validate the critical path that developers use most frequently: CLI commands for starting/stopping the gateway, health endpoints for monitoring, and tool discovery for validating backend connections.

Current state: No systematic smoke tests exist. Manual testing is required to verify basic functionality after changes.

Constraints: Tests must be fast (< 5 seconds each), reliable (no flakiness), and suitable for pre-commit hooks and CI pipelines.

## Goals / Non-Goals

**Goals:**
- Validate all CLI commands execute correctly
- Verify gateway starts and shuts down cleanly
- Test health check endpoints return correct status
- Verify tools are discovered from connected backends
- Provide fast feedback for build verification

**Non-Goals:**
- Full integration tests (covered separately)
- Performance/load testing
- Security penetration testing
- Complex workflow testing

## Decisions

### Decision 1: Test Execution Strategy

**Choice:** Separate smoke test suite that can run independently

**Rationale:**
- Smoke tests should be fast and independent
- Can run before full test suite in CI
- Suitable for pre-commit hooks
- Clear pass/fail without complex setup

**Implementation:**
```typescript
// tests/smoke/shared/smoke-test-utils.ts
class SmokeTestRunner {
  async runAll(): Promise<SmokeTestResult> {
    const results: TestResult[] = [];
    results.push(await this.runCliTests());
    results.push(await this.runStartupTests());
    results.push(await this.runHealthTests());
    results.push(await this.runDiscoveryTests());
    return this.summarize(results);
  }
  
  async runWithTimeout(test: () => Promise<void>, timeout: number): Promise<void> {
    return Promise.race([
      test(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new TimeoutError()), timeout)
      ),
    ]);
  }
}
```

### Decision 2: CLI Testing Approach

**Choice:** Process spawning with output capture and assertion

**Rationale:**
- CLI is the primary developer interface
- Process spawning tests actual CLI behavior
- Output capture validates expected behavior
- Exit codes indicate success/failure

**Implementation:**
```typescript
// tests/smoke/cli/cli-tester.ts
class CliSmokeTester {
  async runCommand(args: string[]): Promise<CliResult> {
    const process = spawn("bun", ["run", "goblin", ...args]);
    const output = await this.captureOutput(process);
    return {
      exitCode: process.exitCode,
      output,
      stdout: this.extractStdout(output),
      stderr: this.extractStderr(output),
    };
  }
  
  assertSuccess(result: CliResult): void {
    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBeEmpty();
  }
  
  assertHelpOutput(result: CliResult): void {
    expect(result.output).toContain("Usage");
    expect(result.output).toContain("Commands");
  }
}
```

### Decision 3: Gateway Lifecycle Testing

**Choice:** Start gateway as subprocess, test lifecycle, cleanup

**Rationale:**
- Gateway lifecycle is critical for reliability
- Subprocess allows full integration testing
- Cleanup ensures tests don't leave processes running
- Timeouts prevent hanging tests

**Implementation:**
```typescript
// tests/smoke/startup/gateway-lifecycle.ts
class GatewayLifecycleTester {
  private gatewayProcess: ChildProcess | null = null;
  
  async start(): Promise<void> {
    this.gatewayProcess = spawn("bun", ["run", "goblin", "start"]);
    await this.waitForReady();
  }
  
  async stop(): Promise<void> {
    if (this.gatewayProcess) {
      this.gatewayProcess.kill("SIGTERM");
      await this.waitForProcessExit();
      this.gatewayProcess = null;
    }
  }
  
  async assertHealthy(): Promise<void> {
    const response = await fetch("http://localhost:3000/health");
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.status).toBe("healthy");
  }
}
```

### Decision 4: Health Endpoint Testing

**Choice:** HTTP client requests to health endpoints with assertion

**Rationale:**
- Health endpoints are critical for monitoring
- HTTP testing is straightforward and reliable
- Validates actual server behavior
- Can check response format and status codes

**Implementation:**
```typescript
// tests/smoke/health/health-endpoint-tester.ts
class HealthEndpointTester {
  private baseUrl: string;
  
  constructor(baseUrl: string = "http://localhost:3000") {
    this.baseUrl = baseUrl;
  }
  
  async testHealthEndpoint(): Promise<HealthResult> {
    const response = await fetch(`${this.baseUrl}/health`);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.status).toBe("healthy");
    expect(body.timestamp).toBeDefined();
    return body;
  }
  
  async testReadyEndpoint(): Promise<ReadyResult> {
    const response = await fetch(`${this.baseUrl}/ready`);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.ready).toBe(true);
    expect(body.backends).toBeDefined();
    return body;
  }
  
  async testMetricsEndpoint(): Promise<MetricsResult> {
    const response = await fetch(`${this.baseUrl}/metrics`);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/plain");
    const body = await response.text();
    expect(body).toContain("goblin_");
    return { content: body };
  }
}
```

### Decision 5: Tool Discovery Testing

**Choice:** Connect MCP client, list tools, assert discovery

**Rationale:**
- Tool discovery is the primary gateway function
- MCP client testing validates protocol compliance
- Can use test backend servers
- Validates end-to-end functionality

**Implementation:**
```typescript
// tests/smoke/discovery/tool-discovery-tester.ts
class ToolDiscoveryTester {
  private client: Client;
  private testServer: TestMcpServer;
  
  async setup(): Promise<void> {
    this.testServer = new TestMcpServer();
    await this.testServer.start();
    this.client = new Client({ name: "smoke-test" });
    await this.client.connect(gatewayTransport);
  }
  
  async teardown(): Promise<void> {
    await this.client.close();
    await this.testServer.stop();
  }
  
  async testToolDiscovery(): Promise<Tool[]> {
    const result = await this.client.listTools();
    expect(result.tools).toBeDefined();
    expect(result.tools.length).toBeGreaterThan(0);
    return result.tools;
  }
  
  async testToolCall(): Promise<ToolResult> {
    const tools = await this.testToolDiscovery();
    const testTool = tools.find(t => t.name === "test-tool");
    expect(testTool).toBeDefined();
    const result = await this.client.callTool({ name: testTool.name });
    expect(result).toBeDefined();
    return result;
  }
}
```

## Risks / Trade-offs

### [Risk] Port conflicts in CI
**→ Mitigation:** Use dynamic ports or mock servers, document port requirements

### [Risk] Test flakiness with timing
**→ Mitigation:** Use polling with timeouts, allow reasonable margins

### [Risk] Gateway startup time
**→ Mitigation:** Increase startup timeout, use health checks to verify ready

### [Risk] Resource cleanup failures
**→ Mitigation:** Use try/finally for cleanup, add process kill as fallback

## Migration Plan

1. Create smoke test directory structure (cli, startup, health, discovery, shared)
2. Create shared test utilities (process manager, output capture, HTTP client)
3. Implement CLI smoke tests (help, version, basic commands)
4. Implement startup/shutdown tests (clean start, graceful shutdown)
5. Implement health endpoint tests (/health, /ready, /metrics)
6. Implement tool discovery tests (list tools, call tool)
7. Run full smoke test suite and verify all pass
8. Add smoke tests to CI pipeline (run before integration tests)
9. Document smoke test usage (pre-commit, CI, local verification)

Rollback: Remove smoke test directories and update package.json/vitest.config.ts

## Open Questions

1. Should smoke tests run in parallel? (Yes, but with resource isolation)
2. What timeout for overall smoke test suite? (60 seconds total)
3. Should tests use real or mock backends? (Mock for reliability, real for E2E suite)
4. Where should smoke tests be documented? (README in tests/smoke/)
