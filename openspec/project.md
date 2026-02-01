# Project Context

## Purpose

**Goblin MCP** is a developer-first MCP (Model Context Protocol) gateway that aggregates multiple MCP servers behind a single unified endpoint. It provides:

1. A single MCP endpoint aggregating many backend tool servers
2. Fine-grained control over tool exposure and aliasing
3. Secure, auditable tool invocation with admin approval workflows
4. Low-friction discovery and provisioning of new capabilities

The project exists to solve tool sprawl, context bloat, and brittle integrations in agentic AI systems.

## Tech Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Runtime | Bun | ^1.1 |
| MCP Core | @modelcontextprotocol/sdk | ^2.x |
| HTTP Server | Hono | ^4.x |
| TUI Framework | Ink | ^5.x |
| Validation | Zod | ^3.x |
| Logging | pino | ^9.x |
| Metrics | prom-client | ^15.x |

## Project Conventions

### Code Style

- **Formatting**: Use Biome for linting and formatting
- **Naming**:
  - Files: kebab-case (`tool-registry.ts`)
  - Classes: PascalCase (`ToolRegistry`)
  - Functions/variables: camelCase (`listTools`)
  - MCP tools: snake_case (`catalog_list`, `invoke_tool`)
  - Config keys: camelCase in JSON
- **Imports**: Use explicit file extensions (`.js` for ESM compatibility)
- **Types**: Prefer Zod schemas as source of truth, derive TypeScript types

### Architecture Patterns

- **Gateway Pattern**: Goblin is a Server to clients and Client[] to backends
- **Registry Pattern**: Central registry indexes all tools with compact capability cards
- **Transport Abstraction**: Common interface for STDIO, SSE, HTTP transports
- **Config-Driven**: All behavior configurable via JSON with hot reload
- **Meta-Tool Oriented**: Features exposed via small set of meta-tools to reduce context

### Testing Strategy

- **Unit Tests**: Bun test for isolated components (registry, router, config)
- **Integration Tests**: Vitest for transport and protocol conformance
- **E2E Tests**: Test gateway with mock MCP backends
- **Protocol Conformance**: Validate against MCP specification

### Git Workflow

- **Branches**: 
  - `main` - stable, deployable
  - `feature/*` - new features
  - `fix/*` - bug fixes
- **Commits**: Conventional commits (`feat:`, `fix:`, `docs:`, `refactor:`)
- **PRs**: Require spec changes for new features, link to openspec changes

## Domain Context

### MCP Protocol

- **JSON-RPC 2.0**: All MCP communication uses JSON-RPC 2.0
- **Message Types**: Tools, Resources, Prompts, Notifications
- **Transports**: STDIO (child processes), SSE (legacy), Streamable HTTP (modern)
- **Sessions**: Stateful connections with capability negotiation

### Key Concepts

- **Backend Server**: An MCP server that Goblin connects to as a client
- **Tool**: An invokable function exposed via MCP protocol
- **Compact Card**: Minimal tool metadata (name, description) for context efficiency
- **Full Schema**: Complete JSON Schema for tool parameters
- **Virtual Tool**: Composite tool that chains multiple backend tools
- **Meta Tool**: Gateway-provided tool for discovery and orchestration

### Lifecycle Modes

- **Stateless**: Spawn backend per call, terminate after
- **Stateful**: Connect once, keep connection alive
- **Smart**: Load on demand, evict on idle timeout

## Important Constraints

### Security

- **Secure by default**: Minimal exposure, self-provisioning disabled
- **Admin approval**: Provisioning requests require explicit approval
- **No hardcoded secrets**: All credentials via config or environment
- **Audit trail**: All admin actions logged with actor and timestamp

### Performance

- **Latency target**: <50ms overhead for simple metadata calls
- **Streaming**: Large payloads streamed, not buffered
- **Connection pooling**: Reuse backend connections
- **Routing cache**: Cache tool→backend resolution

### Compatibility

- **MCP Protocol**: Follow spec, document any deviations
- **Legacy clients**: Compatibility mode freezes tool list
- **Config schema**: Backwards compatible, migrations for breaking changes

## External Dependencies

### MCP SDK

- Repository: `modelcontextprotocol/typescript-sdk`
- Used for: Server class, Client class, Transport interfaces
- Note: v2 in alpha, removes server-side SSE

### Hono

- Repository: `honojs/hono`
- Used for: HTTP server, middleware, SSE streaming
- Middleware: auth, logging, rate limiting, Zod validation

### Ink

- Repository: `vadimdemedes/ink`
- Used for: Terminal UI with React components
- Note: Hijacks stdout, capture logs to state

## Reference Documents

- `docs/GOBLIN.md` - Full specification document
- `.octocode/plan/goblin-mvp/plan.md` - Implementation roadmap
- `.octocode/plan/goblin-mvp/research.md` - Technology research
