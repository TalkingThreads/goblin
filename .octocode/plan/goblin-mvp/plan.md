<!-- GUIDANCE:START -->
# ⚠️ Agent Instructions
1. **Check Unknowns:** Before starting any task, verify requirements against `docs/GOBLIN.md`. The plan is a roadmap, but the doc is the specification.
2. **Clarify Ambiguity:** If a task description is vague, consult the detailed feature specifications in `docs/GOBLIN.md` or ask the user.
3. **Plan Updates:** If you discover missing features during implementation, update this plan to reflect reality.
<!-- GUIDANCE:END -->

# Goblin MCP - Implementation Plan

> Full roadmap: MVP + v1 milestones

## Executive Summary

**Goblin MCP** is a developer-first MCP gateway that aggregates multiple backend MCP servers behind a single unified endpoint. This plan covers the complete implementation from zero to v1, with clear dependencies and acceptance criteria.

## Technology Stack

| Layer | Technology | Version | Rationale |
|-------|------------|---------|-----------|
| Runtime | Bun | ^1.1 | Fast, TS-native, good DX |
| MCP Core | `@modelcontextprotocol/sdk` | ^2.x | Official SDK with Server + Client APIs |
| HTTP Server | Hono | ^4.x | Best middleware ecosystem, SSE support, Bun-optimized |
| TUI Framework | Ink | ^5.x | React-based, Flexbox layouts, async updates |
| Validation | Zod | ^3.x | Schema-first, SDK compatible |
| Config Watch | `Bun.file().watch()` | Native | Performant file watching |
| Logging | pino | ^9.x | Structured JSON logs, fast |
| Metrics | prom-client | ^15.x | Prometheus-compatible |

## Project Structure

```
goblin/
├── src/
│   ├── index.ts                 # Entry point
│   ├── gateway/
│   │   ├── server.ts            # MCP Server (to clients)
│   │   ├── client-manager.ts    # Backend client pool
│   │   ├── registry.ts          # Tool/server registry
│   │   └── router.ts            # Tool routing + cache
│   ├── transport/
│   │   ├── interface.ts         # Transport abstraction
│   │   ├── stdio.ts             # STDIO adapter
│   │   ├── http.ts              # Hono + SSE/Streamable HTTP
│   │   └── pool.ts              # Connection pooling
│   ├── config/
│   │   ├── schema.ts            # Zod schema
│   │   ├── loader.ts            # Load + validate
│   │   ├── watcher.ts           # Hot reload
│   │   └── types.ts             # Config types
│   ├── tools/
│   │   ├── meta/                # Meta tools (catalog, invoke, health)
│   │   └── virtual/             # Virtual tool engine
│   ├── observability/
│   │   ├── health.ts            # Health endpoints
│   │   ├── metrics.ts           # Prometheus metrics
│   │   └── logger.ts            # Structured logging
│   ├── tui/
│   │   ├── App.tsx              # Main TUI component
│   │   ├── components/          # UI components
│   │   └── hooks/               # Custom hooks
│   └── cli/
│       ├── index.ts             # CLI entry
│       └── commands/            # CLI commands
├── config/
│   └── goblin.schema.json       # JSON Schema for config
├── docs/
│   └── GOBLIN.md                # Specification
├── tests/
├── package.json
├── tsconfig.json
└── bunfig.toml
```

---

## MVP Milestone

**Goal:** Working gateway that aggregates backends, routes tools, and provides basic observability.

### MVP-1: Core Gateway Foundation

**Dependencies:** None (starting point)

#### MVP-1.1: Project Bootstrap
- [X] Initialize Bun project with TypeScript
- [X] Configure `tsconfig.json` for strict mode
- [X] Add dependencies: `@modelcontextprotocol/sdk`, `hono`, `zod`, `pino`
- [X] Create directory structure
- [X] Setup biome for linting/formatting

**Acceptance:**
- `bun run build` compiles without errors
- `bun run lint` passes

#### MVP-1.2: Config System
- [X] Define Zod schema for config (`src/config/schema.ts`)
- [X] Implement config loader with validation (`src/config/loader.ts`)
- [X] Implement hot reload with `Bun.file().watch()` (`src/config/watcher.ts`)
- [X] Atomic apply with rollback on validation failure
- [X] Generate JSON Schema from Zod for editor support

