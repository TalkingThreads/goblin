## Context

Goblin needs comprehensive end-to-end (e2e) tests that validate real-world usage scenarios with actual MCP servers and interfaces. Current test coverage lacks:
- Realistic LLM agent workflow simulations with multi-turn conversations
- Testing against actual MCP servers instead of mocks
- CLI/TUI interface validation for developer workflows
- Error scenario testing including boundary conditions and recovery

Current state: Integration tests exist but e2e tests are minimal or non-existent.

Constraints: Tests must use real MCP client connections, actual backend servers where feasible, test complete user journeys, and complete in reasonable time (< 10 minutes per suite).

## Goals / Non-Goals

**Goals:**
- Validate agent workflows with multi-turn conversations and tool selection
- Test against real MCP servers (filesystem, prompts, resources) without mocks
- Validate CLI commands and TUI interactions end-to-end
- Test error scenarios including invalid requests, timeouts, malformed data
- Achieve comprehensive coverage of user-facing workflows

**Non-Goals:**
- Unit tests (handled separately)
- Performance/load testing (separate test suite)
- Security penetration testing (separate security tests)
- Testing against non-MCP interfaces

## Decisions

### Decision 1: Agent Workflow Simulation

**Choice:** Simulated LLM agent with state machine for conversation flow

**Rationale:**
- Real LLM integration is non-deterministic
- State machine provides reproducible test scenarios
- Can simulate complex multi-turn workflows
- Easier to verify expected behavior

**Implementation:**
```typescript
// tests/e2e/shared/agent-simulator.ts
class AgentSimulator {
  private state: AgentState = "idle";
  private conversation: Message[] = [];
  private toolsUsed: string[] = [];
  
  async simulateWorkflow(workflow: AgentWorkflow): Promise<WorkflowResult> {
    for (const step of workflow.steps) {
      switch (step.type) {
        case "user-message":
          await this.sendUserMessage(step.message);
          break;
        case "tool-selection":
          await this.selectTool(step.tool, step.args);
          break;
        case "result-processing":
          await this.processResult(step.expectation);
          break;
        case "context-update":
          await this.updateContext(step.data);
          break;
      }
    }
    return this.getResult();
  }
}

interface AgentWorkflow {
  name: string;
  steps: WorkflowStep[];
  expectedTools: string[];
  expectedOutcome: "success" | "partial" | "failure";
}

interface WorkflowStep {
  type: "user-message" | "tool-selection" | "result-processing" | "context-update";
  message?: string;
  tool?: string;
  args?: Record<string, unknown>;
  expectation?: string;
  data?: Record<string, unknown>;
}
```

### Decision 2: Real Backend Testing

**Choice:** Use actual MCP server processes (filesystem server, etc.) in isolated environments

**Rationale:**
- Validates real behavior, not mocked responses
- Catches integration issues early
- Tests actual data formats and edge cases
- Required for confidence in production behavior

**Implementation:**
```typescript
// tests/e2e/shared/real-server.ts
class RealMcpServer {
  private process: ChildProcess;
  private cleanup: CleanupFn;
  
  static async start(config: ServerConfig): Promise<RealMcpServer> {
    const server = new RealMcpServer();
    server.process = spawn(config.command, config.args);
    await server.waitForReady();
    return server;
  }
  
  async stop(): Promise<void> {
    this.process.kill();
    await this.cleanup();
  }
  
  getEndpoint(): string {
    return `http://localhost:${this.port}`;
  }
}

interface ServerConfig {
  name: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
  workingDir?: string;
  startupTimeout: number;
}
```

### Decision 3: CLI/TUI Testing

**Choice:** Process spawning with output capture and keyboard simulation for TUI

**Rationale:**
- CLI/TUI are primary user interfaces
- Process spawning allows full workflow testing
- Output capture validates expected behavior
- Keyboard simulation tests TUI interactions

**Implementation:**
```typescript
// tests/e2e/shared/cli-tester.ts
class CliTester {
  private process: ChildProcess;
  private output: string = "";
  
  async run(args: string[]): Promise<CliResult> {
    this.process = spawn("bun", ["run", "goblin", ...args]);
    this.output = await this.captureOutput();
    return this.parseResult();
  }
  
  async typeCommand(command: string): Promise<void> {
    this.process.stdin.write(command + "\n");
  }
  
  async pressKey(key: string): Promise<void> {
    this.process.stdin.write(key);
  }
  
  assertOutputContains(text: string): void {
    expect(this.output).toContain(text);
  }
  
  assertExitCode(code: number): void {
    expect(this.process.exitCode).toBe(code);
  }
}

class TuiTester {
  private terminal: Terminal;
  private screen: Screen;
  
  async start(): Promise<void> {
    this.terminal = await Terminal.create({
      rows: 24,
      cols: 80,
    });
  }
  
