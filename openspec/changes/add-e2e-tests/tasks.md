# E2E Testing Implementation Tasks

This document outlines all implementation tasks for adding comprehensive end-to-end (E2E) testing to the Goblin MCP Gateway.

## 1. Test Infrastructure Setup

- [ ] 1.1 Create tests/e2e directory structure
- [ ] 1.2 Create tests/e2e/shared/ directory for shared utilities
- [ ] 1.3 Create tests/fixtures/real-servers/ for MCP server installations
- [ ] 1.4 Create tests/fixtures/projects/ for sample projects
- [ ] 1.5 Create tests/e2e/shared/agent-simulator.ts for workflow simulation
- [ ] 1.6 Create tests/e2e/shared/real-server.ts for real server management
- [ ] 1.7 Create tests/e2e/shared/cli-tester.ts for CLI testing
- [ ] 1.8 Create tests/e2e/shared/tui-tester.ts for TUI testing
- [ ] 1.9 Create tests/e2e/shared/error-injector.ts for error scenarios
- [ ] 1.10 Create tests/e2e/shared/environment.ts for test isolation
- [ ] 1.11 Create tests/e2e/shared/fixtures.ts for test data
- [ ] 1.12 Update vitest.config.ts with e2e test settings
- [ ] 1.13 Configure e2e test timeouts (30s per test, 10min per suite)
- [ ] 1.14 Document test environment requirements

## 2. Agent Workflow E2E Tests

### 2.1 Multi-turn Conversation Tests
- [ ] 2.1.1 Create tests/e2e/agent-workflows/multi-turn.test.ts
- [ ] 2.1.2 Test single tool request in conversation
- [ ] 2.1.3 Test multiple sequential tool requests
- [ ] 2.1.4 Test context carry-over between turns
- [ ] 2.1.5 Test conversation with clarifying questions
- [ ] 2.1.6 Test conversation with user interruptions

### 2.2 Tool Selection Tests
- [ ] 2.2.1 Create tests/e2e/agent-workflows/tool-selection.test.ts
- [ ] 2.2.2 Test agent selects correct tool
- [ ] 2.2.3 Test tool not found handling
- [ ] 2.2.4 Test multiple tools match request
- [ ] 2.2.5 Test tool execution with dependencies
- [ ] 2.2.6 Test tool selection from suggestions

### 2.3 Context Management Tests
- [ ] 2.3.1 Create tests/e2e/agent-workflows/context.test.ts
- [ ] 2.3.2 Test context initialization
- [ ] 2.3.3 Test context updates with tool results
- [ ] 2.3.4 Test context size limits
- [ ] 2.3.5 Test context persistence across reconnection
- [ ] 2.3.6 Test context clearing

### 2.4 Complex Workflow Tests
- [ ] 2.4.1 Create tests/e2e/agent-workflows/complex.test.ts
- [ ] 2.4.2 Test workflow with conditional branching
- [ ] 2.4.3 Test workflow with iteration
- [ ] 2.4.4 Test workflow error recovery
- [ ] 2.4.5 Test parallel tool execution in workflow
- [ ] 2.4.6 Test workflow with nested calls

## 3. Real Backend E2E Tests

### 3.1 Filesystem Server Tests
- [ ] 3.1.1 Create tests/e2e/real-backends/filesystem.test.ts
- [ ] 3.1.2 Test read file through gateway
- [ ] 3.1.3 Test list directory through gateway
- [ ] 3.1.4 Test write file through gateway
- [ ] 3.1.5 Test file operations with permissions
- [ ] 3.1.6 Test file operations with special characters

### 3.2 Prompt Server Tests
- [ ] 3.2.1 Create tests/e2e/real-backends/prompts.test.ts
- [ ] 3.2.2 Test list prompts from server
- [ ] 3.2.3 Test get and execute prompt
- [ ] 3.2.4 Test dynamic prompt generation
- [ ] 3.2.5 Test prompt with missing arguments
- [ ] 3.2.6 Test prompt template variables

### 3.3 Resource Server Tests
- [ ] 3.3.1 Create tests/e2e/real-backends/resources.test.ts
- [ ] 3.3.2 Test list resources from server
- [ ] 3.3.3 Test read resource content
- [ ] 3.3.4 Test subscribe to resource updates
- [ ] 3.3.5 Test resource template expansion
- [ ] 3.3.6 Test large resource streaming

### 3.4 Multi-Server Tests
- [ ] 3.4.1 Create tests/e2e/real-backends/multi-server.test.ts
- [ ] 3.4.2 Test multiple servers registered
- [ ] 3.4.3 Test cross-server tool calls
- [ ] 3.4.4 Test server health during operation
- [ ] 3.4.5 Test server addition/removal dynamically
- [ ] 3.4.6 Test server capability aggregation

