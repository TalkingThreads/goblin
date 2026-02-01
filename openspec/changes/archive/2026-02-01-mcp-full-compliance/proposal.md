## Why

Goblin positions itself as a "developer-first MCP gateway" that aggregates multiple backend MCP servers behind a single unified endpoint. However, the current implementation is missing several critical MCP protocol features that are required for full protocol compliance and to support advanced MCP servers. Without these features, agentic workflows that rely on sampling, user input elicitation, resource subscriptions, and parameter completion will fail when routed through Goblin. This creates a transparency gap where clients using Goblin have a different (and degraded) experience compared to connecting directly to backend servers.

## What Changes

### Critical Gaps (Phase 1 - Immediate Priority)

- **Resource Subscriptions**: Implement `resources/subscribe` and `resources/unsubscribe` handlers to enable clients to monitor resource changes. Route `notifications/resources/updated` from backends to subscribed clients. Currently marked as `subscribe: false` in GatewayServer capabilities with a TODO comment.

- **Sampling Support**: Implement `sampling/createMessage` handler to allow backend servers to request LLM completions from the gateway. Route sampling requests through to clients, enabling agentic workflows where servers need direct LLM access without maintaining their own connection.

- **Elicitation Support**: Implement `elicitation/requestInput` handler to enable backend servers to request structured user input mid-operation. This is essential for servers that need confirmation or additional information during tool execution.

### Enhanced Features (Phase 2 - v1 Priority)

- **Parameter Completion**: Implement `completion/complete` handler to provide suggestions for tool and resource arguments. Improves developer experience when using the CLI or TUI.

- **Roots Management**: Implement `roots/list` handler and `roots/list_changed` notifications to share filesystem boundaries between clients and servers. Enables secure file access patterns.

- **Server Logging**: Implement `notifications/message` handler to route log messages from backend servers to connected clients. Provides observability into server-side operations.

### Versioning & Compatibility (Phase 3 - v1+)

- **Version Negotiation**: Document MCP protocol version compatibility, implement explicit version checks, and add graceful degradation for unsupported features. Ensure Goblin works with multiple SDK versions.

## Capabilities

### New Capabilities

- `resource-subscriptions`: Enable resource monitoring and change notifications via subscribe/unsubscribe pattern. Clients can subscribe to specific resource URIs and receive updates when those resources change. Gateway proxies subscriptions to appropriate backend servers and forwards notifications.

- `sampling-support`: Enable backend servers to request LLM completions from clients via `sampling/createMessage`. Gateway acts as a transparent proxy for sampling requests, maintaining the sampling context and policies. Supports sampling preferences and request batching.

- `elicitation-support`: Enable backend servers to request user input via `elicitation/requestInput`. Gateway routes elicitation requests to the appropriate client connection, handles prompt templates, and supports cancellation. Essential for interactive tool execution.

- `parameter-completion`: Enable argument completion for tools and resources via `completion/complete`. Gateway collects completion information from backend servers and routes completion requests. Supports partial argument matching and fuzzy suggestions.

- `roots-management`: Enable filesystem boundary sharing between clients and servers via `roots/list` and `roots/list_changed`. Gateway collects root information from clients and propagates to backend servers. Supports root capabilities (file patterns).

- `server-logging`: Enable log message routing from servers to clients via `notifications/message`. Gateway proxies log messages with appropriate levels (debug, info, warning, error). Supports log message formatting and filtering.

- `version-negotiation`: Explicit MCP protocol version handling and compatibility checks. Gateway advertises supported versions, validates incoming requests against versions, and provides clear error messages for version mismatches.

### Modified Capabilities

- `resource-aggregation`: Extend existing resource aggregation to support subscription proxying. Currently handles list/read operations; needs subscription tracking, notification forwarding, and subscription lifecycle management.

## Impact

### Affected Code

- `src/gateway/server.ts`: Add new request handlers for subscriptions, sampling, elicitation, completion, roots. Update capabilities to advertise new features. Add notification forwarding logic.

- `src/gateway/registry.ts`: Add subscription tracking for resources. Add roots collection from clients. Add sampling context management. Support elicitation routing.

- `src/gateway/router.ts`: Add routing logic for sampling requests. Add elicitation request routing. Add completion request routing. Add subscription routing by URI.

- `src/transport/http.ts`: Ensure HTTP transport supports streaming notifications for subscriptions and elicitation. May need connection state tracking.

- `src/transport/interface.ts`: May need to extend transport interface for subscription-aware connections.

- `src/gateway/types.ts`: Add types for subscription tracking, sampling requests, elicitation requests, completion requests, roots.

### MCP Capabilities Exposed

**Server Capabilities (to Clients):**
- `tools`: listChanged
- `prompts`: listChanged
- `resources`: listChanged, subscribe (currently false → true)
- `sampling`: (new)
- `elicitation`: (new)
- `completion`: (new)
- `roots`: (new)

**Client Capabilities (to Backends):**
- Full client capabilities for connecting to backend servers
- Subscription support for backends that support it
- Roots support for backends that support it

### User Impact

- **Positive**: Full MCP protocol compliance enables transparent gateway usage with any MCP client or server. Agentic workflows, interactive tools, and resource monitoring work as expected.

- **Risk**: New features increase complexity of subscription tracking and notification routing. Need careful handling of subscription lifecycle to avoid memory leaks.

- **Migration**: No breaking changes. All additions are opt-in features that don't affect existing functionality.

### Dependencies

- `@modelcontextprotocol/sdk`: Already at ^1.25.3, may need update for latest features
- Transport layer: HTTP/SSE must support streaming notifications
- Registry: Must track subscriptions and roots efficiently
- Router: Must route new request types correctly

### Security Considerations

- **Elicitation**: User input requests must be carefully routed to avoid confusion about which client should respond. Consider authentication and authorization for elicitation.

- **Sampling**: LLM completion requests should respect client sampling policies. Gateway should not modify sampling parameters without consent.

- **Roots**: Filesystem boundaries must be validated to prevent path traversal attacks. Only share explicitly configured roots.

- **Subscriptions**: Subscription tracking must be bounded to prevent memory exhaustion. Clean up subscriptions on disconnect.