  async navigateToMenu(menuName: string): Promise<void> {
    await this.pressKeys(["Down", "Down", "Enter"]);
    await this.waitForRender();
  }
  
  async takeScreenshot(): Promise<string> {
    return this.screen.render();
  }
  
  async verifyScreenContains(text: string): Promise<void> {
    const screen = await this.takeScreenshot();
    expect(screen).toContain(text);
  }
}
```

### Decision 4: Error Scenario Testing

**Choice:** Comprehensive error injection and validation framework

**Rationale:**
- Error scenarios are critical for reliability
- Reproducible error injection enables testing
- Validates error handling at all layers
- Tests recovery mechanisms

**Implementation:**
```typescript
// tests/e2e/shared/error-injector.ts
class ErrorInjector {
  private rules: ErrorRule[] = [];
  
  addRule(rule: ErrorRule): void {
    this.rules.push(rule);
  }
  
  async inject<T>(operation: () => Promise<T>): Promise<T> {
    const matchingRule = this.rules.find(r => r.condition());
    if (matchingRule) {
      throw matchingRule.error;
    }
    return operation();
  }
}

interface ErrorRule {
  condition: () => boolean;
  error: Error;
  probability: number;
}

class ErrorScenarioSuite {
  async testInvalidRequest(): Promise<void> {
    const client = await createTestClient();
    await expect(client.callTool({ name: "nonexistent" }))
      .rejects.toThrow(ToolNotFoundError);
  }
  
  async testTimeoutRecovery(): Promise<void> {
    const client = await createTestClient();
    const result = await client.callTool({ 
      name: "slow-tool", 
      timeout: 1000 
    });
    expect(result).toBeDefined();
  }
  
  async testMalformedData(): Promise<void> {
    const client = await createTestClient();
    await expect(client.callTool({ 
      name: "test-tool", 
      arguments: { invalid: "data" } 
    })).rejects.toThrow(ValidationError);
  }
}
```

### Decision 5: Test Environment Isolation

**Choice:** Docker containers for real server tests, temporary directories for CLI tests

**Rationale:**
- Real servers need isolated environments
- Prevents test interference
- Enables clean cleanup
- Supports parallel execution

**Implementation:**
```typescript
// tests/e2e/shared/environment.ts
class TestEnvironment {
  private containers: DockerContainer[] = [];
  private tempDirs: string[] = [];
  
  async createIsolatedServer(config: ServerConfig): Promise<DockerContainer> {
    const container = await Docker.run({
      image: config.image,
      command: config.command,
      volumes: ["/tmp/test-data:/data"],
      ports: [config.port],
    });
    this.containers.push(container);
    return container;
  }
  
  async createTempDirectory(): Promise<string> {
    const dir = await mkdtemp("/tmp/goblin-test-");
    this.tempDirs.push(dir);
    return dir;
  }
  
  async cleanup(): Promise<void> {
    await Promise.all([
      ...this.containers.map(c => c.stop()),
      ...this.tempDirs.map(d => rimraf(d)),
    ]);
  }
}
```

## Risks / Trade-offs

### [Risk] Real server availability
**→ Mitigation:** Use Docker images for servers, have fallback mock tests, document server dependencies

### [Risk] Flaky tests with real backends
**→ Mitigation:** Use timeouts on all tests, retry flaky tests once, log failures for debugging

### [Risk] Long-running e2e tests
**→ Mitigation:** Parallelize independent test suites, use smaller test data, set strict timeouts

### [Risk] CLI/TUI test complexity
**→ Mitigation:** Start with basic CLI tests, add TUI tests incrementally, use established testing libraries

### [Risk] Environment setup complexity
**→ Mitigation:** Create shared environment utilities, document setup requirements, use Docker when possible

## Migration Plan

1. Create e2e test directory structure (agent-workflows, real-backends, cli-tui, errors, shared)
2. Create shared test utilities (agent simulator, real server manager, CLI/TUI testers, error injector)
3. Implement agent workflow simulation framework
4. Set up real MCP server fixtures (filesystem server, etc.)
5. Implement CLI/TUI testing utilities
6. Write agent workflow tests (multi-turn, tool selection, context management)
7. Write real backend tests (filesystem, prompts, resources)
8. Write CLI tests (command execution, output validation, error display)
9. Write TUI tests (navigation, command execution, output rendering)
10. Write error scenario tests (invalid requests, timeouts, malformed data)
11. Run full e2e test suite and verify all pass
12. Add e2e tests to CI pipeline with appropriate timeouts

Rollback: Remove e2e test directories and update package.json/vitest.config.ts

## Open Questions

1. Which real MCP servers should we test against? (filesystem-server is essential, others as available)
2. Should e2e tests run in CI? (Yes, but with longer timeouts and separate job)
3. How to handle tests that require external services? (Skip with clear message, or use Docker)
4. Should we test against multiple MCP SDK versions? (Yes, for compatibility)