**Config Shape:**
```typescript
const ConfigSchema = z.object({
  servers: z.array(ServerConfigSchema),
  virtualTools: z.array(VirtualToolSchema).optional(),
  gateway: z.object({
    port: z.number().default(3000),
    host: z.string().default("127.0.0.1"),
  }),
  auth: z.object({
    mode: z.enum(["dev", "apikey"]).default("dev"),
    apiKey: z.string().optional(),
  }),
  policies: z.object({
    outputSizeLimit: z.number().default(65536),
    defaultTimeout: z.number().default(30000),
  }),
});
```

**Acceptance:**
- Config loads from `~/.goblin/config.json`
- Invalid config rejected with clear error message
- File change triggers reload within 500ms
- Previous config restored on validation failure

#### MVP-1.3: Transport Layer
- [X] Define `Transport` interface (`src/transport/interface.ts`)
- [X] Implement STDIO adapter for spawning child processes
- [X] Implement HTTP client transport using SDK's `StreamableHTTPClientTransport`
- [X] Basic connection pooling with health checks

**Transport Interface:**
```typescript
interface Transport {
  readonly type: "stdio" | "http" | "sse";
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  getClient(): Client;
}
```

**Acceptance:**
- Can connect to a backend via STDIO (spawn process)
- Can connect to a backend via HTTP
- Connection pool reuses healthy connections
- Failed connections trigger backoff retry

---

### MVP-2: Registry and Routing

**Dependencies:** MVP-1

#### MVP-2.1: Tool Registry
- [X] Implement `Registry` class (`src/gateway/registry.ts`)
- [X] Store compact capability cards (name, description, server)
- [X] Lazy-load full schemas on demand
- [X] Support tool aliasing (external name -> internal)
- [X] Enable/disable tools via config

**Registry API:**
```typescript
class Registry {
  addServer(id: string, client: Client): Promise<void>;
  removeServer(id: string): Promise<void>;
  listTools(compact?: boolean): ToolCard[];
  getToolSchema(toolName: string): ToolSchema | null;
  resolveAlias(externalName: string): { serverId: string; toolName: string };
}
```

**Acceptance:**
- Registry aggregates tools from 2+ backends
- Compact cards returned in <10ms
- Full schema fetched lazily on first request
- Alias resolution works correctly

#### MVP-2.2: Tool Router
- [X] Implement `Router` class (`src/gateway/router.ts`)
- [X] Routing cache with TTL and invalidation
- [X] Forward tool invocations to correct backend
- [X] Per-request timeout enforcement
- [X] Namespace tool names (`serverId_toolName`) for uniqueness

**Router API:**
```typescript
class Router {
  route(toolName: string, args: unknown): Promise<CallToolResult>;
  invalidateCache(serverId?: string): void;
}
```

**Acceptance:**
- Tool calls routed to correct backend
- Cache hit rate exposed as metric
- Timeout triggers structured error response
- Cache invalidates on server add/remove

---

### MVP-3: Gateway Server

**Dependencies:** MVP-2

#### MVP-3.1: MCP Server (to clients)
- [X] Implement gateway `McpServer` that exposes aggregated tools
- [X] Handle `tools/list` by querying registry
- [X] Handle `tools/call` by routing via Router
- [X] Forward notifications from backends to clients
- [X] Support compatibility mode (freeze tool list)

**Acceptance:**
- Client connects and lists tools from all backends
- Tool invocation works end-to-end
- Notifications forwarded correctly
- Compatibility mode hides dynamic updates

#### MVP-3.2: HTTP Server (Hono)
- [X] Setup Hono app with middleware
- [X] Implement `/sse` endpoint for MCP SSE transport
- [X] Implement `/api/v1/messages` for Streamable HTTP
- [X] Session tracking per connection
- [X] Basic request logging middleware

**Acceptance:**
- MCP client connects via SSE
- Multi-client sessions tracked independently
- Request/response logged with correlation IDs

#### MVP-3.3: Compliance Fixes
- [X] Remove unsupported capabilities (`prompts`, `resources`) from GatewayServer
- [X] Implement `Registry.subscribeToBackend` for dynamic updates
- [X] Implement `GatewayServer.sendToolListChanged` notification
- [X] Verify error handling consistency

