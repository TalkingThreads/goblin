# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
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

## [0.1.0] - YYYY-MM-DD

### Added
- Initial release (placeholder - not yet released)

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
