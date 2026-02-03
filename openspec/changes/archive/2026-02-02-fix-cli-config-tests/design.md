## Context

CLI configuration tests (`tests/e2e/cli-tui/`) include tests for `config validate` and `config show` commands. These commands require a running gateway server to read configuration state. The tests currently fail with exit code 1 because no server is running.

## Goals / Non-Goals

**Goals:**
- CLI config tests pass successfully
- Server lifecycle is managed automatically for tests
- Tests skip gracefully if server cannot start

**Non-Goals:**
- No changes to CLI implementation
- No changes to test assertions

## Decisions

**Decision 1**: Use existing `test-server.ts` from performance tests

**Rationale**: The performance tests already have a `startTestServer`/`stopTestServer` module. Reusing this avoids duplication.

**Decision 2**: Add server lifecycle to each describe block that needs it

**Rationale**: Rather than a global setup, each test file can manage its own server lifecycle. This provides better isolation and allows tests to run independently.

## Risks / Trade-offs

[Risk] Test time increases → Mitigation: Server starts once per describe block, not per test
[Risk] Server startup failures → Mitigation: Add try/catch with skip message