**Acceptance:**
- Gateway advertises correct capabilities
- Tool list updates propagate from Backend -> Registry -> Gateway -> Client
- No protocol violation errors
- Gateway advertises correct capabilities
- Tool list updates propagate from Backend -> Registry -> Gateway -> Client
- No protocol violation errors

---

### MVP-4: Extended Capabilities

**Dependencies:** MVP-3

#### MVP-4.1: Prompts Support
- [X] Implement `Registry.listPrompts` and `Registry.getPrompt`
- [X] Add `Prompts` handlers to `GatewayServer`
- [X] Sync prompts from backends in `Registry`
- [X] Aggregate prompts in `listPrompts` handler

**Acceptance:**
- Clients can list aggregated prompts
- Clients can retrieve prompt content

#### MVP-4.2: Resources Support
- [X] Implement `Registry` support for Resources
- [X] Add `Resources` handlers (`list`, `read`, `templates`) to `GatewayServer`
- [X] Sync resources from backends
- [X] Implement resource reading proxy

**Acceptance:**
- Clients can list resources
- Clients can read resources from backends via gateway

---

### MVP-5: Meta Tools

**Dependencies:** MVP-4

#### MVP-5.1: Core Meta Tools
- [X] `search_servers` - Advanced search (fuzzy/keyword) for MCP servers
- [X] `describe_server` - Get detailed info about a server
- [X] `catalog_list` - List all tools with "Compact Cards" (summarized)
- [X] `catalog_search` - Advanced search (fuzzy/keyword) for tools
- [X] `describe_tool` - Get full schema for a tool
- [X] `invoke_tool` - Call tool with validation (wrapper)
- [X] `health` - Gateway and server health status

**Search Implementation:**
- Use `minisearch` for lightweight full-text/fuzzy search.
- Index name, description, and server ID.

**Compact Card Definition:**
```typescript
interface ToolCompactCard {
  name: string;
  summary: string; // Truncated/first-sentence description
  args: string[];  // Argument names only
  serverId: string;
}
```

**Acceptance:**
- Meta tools discoverable in tool list
- `catalog_list` returns compact cards
- `describe_tool` returns full JSON Schema
- `health` returns structured status

---

### MVP-6: Observability & Optimization

**Dependencies:** MVP-3

#### MVP-6.1: Health & Metrics
- [ ] `GET /health` - Gateway health + per-server status
- [ ] Prometheus metrics (requests, latency, pool, circuit breaker)
- [ ] Structured logging (pino, correlation IDs, redaction)

#### MVP-6.2: Lazy Loading Policies
- [ ] Implement `Stateless` mode (connect per call)
- [ ] Implement `Stateful` mode (keep connected)
- [ ] Implement `Smart` mode (idle eviction)
- [ ] Configurable idle timeouts

**Acceptance:**
- `/health` returns correct status
- Metrics exposed in Prometheus format
- Servers unload after idle timeout (if Smart/Stateless)

---

### MVP-7: TUI/CLI Skeleton

**Dependencies:** MVP-6

#### MVP-7.1: CLI Foundation
- [ ] CLI entry point (`goblin start`, `status`, `tools`)
- [ ] JSON output flag

#### MVP-7.2: TUI Basic Views
- [ ] Main layout (servers, tools, logs)
- [ ] Live status updates
- [ ] Log viewer

---

### MVP-8: Virtual Tools (Basic)

**Dependencies:** MVP-5

#### MVP-8.1: Sequential Execution
- [ ] Parse virtual tool definitions
- [ ] Execute sub-ops sequentially
- [ ] Result aggregation
- [ ] Timeout/Error handling

---

## v1 Milestone

**Goal:** Production-ready with auth, RBAC, Skills, and admin tooling.

### v1-1: Authentication & RBAC

**Dependencies:** MVP complete

#### v1-1.1: OAuth 2.1 Support
- [ ] OAuth middleware (Hono)
- [ ] Token validation (JWT)
- [ ] Scope enforcement

#### v1-1.2: Role-Based Access Control
- [ ] Roles: admin, operator, readonly, agent
- [ ] Map scopes to roles
- [ ] `canAccess` guards

---

### v1-2: Self-Configuration Tools

**Dependencies:** v1-1

#### v1-2.1: Basic Self-Config
- [ ] `list_servers` - List servers
- [ ] `discover_servers` - Find servers in marketplace
- [ ] `provision_server` - Install/configure server
- [ ] `enable_server` / `disable_server`
- [ ] `remove_server`
- [ ] `reload_config`