### 3.5 Real Server Error Tests
- [ ] 3.5.1 Create tests/e2e/real-backends/errors.test.ts
- [ ] 3.5.2 Test server returns protocol error
- [ ] 3.5.3 Test server becomes unavailable
- [ ] 3.5.4 Test server returns unexpected data
- [ ] 3.5.5 Test server connection failures
- [ ] 3.5.6 Test server timeout handling

## 4. CLI/TUI E2E Tests

### 4.1 CLI Command Tests
- [ ] 4.1.1 Create tests/e2e/cli-tui/cli-commands.test.ts
- [ ] 4.1.2 Test start gateway via CLI
- [ ] 4.1.3 Test list connected servers
- [ ] 4.1.4 Test add new server
- [ ] 4.1.5 Test remove server
- [ ] 4.1.6 Test view server status

### 4.2 CLI Output Tests
- [ ] 4.2.1 Create tests/e2e/cli-tui/cli-output.test.ts
- [ ] 4.2.2 Test help command output
- [ ] 4.2.3 Test error messages are helpful
- [ ] 4.2.4 Test JSON output format
- [ ] 4.2.5 Test verbose output mode
- [ ] 4.2.6 Test output formatting and colors

### 4.3 TUI Interface Tests
- [ ] 4.3.1 Create tests/e2e/cli-tui/tui-interface.test.ts
- [ ] 4.3.2 Test TUI starts correctly
- [ ] 4.3.3 Test navigate servers view
- [ ] 4.3.4 Test execute command from TUI
- [ ] 4.3.5 Test TUI keyboard shortcuts
- [ ] 4.3.6 Test TUI responds to window resize

### 4.4 TUI Output Tests
- [ ] 4.4.1 Create tests/e2e/cli-tui/tui-output.test.ts
- [ ] 4.4.2 Test server list rendering
- [ ] 4.4.3 Test metrics display
- [ ] 4.4.4 Test error display in TUI
- [ ] 4.4.5 Test progress indication
- [ ] 4.4.6 Test status indicators

### 4.5 CLI/TUI Error Tests
- [ ] 4.5.1 Create tests/e2e/cli-tui/cli-tui-errors.test.ts
- [ ] 4.5.2 Test invalid configuration handling
- [ ] 4.5.3 Test missing required arguments
- [ ] 4.5.4 Test permission denied errors
- [ ] 4.5.5 Test recovery from TUI errors
- [ ] 4.5.6 Test error log output

## 5. Error Scenario E2E Tests

### 5.1 Invalid Request Tests
- [ ] 5.1.1 Create tests/e2e/errors/invalid-requests.test.ts
- [ ] 5.1.2 Test unknown tool name
- [ ] 5.1.3 Test invalid tool arguments
- [ ] 5.1.4 Test malformed JSON-RPC request
- [ ] 5.1.5 Test request with missing required fields
- [ ] 5.1.6 Test request ID mismatch

### 5.2 Timeout Tests
- [ ] 5.2.1 Create tests/e2e/errors/timeout.test.ts
- [ ] 5.2.2 Test tool execution timeout
- [ ] 5.2.3 Test client request timeout
- [ ] 5.2.4 Test backend server timeout
- [ ] 5.2.5 Test timeout with pending operations
- [ ] 5.2.6 Test timeout recovery

### 5.3 Malformed Data Tests
- [ ] 5.3.1 Create tests/e2e/errors/malformed-data.test.ts
- [ ] 5.3.2 Test invalid UTF-8 in request
- [ ] 5.3.3 Test oversized request
- [ ] 5.3.4 Test circular reference in JSON
- [ ] 5.3.5 Test invalid JSON structure
- [ ] 5.3.6 Test type coercion errors

### 5.4 Connection Error Tests
- [ ] 5.4.1 Create tests/e2e/errors/connection.test.ts
- [ ] 5.4.2 Test client disconnect during request
- [ ] 5.4.3 Test backend disconnect during request
- [ ] 5.4.4 Test network partition recovery
- [ ] 5.4.5 Test zombie connection detection
- [ ] 5.4.6 Test too many connections

### 5.5 Error Recovery Tests
- [ ] 5.5.1 Create tests/e2e/errors/recovery.test.ts
- [ ] 5.5.2 Test error isolation between requests
- [ ] 5.5.3 Test error logging and monitoring
- [ ] 5.5.4 Test graceful degradation
- [ ] 5.5.5 Test error recovery after restart
- [ ] 5.5.6 Test circuit breaker activation

## 6. Test Integration and CI

- [ ] 6.1 Create tests/e2e/README.md with documentation
- [ ] 6.2 Create tests/e2e/test-data/sample-project/ for testing
- [ ] 6.3 Create tests/e2e/test-data/sample-configs/ for testing
- [ ] 6.4 Set up Docker containers for real MCP servers
- [ ] 6.5 Configure CI pipeline for e2e tests
- [ ] 6.6 Set up e2e test reporting
- [ ] 6.7 Create test run scripts
- [ ] 6.8 Document test environment setup
- [ ] 6.9 Verify all e2e tests pass
- [ ] 6.10 Measure e2e test execution time (target: < 10 minutes)
