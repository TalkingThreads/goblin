# Release Candidate Documentation

This document provides specific information for Goblin MCP Gateway release candidate, including upgrade instructions, known issues, and migration guidance.

## Release Information

**Version**: v0.3.0-rc.2
**Release Date**: 2026-02-05
**Status**: Release Candidate (RC)
**Target Audience**: Testing and evaluation
**Test Suite**: 1083 passing tests (0 failures)

## What's New in v0.3.0-rc.2

### Test Infrastructure Improvements

This release candidate focuses on stability and reliability improvements to the test infrastructure:

- **Fixed Memory Stability Test**: Resolved syntax error in performance test suite
- **Fixed Test Server Path**: Corrected binary and command paths for test server startup
- **Enhanced Process Manager**: Improved startup detection to avoid false positives from log output
- **Optimized Performance Tests**: Adjusted timeout values and test scope for faster execution
- **Added Server Availability Guards**: Proper skipping when test server is unavailable

### Test Results

```
1083 tests passed
57 tests skipped
0 tests failed
2099 assertions
```

Test Coverage:
- Unit tests: Core components, routing, registry, transport pool
- Integration tests: Multi-server interactions, transport protocols
- Smoke tests: CLI, startup, health, graceful shutdown
- E2E tests: Agent workflows, CLI/TUI, real backend interactions
- Performance tests: Latency, throughput, load, memory stability

## Upgrade Guide

### From v0.2.x to v0.3.0-rc.2

#### Configuration Changes

**New Required Fields**:
```json
{
  "servers": [
    {
      "name": "my-server",
      "transport": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-everything"],
      "enabled": true
    }
  ],
  "gateway": {
    "port": 3000,
    "host": "127.0.0.1"
  }
}
```

#### Transport Types

v0.3.0 adds support for Streamable HTTP transport:

```json
{
  "servers": [
    {
      "name": "remote-server",
      "transport": "streamablehttp",
      "url": "http://localhost:3001/mcp",
      "headers": {
        "Authorization": "Bearer token"
      },
      "reconnect": {
        "enabled": true,
        "delay": 1000,
        "maxRetries": 5,
        "backoffMultiplier": 2
      }
    }
  ]
}
```

#### CLI Changes

New CLI commands available:
- `goblin stdio` - Run as subprocess MCP server
- `goblin servers` - List configured servers
- `goblin tools` - List available tools
- `goblin config validate` - Validate configuration
- `goblin health` - Show health status

## Known Issues

### Critical Issues

None - All critical issues have been resolved in this release.

### Major Issues

None - All major issues have been addressed.

### Minor Issues

1. **Performance Test Duration**
   - Full performance test suite takes ~3 minutes
   - Use `@quick` tags for faster execution: `bun test --filter "@quick"`

2. **Memory Tests Require Server**
   - Memory stability tests require the gateway server to be running
   - Tests automatically skip when server is unavailable

## Compatibility

### Supported Runtimes

- Bun >= 1.3.8 (recommended)
- Node.js >= 20.0.0 (CLI compatibility)

### Supported Transports

| Transport | Client | Server | Status |
|-----------|--------|--------|--------|
| STDIO | ✅ | ✅ | Stable |
| HTTP | ✅ | ✅ | Stable |
| SSE | ✅ | ✅ | Stable |
| Streamable HTTP | ✅ | ✅ | Stable |

### MCP Protocol Version

- MCP 2025-11-05 (latest)
- Backward compatible with earlier versions

## Installation

### From Source

```bash
# Clone repository
git clone https://github.com/TalkingThreads/goblin.git
cd goblin

# Install dependencies
bun install

# Build
bun run build
bun run build:cli

# Run tests
bun test

# Start gateway
./dist/cli/index.js start
```

### From npm

```bash
npm install -g @talkingthreads/goblin
goblin start
```

## Verification

### Run Test Suite

```bash
# All tests
bun test

# Unit tests only
bun test tests/unit

# Smoke tests (fast validation)
bun run smoke

# Performance tests
bun run perf
```

### Verify Installation

```bash
# Start gateway
goblin start --port 3000

# Check health (new terminal)
curl http://localhost:3000/health

# Expected response:
# {"status":"ok"}
```

## Support

- **Issues**: [GitHub Issues](https://github.com/TalkingThreads/goblin/issues)
- **Discussions**: [GitHub Discussions](https://github.com/TalkingThreads/goblin/discussions)
- **Security**: See [SECURITY.md](../SECURITY.md)

## Feedback

This is a release candidate. We encourage testing and feedback:

1. Run the test suite: `bun test`
2. Try performance tests: `bun run perf`
3. Test with your MCP servers
4. Report issues at [GitHub Issues](https://github.com/TalkingThreads/goblin/issues)

## Next Steps

This release candidate will be followed by:

- v0.3.0 (stable release) after community testing
- v0.4.0 (next major) with enterprise features

See [ROADMAP.md]() for upcoming features.

---

**Thank you for testing Goblin MCP Gateway!**
