# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-01-30

### Added
- **Complete MCP Gateway**: Production-ready gateway aggregating multiple MCP servers
  - Gateway Server with full MCP protocol implementation
  - Unified tool catalog with namespacing to prevent collisions
  - Dynamic tool discovery and synchronization
- **Extended Capabilities**: Full support for all MCP primitives
  - **Tools**: List and Call with intelligent routing
  - **Prompts**: List and Get prompts aggregated from backends  
  - **Resources**: List, Read, and Template support for resources
  - Full namespacing (`serverId_promptName`, `serverId_resourceName`)
- **HTTP Gateway**: Remote client connectivity via Hono framework
  - Server-Sent Events endpoint (`/sse`) for persistent connections
  - Messages endpoint (`/messages`) for JSON-RPC requests
  - Session management for multi-client support
  - Custom HonoSseTransport adapter for MCP SDK integration
- **Intelligent Router**: Request routing and execution policy enforcement
  - Namespaced tool calls (`server_tool`) routed to correct backend
  - Configurable timeout enforcement and error propagation
  - Request cancellation and graceful error handling
- **Tool Registry**: Central registry with event-driven discovery
  - Automatic tool synchronization with pagination support
  - Compact tool cards for efficient client discovery
  - Change event propagation for dynamic updates
- **Transport Layer**: Multi-transport support with connection management
  - **StdioTransport**: Local MCP server execution as child processes
  - **HttpTransport**: Remote MCP server connectivity
  - **TransportPool**: Connection pooling, lifecycle management, and reconnection logic
- **Configuration System**: Robust, hot-reloadable configuration
  - JSON Schema validation with editor autocomplete support
  - Atomic hot reload with rollback capability
  - OS-standard path resolution (XDG/Windows standards)
  - Environment variable override support
- **Production Observability**: Complete monitoring and logging stack
  - Structured JSON logging with Pino
  - Custom in-memory metrics registry (zero-dependency, developer-first)
  - JSON `/metrics` endpoint for local development debugging
  - Component-based loggers with proper context
  - Request tracing and performance monitoring
- **MCP Compliance**: Full protocol compliance with proper error handling
  - Removed advertising of unimplemented capabilities
  - Dynamic capability synchronization across gateway
  - Support for `notifications/tools/list_changed` propagation
  - Standard MCP error codes and messages
- **Development Tooling**: Complete development environment
  - 26 comprehensive unit and integration tests
  - TypeScript strict mode with full type safety
  - Biome for linting, formatting, and code quality
  - Hot reload development server with fast compilation
  - Full documentation and AGENTS.md for AI assistance

### Added
- **HTTP Gateway**: Hono-based HTTP server for remote client connections
  - SSE endpoint (`/sse`) for persistent server-sent events
  - Messages endpoint (`/messages`) for client JSON-RPC requests
  - Session management for multi-client support
  - Custom `HonoSseTransport` adapter for SDK integration
- **Gateway Server**: Core MCP server implementation for downstream clients
  - Aggregates tools from all backend servers into a unified catalog
  - Dynamically handles tool listing and execution requests
  - Maps routing errors to standard MCP error codes
- **Tool Router**: Intelligent request routing and execution policy enforcement
  - Routes namespaced tool calls (`server_tool`) to correct backend
  - Enforces execution timeouts via configuration
  - Handles request cancellation and error propagation
- **Tool Registry**: Central registry for discovering and syncing tools from backend servers
  - Automatic tool synchronization with pagination support
  - Tool namespacing (`serverId_toolName`) to prevent collisions
  - Compact tool cards for efficient listing
  - Event-driven updates (`change` event)
- **Transport Layer**: Core abstraction for connecting to backend MCP servers
  - `StdioTransport`: Support for spawning local MCP servers as child processes
  - `HttpTransport`: Support for connecting to remote MCP servers via SSE/HTTP
  - `TransportPool`: Connection pooling and lifecycle management
- **Configuration System**: Robust config loading with Zod validation
- **Hot Reload**: Automatic config reloading with atomic updates and rollback
- **JSON Schema**: Auto-generated schema for editor autocomplete and validation
- **OS-Standard Paths**: Config file resolution using XDG/OS standards via `env-paths`
- Initial project structure with Bun, TypeScript, and Hono
- Structured logging with Pino
- OpenSpec workflow integration for spec-driven development
- AI coding agent instructions (AGENTS.md)
- Project documentation (README, LICENSE, CHANGELOG, CONTRIBUTE, MAINTAINERS)

### Changed
- N/A

### Deprecated
- N/A

### Removed
- N/A

### Fixed
- N/A

### Security
- N/A

## [Unreleased]

### Added
- **CLI Commands**: Comprehensive command-line interface for gateway management
  - `goblin start`: Start the Gateway with optional TUI mode, port, and config path
  - `goblin status`: Show gateway status with server count, tool count, health metrics
  - `goblin tools`: List available tools with server filtering and search capabilities
  - `goblin servers`: List configured servers with status, transport type, and tool count
  - `goblin config validate`: Validate configuration files with JSON output support
  - `goblin config show`: Display current configuration with JSON output support
  - `goblin logs`: Show recent logs with tail, follow, level filter, and JSON output
  - `goblin health`: Show detailed health status with per-server metrics and latency
  - Built with Commander.js for robust CLI argument parsing
  - JSON output mode for programmatic integration
  - Hot reload support via config watcher integration
- **HTTP Gateway Endpoints**: Additional endpoints for CLI and monitoring integration
  - `GET /status`: Returns health, metrics, server stats, and uptime information
  - `GET /tools`: Returns tool list with server and search filtering
  - `GET /servers`: Returns server list with status and connection info
