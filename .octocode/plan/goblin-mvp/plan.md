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
- [ ] Implement gateway `McpServer` that exposes aggregated tools
- [ ] Handle `tools/list` by querying registry
- [ ] Handle `tools/call` by routing via Router
- [ ] Forward notifications from backends to clients
- [ ] Support compatibility mode (freeze tool list)

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
- [ ] Remove unsupported capabilities (`prompts`, `resources`) from GatewayServer
- [ ] Implement `Registry.subscribeToBackend` for dynamic updates
- [ ] Implement `GatewayServer.sendToolListChanged` notification
- [ ] Verify error handling consistency

**Acceptance:**
- Gateway advertises correct capabilities
- Tool list updates propagate from Backend -> Registry -> Gateway -> Client
- No protocol violation errors

---

### MVP-4: Extended Capabilities

**Dependencies:** MVP-3

#### MVP-4.1: Prompts Support
- [ ] Implement `Registry.listPrompts` and `Registry.getPrompt`
- [ ] Add `Prompts` handlers to `GatewayServer`
- [ ] Sync prompts from backends in `Registry`
- [ ] Aggregate prompts in `listPrompts` handler

**Acceptance:**
- Clients can list aggregated prompts
- Clients can retrieve prompt content

#### MVP-4.2: Resources Support
- [ ] Implement `Registry` support for Resources
- [ ] Add `Resources` handlers (`list`, `read`, `templates`) to `GatewayServer`
- [ ] Sync resources from backends
- [ ] Implement resource reading proxy

**Acceptance:**
- Clients can list resources
- Clients can read resources from backends via gateway

---

### MVP-5: Meta Tools

**Dependencies:** MVP-4

#### MVP-5.1: Core Meta Tools
- [ ] `catalog_list` - List all tools with compact cards
- [ ] `catalog_search` - Keyword search tools
- [ ] `describe_tool` - Get full schema for a tool
- [ ] `invoke_tool` - Call tool with validation (wrapper)
- [ ] `health` - Gateway and server health status

**Meta Tool Pattern (FastMCP-inspired):**
```typescript
const catalogList = defineMetaTool({
  name: "catalog_list",
  description: "List all available tools",
  parameters: z.object({
    serverId: z.string().optional(),
    compact: z.boolean().default(true),
  }),
  execute: async ({ serverId, compact }, ctx) => {
    const tools = ctx.registry.listTools(compact);
    return { tools: serverId ? tools.filter(t => t.serverId === serverId) : tools };
  },
});
```

**Acceptance:**
- Meta tools discoverable in tool list
- `catalog_list` returns compact cards
- `describe_tool` returns full JSON Schema
- `health` returns structured status

---

### MVP-6: Observability

**Dependencies:** MVP-3

#### MVP-6.1: Health Endpoints
- [ ] `GET /health` - Gateway health + per-server status
- [ ] Health check probes for each backend
- [ ] Degraded state detection

**Health Response:**
```json
{
  "status": "ok|degraded|down",
  "servers": [
    { "id": "backend-1", "status": "ok", "latencyMs": 12 }
  ]
}
```

#### MVP-6.2: Prometheus Metrics
- [ ] Request count per tool/server
- [ ] Latency histogram per endpoint
- [ ] Connection pool utilization
- [ ] Circuit breaker state (for v1 prep)

#### MVP-6.3: Structured Logging
- [ ] pino logger with JSON output
- [ ] Correlation IDs per request
- [ ] Redaction of sensitive fields
- [ ] Log levels configurable

**Acceptance:**
- `/health` returns correct status
- `/metrics` returns Prometheus format
- Logs include `requestId`, `serverId`, `toolId`

---

### MVP-7: TUI/CLI Skeleton

**Dependencies:** MVP-6

#### MVP-7.1: CLI Foundation
- [ ] CLI entry point with subcommands
- [ ] `goblin start` - Start gateway
- [ ] `goblin status` - Show health
- [ ] `goblin tools` - List tools
- [ ] `--json` flag for all commands

#### MVP-7.2: TUI Basic Views
- [ ] Main layout with 3 panes (servers, tools, logs)
- [ ] Server list with status indicators
- [ ] Tool list with search
- [ ] Log viewer (tail mode)
- [ ] Keyboard navigation (j/k, Enter, q)

**Acceptance:**
- `goblin start` launches gateway
- `goblin tools --json` outputs JSON
- TUI displays live server status
- TUI updates on config hot reload

