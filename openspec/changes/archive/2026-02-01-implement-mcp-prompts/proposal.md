## Why

MCP Prompts is a core MCP protocol feature that enables template-based prompt sharing between servers and clients. The MCP standard requires Goblin to:

1. **Aggregate prompts** from multiple backend MCP servers behind a single endpoint
2. **Proxy prompt operations** (`prompts/list`, `prompts/get`) seamlessly
3. **Handle namespacing** to prevent collisions (e.g., `server1_codeReview`)
4. **Propagate notifications** (`notifications/prompts/list_changed`) end-to-end
5. **Provide meta tools** for prompt discovery (similar to `catalog_list`, `catalog_search`)

Currently, the infrastructure is partially implemented but lacks complete functionality, TUI integration, meta tools, and comprehensive testing. Users expect the same seamless aggregation experience as Tools.

## What Changes

- **Complete Prompt Aggregation**: Ensure full end-to-end prompt aggregation from backend servers
- **Namespacing**: Implement `serverId_promptName` pattern consistently
- **Routing**: Ensure `getPrompt` calls route correctly to backend servers
- **Caching**: Implement efficient caching with cache invalidation on notifications
- **Notification Propagation**: Complete the chain from backend → registry → gateway → clients
- **TUI Integration**: Add prompt management views in the terminal UI
- **Meta Tools**: Add prompt discovery tools (`catalog_prompts`, `describe_prompt`, `search_prompts`)
- **Testing**: Comprehensive tests for all prompt operations
- **Documentation**: Update docs with prompt usage examples

**Breaking Changes:**
- None - this is a feature completion, not a breaking change

## Capabilities

### New Capabilities
- `mcp-prompts-aggregation`: Complete MCP Prompts aggregation and proxy implementation
- `prompt-meta-tools`: Meta tools for prompt discovery and management
- `prompt-ui`: TUI integration for prompt visualization

### Modified Capabilities
- `gateway`: Extend existing gateway spec with complete prompts requirements

## Impact

**Code Impact:**
- `src/gateway/server.ts`: Verify and complete `prompts/list` and `prompts/get` handlers
- `src/gateway/registry.ts`: Verify and complete prompt sync, storage, and notification handling
- `src/gateway/router.ts`: Verify and complete prompt routing logic
- `src/gateway/types.ts`: Add `PromptEntry` and related types (already exist, verify completeness)
- `src/tui/`: Add prompt management views and components
- `src/tools/meta/`: Add prompt discovery meta tools
- `tests/unit/gateway/`: Add comprehensive prompt tests
- `tests/integration/`: Add prompt integration tests

**API Impact:**
- `prompts/list` returns aggregated prompts from all backend servers with namespacing
- `prompts/get` routes to correct backend with argument passing
- New meta tools: `catalog_prompts`, `describe_prompt`, `search_prompts`

**Config Impact:**
- None - prompts are discovered from servers, not configured

**Dependencies:**
- No new dependencies - uses existing MCP SDK types

**Pattern to Follow:**
The implementation MUST follow the exact same pattern as Tools:
```
Backend Server → sync → namespace → Registry → Cache → Gateway Server → Client
                        ↑                                    ↓
                        └────── notify ──── propagate ────────┘
```
