## Why

Goblin needs comprehensive end-to-end (e2e) tests that validate real-world usage scenarios with actual MCP servers and interfaces. While unit and integration tests cover component behavior, e2e tests are critical for:
- Simulating realistic LLM agent workflows with multi-turn conversations and tool selection
- Testing against real MCP servers (filesystem, prompts, resources) instead of mocks
- Validating CLI/TUI interfaces for developer workflows
- Testing error scenarios including invalid requests, timeouts, and malformed data

Current test coverage lacks real-world scenarios that users actually encounter when using Goblin as their primary MCP gateway.

## What Changes

- Write e2e tests for agent workflows simulating LLM interactions with meta-tools
- Write e2e tests against real MCP servers (filesystem server, etc.) for authentic validation
- Write e2e tests for CLI/TUI commands including execution, output formatting, and error display
- Write e2e tests for error scenarios including invalid requests, timeouts, and malformed data

All e2e tests use real MCP client connections, actual backend servers where feasible, and test the complete user journey from CLI/TUI through the gateway to backends.

## Capabilities

### New Capabilities

- `e2e-tests-agent-workflows`: End-to-end tests simulating LLM agent workflows with meta-tools, multi-turn conversations, and context management
- `e2e-tests-real-backends`: End-to-end tests against real MCP servers (filesystem server, prompt server, resource server) without mocking
- `e2e-tests-cli-tui`: End-to-end tests for CLI commands and TUI interface interactions including output validation
- `e2e-tests-error-scenarios`: End-to-end tests for error handling including invalid requests, timeouts, malformed data, and recovery

### Modified Capabilities

- None (new test coverage only, no behavior changes)

## Impact

### Affected Code

- `tests/e2e/agent-workflows/`: New test directory for agent workflow simulations
- `tests/e2e/real-backends/`: New test directory for real MCP server tests
- `tests/e2e/cli-tui/`: New test directory for CLI/TUI integration tests
- `tests/e2e/errors/`: New test directory for error scenario tests
- `tests/e2e/shared/`: Shared utilities for e2e tests (agent simulators, real server fixtures)
- `tests/fixtures/real-servers/`: Real MCP server installations for testing
- `tests/fixtures/projects/`: Sample projects for CLI testing

### Testing Framework

- Bun test for running e2e tests
- Node.js process spawning for CLI tests
- Real MCP client connections (not mocked)
- Actual MCP server processes for real backend tests
- TUI automation with keyboard simulation

### Dependencies

- May require actual MCP server binaries (filesystem server, etc.)
- May require terminal simulation library for TUI testing
- Process management utilities for server lifecycle

### Security Considerations

- Tests with real backends use isolated test directories
- CLI tests use temporary directories, not production files
- Error scenarios test without exposing sensitive data
- Tests validate secure error messages (no information leakage)
