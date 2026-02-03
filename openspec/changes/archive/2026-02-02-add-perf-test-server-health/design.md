# Add Performance Test Server Health Checks - Design

## Context

Performance tests require a running gateway but none of the test files manage server lifecycle. Tests timeout waiting for connections to `http://localhost:3000` which doesn't exist, causing cascade failures.

## Goals / Non-Goals

**Goals:**
- Tests can run with a managed server
- Tests skip gracefully if server unavailable
- Clear messaging about what's needed

**Non-Goals:**
- No production code changes
- No complex test infrastructure

## Decisions

**Decision 1**: Create `tests/performance/shared/test-server.ts`

**Rationale**: Centralized server management that can be imported by all performance tests.

**Decision 2**: Use `beforeAll`/`afterAll` in each test file

**Rationale**: Bun test supports these hooks. Each test file can manage its own server instance.

**Decision 3**: Add health check function

**Rationale**: Simple HTTP GET to `/health` endpoint to verify server readiness.

**Alternatives Considered**:
- Global test setup file → Rejected: Less flexible for different test categories
- Spawn server in each test → Rejected: Too slow, resource intensive

## Risks / Trade-offs

[Risk] Server startup time → Mitigation: Use parallel startup, skip if already running
[Risk] Port conflicts → Mitigation: Use random port, update test URLs dynamically
[Risk] Zombie processes → Mitigation: Proper cleanup in `afterAll`

## Migration Plan

1. Create `test-server.ts` module
2. Add hooks to latency tests
3. Add hooks to load tests
4. Add hooks to throughput tests
5. Add hooks to memory tests