---

### MVP-8: Virtual Tools (Basic)

**Dependencies:** MVP-5

#### MVP-8.1: Sequential Execution
- [ ] Parse virtual tool definitions from config
- [ ] Execute sub-ops sequentially
- [ ] Aggregate results into single response
- [ ] Timeout enforcement per virtual tool
- [ ] Stop-on-error semantics

**Virtual Tool Config:**
```json
{
  "id": "fetch_and_summarize",
  "ops": [
    { "tool": "web_fetch", "args": { "url": "{{input.url}}" } },
    { "tool": "summarize", "args": { "text": "{{prev.content}}" } }
  ],
  "timeoutMs": 60000,
  "stopOnError": true
}
```

**Acceptance:**
- Virtual tool executes 2+ sub-ops
- Results aggregated correctly
- Timeout terminates execution
- Error in sub-op stops chain (if configured)

---

## v1 Milestone

**Goal:** Production-ready with auth, RBAC, Skills, and admin tooling.

### v1-1: Authentication & RBAC

**Dependencies:** MVP complete

#### v1-1.1: OAuth 2.1 Support
- [ ] OAuth middleware for Hono
- [ ] Token validation (JWT)
- [ ] Scope extraction and enforcement
- [ ] Dev mode bypass option

#### v1-1.2: Role-Based Access Control
- [ ] Define roles: admin, operator, readonly, agent
- [ ] Map OAuth scopes to roles
- [ ] `canAccess` guards on tools (FastMCP pattern)
- [ ] Audit log for role-based actions

**Acceptance:**
- OAuth tokens validated correctly
- Admin tools require admin role
- Unauthorized attempts logged and rejected

---

### v1-2: Self-Configuration Tools

**Dependencies:** v1-1

#### v1-2.1: Basic Self-Config
- [ ] `list_servers` - List configured servers
- [ ] `enable_server` / `disable_server`
- [ ] `reload_config` - Force config reload
- [ ] All tools admin-scoped

#### v1-2.2: Advanced Self-Config
- [ ] `show_servers_config_schema` - Display JSON Schema
- [ ] `show_servers_config` - Get current config
- [ ] `set_servers_config` - Update config with validation

**Acceptance:**
- Admin can enable/disable servers via tools
- Config changes persisted and hot-reloaded
- All operations audited

---

### v1-3: Admin Approval Queue

**Dependencies:** v1-2

#### v1-3.1: Provisioning Queue
- [ ] Queue data structure (in-memory + optional SQLite)
- [ ] `provision_server` tool queues request
- [ ] Request metadata: source, risk score, diff preview
- [ ] Admin approval/rejection via TUI or tool

#### v1-3.2: Audit Trail
- [ ] Structured audit log for all admin actions
- [ ] Actor, timestamp, action, diff
- [ ] Export capability (JSON)
- [ ] Optional SQLite persistence

**Acceptance:**
- Provisioning requests visible in queue
- Only approved requests execute
- Full audit trail for compliance

---

### v1-4: Skills Service (Local)

**Dependencies:** v1-1

#### v1-4.1: Local Skill Indexing
- [ ] Scan local directories for SKILL.md files
- [ ] Parse skill metadata
- [ ] Build keyword index for search
- [ ] Cache skill data

#### v1-4.2: Skill Tools
- [ ] `find_skills` - Keyword search local skills
- [ ] `use_skill` - Load skill instructions
- [ ] `load_skill_resource` - Load specific files
- [ ] `list_skills` - Inventory view

**Acceptance:**
- Skills discovered from configured directories
- `find_skills` returns ranked results
- Progressive disclosure (metadata first)

---

### v1-5: Circuit Breaker & Rate Limiting

**Dependencies:** MVP complete

#### v1-5.1: Circuit Breaker
- [ ] Per-server circuit breaker state machine
- [ ] Configurable failure threshold
- [ ] Cooldown period before retry
- [ ] Metrics for trips/resets

#### v1-5.2: Rate Limiting
- [ ] Token bucket per server
- [ ] Per-API-key limits (if using API key auth)
- [ ] Configurable quotas
- [ ] 429 responses with retry-after

**Acceptance:**
- Circuit breaker trips after N failures
- Rate limit enforced correctly
- Metrics exposed for monitoring

---

### v1-6: SQLite Persistence

**Dependencies:** v1-3

