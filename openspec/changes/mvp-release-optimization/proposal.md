## Why

The Goblin codebase has several performance optimization opportunities identified through codebase exploration. These conservative optimizations will improve startup time, reduce memory footprint, prevent resource exhaustion during high concurrency, and reduce logging overhead—all while maintaining full backward compatibility and existing behavior. Implementing these optimizations before the MVP release will ensure a solid foundation for production use.

## What Changes

- **Registry Synchronization Optimization**: Implement incremental sync or targeted capability fetching instead of full sync on every change notification
- **Global Metadata Cache**: Move transformed MCP metadata to shared Registry to reduce memory per concurrent SSE session
- **Connection Pooling Concurrency Guard**: Add promise-based deduplication to prevent thundering herd problem during connection establishment
- **Build Optimization**: Use Bun-specific build target and minification for faster startup and smaller binary
- **Structured Error Handling**: Replace string matching with custom error classes, consolidate logging for reduced I/O overhead

## Capabilities

### New Capabilities

- `optimization-registry-sync`: Incremental or targeted registry synchronization to reduce network overhead on change notifications
- `optimization-global-cache`: Shared MCP metadata cache to reduce per-session memory usage
- `optimization-connection-guard`: Connection pooling concurrency guard to prevent duplicate connection attempts
- `optimization-build-target`: Bun-specific build optimization with minification
- `optimization-error-handling`: Custom error classes and consolidated logging for cleaner code

### Modified Capabilities

- None (all optimizations maintain existing behavior and requirements)

## Impact

### Affected Code

- `src/gateway/registry.ts`: Modify syncServer for targeted/incremental sync
- `src/gateway/http.ts`: Reduce per-session memory by sharing metadata cache
- `src/transport/pool.ts`: Add promise-based concurrency guard
- `package.json`: Update build command with Bun target and minification
- `src/gateway/server.ts`: Replace string error matching with custom error classes
- `src/gateway/router.ts`: Consolidate request/response logging

### User Impact

- **Positive**: Faster startup, lower memory usage, better concurrency handling, cleaner error messages
- **Risk**: Minimal - all changes are behavior-preserving optimizations
- **Migration**: No changes required - optimizations are transparent

### Dependencies

- No new dependencies required
- Uses existing Bun build capabilities
- May adjust Bun version requirement if Bun-specific features are needed

### Security Considerations

- Optimizations do not introduce security vulnerabilities
- Error handling improvements may expose fewer internal details (positive)
- Connection pooling improvements prevent resource exhaustion (positive)
