# E2E Tests Documentation

This directory contains end-to-end (E2E) tests for the Goblin MCP Gateway.

## Overview

E2E tests validate real-world usage scenarios with actual MCP servers and interfaces. Unlike integration tests that use mock servers, E2E tests use real client connections and backend servers.

## Test Categories

### Agent Workflows (`agent-workflows/`)

Tests simulating LLM agent workflows with meta-tools, multi-turn conversations, and context management.

- `basic.test.ts` - Core workflow tests

### Real Backends (`real-backends/`)

Tests against real MCP servers (filesystem server, etc.) without mocking.

- Tests requiring actual MCP server binaries

### CLI/TUI (`cli-tui/`)

Tests for CLI commands and TUI interface interactions.

- `cli-commands.test.ts` - CLI command execution tests

### Error Scenarios (`errors/`)

Tests for error handling including invalid requests, timeouts, malformed data, and recovery.

- `invalid-requests.test.ts` - Invalid request handling tests

## Shared Utilities (`shared/`)

Test utilities and fixtures:

- `agent-simulator.ts` - LLM agent workflow simulation
- `real-server.ts` - Real MCP server lifecycle management
- `cli-tester.ts` - CLI command testing
- `error-injector.ts` - Error injection for testing
- `environment.ts` - Test environment isolation
- `fixtures.ts` - Test data and sample configurations

## Test Data (`test-data/`)

Sample data for testing:

- `projects/` - Sample projects for CLI testing
- `configs/` - Sample server configurations

## Running E2E Tests

```bash
# Run all E2E tests
bun test tests/e2e/

# Run specific test file
bun test tests/e2e/agent-workflows/basic.test.ts

# Run with timeout
bun test tests/e2e/ --timeout 60000
```

## Test Environment Requirements

- Bun >= 1.3.8
- Node.js >= 20.0.0
- For real backend tests: MCP server binaries (filesystem server, etc.)

## Configuration

E2E tests use temporary directories and isolated environments. No permanent configuration required.

## Notes

- E2E tests may take longer to run than unit tests
- Some tests require external MCP servers to be available
- Tests are designed to be idempotent and safe to re-run
