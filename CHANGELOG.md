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
  - Prometheus metrics for HTTP requests and transport pool
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
- Documentation updates reflecting v0.1.0 release state

### Changed
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