#### v1-6.1: Optional SQLite Backend
- [ ] Schema for config, audit, sessions
- [ ] Migration system
- [ ] JSON <-> SQLite sync
- [ ] CLI command for migration

**Acceptance:**
- SQLite enabled via config
- Data survives restarts
- Migration between JSON and SQLite works

---

### v1-7: Enhanced TUI

**Dependencies:** v1-3, v1-5

#### v1-7.1: Admin Features
- [ ] Approval queue view
- [ ] Audit log viewer
- [ ] Server health dashboard
- [ ] Circuit breaker status

#### v1-7.2: MCP Browser
- [ ] Tool schema explorer
- [ ] Test invocation panel
- [ ] Resource browser
- [ ] Request/response inspector

**Acceptance:**
- TUI shows approval queue
- Can approve/reject from TUI
- Tool testing works

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
  ├── MVP-3.2 HTTP Server (Hono)
  └── MVP-3.3 Compliance Fixes
        │
        v
MVP-4 (Extended Capabilities)
  ├── MVP-4.1 Prompts
  └── MVP-4.2 Resources
        │
        ├───────────────────┐
        v                   v
MVP-5 (Meta Tools)    MVP-6 (Observability)
        │                   │
        └─────────┬─────────┘
                  v
        MVP-7 (TUI/CLI)
                  │
                  v
        MVP-8 (Virtual Tools)
                  │
    ══════════════╪═══════════════
    MVP COMPLETE  │
                  v
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
MVP-4 (Meta Tools)    MVP-5 (Observability)
        │                   │
        └─────────┬─────────┘
                  v
        MVP-6 (TUI/CLI)
                  │
                  v
        MVP-7 (Virtual Tools)
                  │
    ══════════════╪═══════════════
    MVP COMPLETE  │
                  v
        v1-1 (Auth & RBAC)
                  │
        ┌─────────┼─────────┐
        v         v         v
   v1-2       v1-4       v1-5
(Self-Config) (Skills)  (Circuit Breaker)
        │
        v
   v1-3 (Approval Queue)
        │
        v
   v1-6 (SQLite)
        │
        v
   v1-7 (Enhanced TUI)
```

---

## Patterns Reference (from FastMCP)

### Tool Registration Helper

```typescript
// Adopt FastMCP's declarative pattern
function defineMetaTool<T extends z.ZodType>(config: {
  name: string;
  description: string;
  parameters: T;
  canAccess?: (session: Session) => boolean;
  execute: (args: z.infer<T>, ctx: ToolContext) => Promise<ToolResult>;
}): MetaToolDefinition {
  return {
    ...config,
    schema: zodToJsonSchema(config.parameters),
  };
}
```

### Context Injection

```typescript
// Rich context passed to tool execution
interface ToolContext {
  log: Logger;
  session: Session;
  sessionId: string;
  registry: Registry;
  reportProgress: (progress: Progress) => Promise<void>;
}
```

### Content Helpers

```typescript
// Adopt FastMCP's media helpers
export async function imageContent(
  input: { url: string } | { path: string } | { buffer: Buffer }
): Promise<ImageContent> {
  const data = await resolveToBuffer(input);
  const mimeType = await detectMimeType(data);
  return { type: "image", data: data.toString("base64"), mimeType };
}
```

### Session Tracking

```typescript
// Session manager pattern
class SessionManager {
  private sessions = new Map<string, GoblinSession>();
  
  create(transport: Transport): GoblinSession {
    const id = crypto.randomUUID();
    const session = new GoblinSession(id, transport);
    this.sessions.set(id, session);
    return session;
  }
  
  get(id: string): GoblinSession | undefined {
    return this.sessions.get(id);
  }
  
  destroy(id: string): void {
    this.sessions.get(id)?.cleanup();
    this.sessions.delete(id);
  }
}
```

---

## Risk Areas

| Risk | Mitigation |
|------|------------|
| SDK v2 breaking changes | Pin to specific version, monitor releases |
| Zod version conflicts | Use single Zod version, test with SDK |
| SSE session state in multi-instance | Document limitation, sticky sessions |
| STDIO process zombies | Implement proper cleanup, process monitoring |
| Large tool response buffering | Stream responses, enforce size limits |

---

## Next Steps

1. **Bootstrap project** (MVP-1.1)
2. **Implement config system** (MVP-1.2)
3. **Add first transport adapter** (MVP-1.3)
4. **Iterate through MVP milestones**

---

*Created by Octocode MCP https://octocode.ai*