#### v1-2.2: Advanced Self-Config
- [ ] `show_servers_config_schema` - Display JSON Schema
- [ ] `show_servers_config` - Get current config
- [ ] `set_servers_config` - Update config with validation

---

### v1-3: Admin Approval Queue

**Dependencies:** v1-2

#### v1-3.1: Provisioning Queue
- [ ] In-memory queue + optional SQLite
- [ ] `provision_server` queues requests
- [ ] Admin approval UI/API

#### v1-3.2: Audit Trail
- [ ] Structured audit logs
- [ ] Export capability

---

### v1-4: Skills Service (Local)

**Dependencies:** v1-1

#### v1-4.1: NLP & Search Foundation
- [ ] Install `@orama/orama` for hybrid search
- [ ] Install `@nlpjs/{core,lang-en,ner,utils,similarity}`
- [ ] Implement `TextRankSummarizer` for smart descriptions
- [ ] Define `ToolCompactCard` with summary and intent score

#### v1-4.2: Skill Indexing
- [ ] Scan local directories/GitHub
- [ ] Parse `SKILL.md`
- [ ] Index content in Orama (Schema: title, description, content)
- [ ] Train NLP.js manager on skill intents

#### v1-4.3: Skill Tools
- [ ] `find_skills` - Hybrid search (Orama) + Intent matching (NLP.js)
- [ ] `discover_skills` - Semantic search (marketplace)
- [ ] `retrieve_skill` - Download/install skill
- [ ] `use_skill` - Load instructions/resources
- [ ] `load_skill_resource` - Load specific files
- [ ] `list_skills` - Inventory view

**Acceptance:**
- Skills discovered from configured directories
- `find_skills` returns ranked results (Orama score + NLP intent confidence)
- Summaries generated via TextRank (<10ms)

---

### v1-5: Reliability

**Dependencies:** MVP complete

#### v1-5.1: Circuit Breaker & Rate Limiting
- [ ] Per-server circuit breaker
- [ ] Token bucket rate limiting

---

### v1-6: SQLite Persistence

**Dependencies:** v1-3

#### v1-6.1: Optional SQLite Backend
- [ ] Config/Audit/Session persistence
- [ ] Migration system

---

### v1-7: Enhanced TUI

**Dependencies:** v1-3, v1-5

#### v1-7.1: Admin Features
- [ ] Approval queue view
- [ ] Audit log viewer
- [ ] Health dashboard

#### v1-7.2: MCP Browser
- [ ] Schema explorer
- [ ] Test invocation panel

---

### v1-8: Kits Management

**Dependencies:** v1-4

#### v1-8.1: Kits Tools
- [ ] `load_kit` - Load bundle
- [ ] `unload_kit` - Remove bundle
- [ ] `list_kits` - Inventory
- [ ] `search_kit` - Semantic search
- [ ] `kit_info` - Metadata

---

## Dependency Graph

```
MVP-1 (Foundation)
  ├── MVP-1.1 Bootstrap
  ├── MVP-1.2 Config ──────────────────────┐
  └── MVP-1.3 Transport                    │
        │                                   │
        v                                   │
MVP-2 (Registry)                            │
  ├── MVP-2.1 Registry <────────────────────┘
  └── MVP-2.2 Router
        │
        v
MVP-3 (Gateway Server)
  ├── MVP-3.1 MCP Server
  └── MVP-3.2 HTTP Server (Hono)
        │
        ├───────────────────┐
        v                   v
MVP-4 (Extended)      MVP-6 (Observability)
  │                     │
  └─────────┬───────────┘
            v
MVP-5 (Meta Tools)
            │
            v
MVP-7 (TUI/CLI)
            │
            v
MVP-8 (Virtual Tools)
            │
    ══════════════╪═══════════════
    MVP COMPLETE  │
                  v
        v1-1 (Auth & RBAC)
                  │
        ┌─────────┼─────────┐
        v         v         v
   v1-2       v1-4       v1-5
(Self-Config) (Skills)  (Reliability)
        │         │
        v         v
   v1-3       v1-8
(Approval)    (Kits)
        │
        v
   v1-6 (SQLite)
        │
        v
   v1-7 (Enhanced TUI)
```

---

*Created by Octocode MCP https://octocode.ai*