- **Resource Subscriptions**: Full MCP resource subscription support
  - `SubscriptionManager` class for tracking client subscriptions
  - `resources/subscribe` request handler for subscribing to resource changes
  - `resources/unsubscribe` request handler for removing subscriptions
  - `notifications/resources/updated` handler for forwarding updates to subscribed clients
  - Subscription limits per client (default: 100 subscriptions)
  - Automatic subscription cleanup on client disconnect
  - 30 comprehensive unit tests for SubscriptionManager
- **Prompt Meta Tools**: Discovery and management tools for MCP prompts
  - `catalog_prompts`: List all prompts with compact cards (name, description, arguments)
  - `describe_prompt`: Get detailed information about a specific prompt
  - `search_prompts`: Fuzzy search prompts by name or description
  - All tools support server filtering and return namespaced prompt IDs
- **Resource Namespacing**: URI namespacing to prevent resource URI collisions
  - `namespaceUri()` function to create namespaced URIs in `mcp://{serverId}/{encodedUri}` format
  - `parseNamespacedUri()` function to extract server ID and original URI from namespaced URIs
  - Registry updated to store resources with namespaced URIs
  - Template matching support for dynamic resource routing
- **Resource Meta Tools**: Discovery and management tools for MCP resources
  - `catalog_resources`: List all resources with compact cards (uri, description, mimeType, serverId)
  - `describe_resource`: Get detailed information about a specific resource
  - `search_resources`: Fuzzy search resources by URI or description
  - `catalog_resource_templates`: List all resource templates with compact cards
  - All tools support server and MIME type filtering
- **TUI Resources Panel**: Interactive TUI panel for resource management
  - Display resources with server and MIME type filtering
  - Keyboard navigation for resource selection
  - URI display for selected resources
  - Consistent styling with Tools and Prompts panels
- **TUI Real Gateway Integration**: Refactored TUI to use real gateway state instead of mock data
  - Removed MOCK_SERVERS, MOCK_LOGS, MOCK_PROMPTS, MOCK_RESOURCES from all panels
  - Created `useGatewayData` hook for reactive gateway state management
  - ServersPane now displays real data from `transportPool.getHealth()`
  - PromptsPanel displays real prompts from `registry.getAllPrompts()`
  - ResourcesPanel displays real resources from `registry.getAllResources()`
  - LogsPane shows real gateway activity logs with level indicators
  - Gateway instance passed to TUI via `start --tui` command
  - Automatic data refresh on registry change events
  - Added `react-devtools-core` dependency for ink TUI runtime
  - Renamed `start.ts` to `start.tsx` for JSX support

### Changed
- **Build Configuration**: Updated build targets for Node.js compatibility
  - Changed `--target bun` to `--target node` for cross-platform support
  - Added separate `build:cli` script for CLI binary compilation
  - CLI now runs with Node.js (>=20.0.0) instead of requiring Bun runtime
  - Updated `start` script to use `node dist/index.js` for production
- **Connection Pooling**: Added `pendingConnections` Map to track in-flight connection attempts and prevent duplicate connection requests for the same server
- **Build Optimization**: Updated build script with `--minify` and `--sourcemap=external` flags for production builds (reduces bundle size and separates source maps)
- **Error Handling**: Implemented structured error class hierarchy with `GoblinError` base class and type-specific subclasses (`ToolNotFoundError`, `ServerNotFoundError`, `ConnectionError`, `RequestTimeoutError`, etc.)
- **Metadata Search**: Implemented lazy-initialized MiniSearch index in Registry with incremental updates on tool changes (eliminates per-request index rebuild bottleneck)
- **Metrics Refactor**: Replaced `prom-client` with custom in-memory metrics registry for developer-first observability
  - Zero external dependencies for metrics
  - JSON `/metrics` endpoint for local development
  - Reduced bundle size by removing prom-client
  - Custom Counter, Gauge, Histogram implementations with label support
- **Enhanced Logging**: Comprehensive pino enhancement with developer-first features
  - Configurable log level via config file or environment variables
  - Pretty-print mode for development (colorized, human-readable)
  - JSON format for production (log aggregation compatible)
  - Sensitive data redaction (passwords, tokens, API keys)
  - TUI log buffer integration for real-time log viewing
  - Request/response logging middleware with correlation IDs
  - File destination support with path resolution (~, env vars)
  - Added `pino-pretty` dev dependency for development mode
- **Logging Best Practices**: Consistent logging patterns and conventions across codebase
  - Error code system (CONN-*, TOOL-*, CFG-*, TRANSPORT-*, etc.) for structured error logging
  - Request correlation ID propagation for distributed tracing
  - Standardized log message conventions (action-oriented past tense)
  - Structured context patterns for different operation types
  - Component naming standards (kebab-case reflecting directory structure)
  - Log level discipline guidelines (trace, debug, info, warn, error, fatal)
  - AGENTS.md documentation with comprehensive logging examples
- **Test Suite**: Expanded to 81 comprehensive unit and integration tests
- Updated README.md to accurately represent implemented features
- Updated CHANGELOG.md with complete v0.1.0 feature summary

---

## Release Guidelines

### Version Numbering
- **Major (X.0.0)**: Breaking changes, major architectural changes
- **Minor (0.X.0)**: New features, backward-compatible changes
- **Patch (0.0.X)**: Bug fixes, documentation updates

### Changelog Sections
- **Added**: New features
- **Changed**: Changes in existing functionality
- **Deprecated**: Soon-to-be removed features
- **Removed**: Removed features
- **Fixed**: Bug fixes
- **Security**: Security improvements or fixes

[Unreleased]: https://github.com/TalkingThreads/goblin/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/TalkingThreads/goblin/releases/tag/v0.1.0
