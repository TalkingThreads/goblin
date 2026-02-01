## Why

Goblin acts as a transparent MCP gateway that aggregates multiple backend servers. Users interact with Goblin as if it were a single MCP server, unaware of the aggregation layer. For Goblin to provide true transparency, it must expose ALL capabilities that backend servers offer—including Resources. Currently, Resources have partial infrastructure but lack critical features like namespacing, URI template matching, and subscription proxying. Without these, users will encounter URI collisions, cannot access dynamic resources, and won't receive change notifications.

## What Changes

### New Capabilities
- **Complete Resource Namespacing**: Store resources with `${serverId}_` prefix to prevent URI collisions across backends, matching Tools/Prompts pattern
- **URI Template Matching**: Implement RFC 6570 URI template resolution to support dynamic resource templates from backends
- **Subscription Proxying**: Enable `resources/subscribe` and `resources/unsubscribe` with proper routing to backend servers
- **Resource Meta Tools**: Add `catalog_resources`, `describe_resource`, `search_resources`, and `catalog_resource_templates` for discovery
- **TUI Integration**: Add Resources panel alongside Tools/Prompts panels for visualization and management

### Implementation Changes
- **Registry Updates**: Enhance `Registry` with namespaced storage, template matching, and subscription tracking
- **Router Updates**: Implement resource subscription routing and fix metrics labeling
- **Server Updates**: Enable subscription handlers and add notification propagation for resources
- **Error Handling**: Add resource-specific error codes (RES-*)

### Breaking Changes
- **None**: Changes are additive; existing tools/prompts behavior unchanged

## Capabilities

### New Capabilities
- `resource-aggregation`: Complete resource and resource template aggregation from multiple backend servers, following the same sync→namespace→cache→route→notify pattern as Tools and Prompts
- `resource-namespacing`: URI namespacing with `${serverId}_` prefix to prevent collisions when multiple servers expose same URIs
- `resource-template-matching`: RFC 6570 URI template resolution for dynamic resource access
- `resource-subscription`: Proxy resource subscriptions with proper routing and notification forwarding
- `resource-meta-tools`: Discovery meta tools for resources and templates (catalog_resources, describe_resource, search_resources, catalog_resource_templates)
- `resource-tui-integration`: TUI panel for resource management and visualization

### Modified Capabilities
- **None**: No existing spec-level requirements being changed

## Impact

### Affected Code
- `src/gateway/types.ts`: Add namespaced ResourceEntry, enhance ResourceTemplateEntry
- `src/gateway/registry.ts`: Add namespaced storage, template matching, subscription tracking
- `src/gateway/router.ts`: Add subscription routing, fix metrics labels
- `src/gateway/server.ts`: Enable subscription handlers, add notification propagation
- `src/meta/`: Add resource meta tools
- `src/tui/`: Add resources panel

### MCP Capabilities Exposed
- `resources/list` (already exists)
- `resources/read` (already exists)
- `resources/templates/list` (already exists)
- `resources/subscribe` (new - currently disabled)
- `resources/unsubscribe` (new - currently disabled)
- `notifications/resources/updated` (new - needs forwarding)
- `notifications/resources/list_changed` (already exists)

### User Impact
- Users can discover and access ALL resources from aggregated servers
- No URI collisions when multiple servers expose same-named resources
- Receive notifications when subscribed resources change
- Can search and browse resources via TUI and meta tools

### Security Considerations
- Subscription routing requires maintaining client→resource→backend mapping
- URI validation to prevent request smuggling between backends
- Resource content type handling for blob resources (base64 encoding)
