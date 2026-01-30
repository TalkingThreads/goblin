# Goblin

> Your "bunch of goblin in a trenchcoat" for AI agents.

## 1. Project Statement

**Goblin MCP** is an opinionated, developer‑first MCP (Model Context Protocol) gateway and toolkit that aggregates and manages multiple MCP servers behind a single unified endpoint. It combines a lightweight MCP server, a TUI/CLI for configuration and observability, and an agentic “Skills” service that enables dynamic, lazy‑loading tool discovery and secure self‑service provisioning. Goblin acts as a transparent proxy and meta‑tool layer so any MCP client can interact with a rich, curated set of backend tools without being aware of the underlying complexity.

**Why it exists.** Modern agent tooling is split between heavyweight enterprise platforms and fragile hobby projects; developers need a pragmatic, secure, and performant bridge that solves tool sprawl, context bloat, and brittle integrations. Goblin exists to make tool orchestration predictable and efficient for agent workflows, to let LLMs and developers discover and provision tools safely, and to provide a small, composable runtime that fits developer workflows rather than enterprise procurement cycles.

**User base and problem solved.** Primary users are developers, AI researchers, and power users building or experimenting with agentic systems who want:

1. A single MCP endpoint that aggregates many tool backends.
2. Fine‑grained control over which tools are exposed and how.
3. Secure, auditable tool invocation.
4. A low‑friction way to let agents discover and add capabilities.

Goblin solves tool discovery, dynamic provisioning, context window optimization, and operational pain points (hot reload, health monitoring, transport compatibility) while preserving performance and security.

**Project philosophy.** Keep it small, pragmatic, and developer‑centric: secure by default, zero‑config friendly, highly configurable when needed, and transparent in behavior. Favor predictable, observable behavior over magic; prefer composability (MCP servers + virtual tools + kits) to monolithic feature bloat; and enable safe automation (opt‑in self‑configuration, scoped OAuth) rather than uncontrolled agent autonomy.

## 2. Feature Overview

### Core Gateway Features

* **Unified Interface**
  Single MCP endpoint that aggregates multiple backend MCP servers and exposes a unified registry and routing surface.
* **Transparent Proxying and Compatibility**
  ProxyMCP compatibility shim and routing layer so existing MCP clients work unchanged; preserves notifications and dynamic updates where supported.
* **Progressive disclosure**
  Minimal context bloat with on-demand tool discovery and dynamic server provisioning.
* **Tool Registry and Tool Router**
  Unified registry of all tools with metadata; deterministic routing of tool invocations to the correct backend with routing cache (routing decisions cached, not payloads).
* **Multiple Transport Adapters**
  Connect to and serve MCP over STDIO, SSE, and Streamable HTTP via an abstract transport layer and pluggable adapters.
* **Full MCP Protocol Support**
  Support Prompts, Resources, Tools, notifications, and messages per MCP spec; document any deviations.

### Configuration and Lifecycle

* **Single JSON Configuration with Hot Config Reload**
  Default JSON config file with JSON Schema validation, hot reload, atomic apply, and rollback on failure. Env overrides supported.
* **Optional SQLite Persistence**
  Optional SQLite backing for configuration and history for users who need atomic updates, concurrent edits, or durability beyond single-file JSON.
* **Lazy Loading Modes**
  Server lifecycle policies: **Stateless** (load per call), **Stateful** (load once and keep), **Smart** (idle eviction and policy-driven unload). Clear state model and configurable idle timeouts.
* **Hot Add/Remove Servers**
  Add or remove MCP servers at runtime without restarting the gateway.
* **Kits**
  Packaged groups of MCP servers and Skills for onboarding; local kits supported initially, marketplace deferred.

### Tool Management and Virtualization

* **Tool Management**
  Enable/disable tools, apply filters, and expose tool aliasing (external name → internal tool mapping) with optional middleware for argument transformation.
* **Virtual Tools**
  Define composite tools that execute multi-tool chains. Features: batch execution, parallelism control, timeout and stop-on-error semantics, connection caching. Limitations: results returned at end of execution; no partial progress streaming in MVP.
* **Meta-Tool Oriented**
  All features from the MCP server are achieved by a small set of exposed meta-tools that call the other tools to reduce context window usage and provide zero-latency local operation.

### Automation, Skills, and Self‑Configuration

* **Skills Service**
  Optional service for semantic discovery of skills using **NLP.js** for intent classification and progressive disclosure. Skills are packaged directories or archives with SKILL.md metadata and downloadable resources. Supports local directories and GitHub sources; local embedding cache for offline use.
* **Smart Search & Summarization**
  **Orama**-based hybrid search (Vector + Keyword) for tools and servers. **TextRank** (via NLP.js primitives) generates "smart summaries" for compact cards without heavy LLM calls.
* **Self‑Service Provisioning with Admin Approval**
  LLM-driven or automated provisioning is opt‑in. Provisioning requests enter an **Admin Approval Queue** ; admin must approve before activation. Provisioning operations are sandboxed and audited.
* **Self‑Configuration Tools**
  MCP tools for listing, provisioning, enabling/disabling, validating, and reloading server configuration. These tools are admin‑scoped.
* **Kits Management Tools**
  Tools to load/unload/list/search kits and inspect kit metadata.

### Security and Access Control

* **Secure by Default**
  No hardcoded secrets; default minimal exposure; runtime warnings for insecure configs.
* **Authentication and Authorization**
  Dev mode (API key/no auth) and production mode (OAuth 2.1). Pluggable auth backends and scope‑based authorization.
* **Role Based Access Control**
  Basic RBAC with roles: admin, operator, readonly, agent. RBAC maps to OAuth scopes and local policies.
* **Policy Enforcement and Sanitization**
  Output size caps, configurable secret redaction rules, optional tool name sanitization (dashes → underscores), and opt‑in exposure policies.
* **Audit and Approval**
  Structured audit logs with export capability and an admin approval queue for risky operations.

### Reliability and Resilience

* **Connection Pool Management**
  Per‑server connection pools with health checks, reconnection/backoff strategies, and connection reuse.
* **Circuit Breaker and Rate Limiting**
  Per‑server and per‑key rate limits (token bucket) and circuit breaker patterns with configurable thresholds.
* **Timeouts and Error Boundaries**
  Timeouts on all operations, isolated error handling to prevent cascading failures, and process monitoring for child processes.
* **Graceful Shutdown and Resource Cleanup**
  Automatic session cleanup, explicit resource tracking, and graceful shutdown semantics.

### Observability and Performance

* **Observability and Health**
  * **Health Endpoints:** `/health`, per‑server probes.
  * **Metrics:** Prometheus‑style metrics export (latency, request counts, error rates).
  * **Logging:** Structured request/response logs with sampling and redaction.
  * **Performance Tracking:** Built‑in latency and request distribution metrics; heavy charts deferred to web UI or external dashboards.
* **Data Flow Optimization**
  Stream data through without caching large payloads; immediate cleanup of references; memory monitoring and leak prevention.
* **Real‑time Messaging**
  Full support for MCP notifications and progress messages with backpressure handling and configurable buffering.

### Developer Experience and UX

* **TUI and CLI**
  Primary management surfaces: a feature‑rich TUI for developers and a scriptable CLI. TUI focuses on quick actions, status, and lightweight charts; complex visualizations deferred.
* **MCP Browser**
  Interactive exploration tool for servers, tools, and resources with scripting support for automation.
* **Zero Configuration Experience**
  Sensible defaults for quick start; clear onboarding docs and example kits.
* **Configuration Validation and Helpful Errors**
  Real‑time validation with actionable error messages and schema display tools.
* **Provisioning of MCP and Skills from online Registries**
  Easy search and installation of MCPs and Skills available on curated registries online using TUI and CLI.

### Additional Operational Features

* **Proxy Compatibility Mode**
  Freeze tool lists for legacy clients that cannot handle dynamic updates.
* **Exportable Audit Trail**
  Structured audit logs that can be exported for compliance or debugging.
* **Local Embedding Cache**
  Cache embeddings and skill metadata locally to support offline or privacy‑sensitive environments.

### Deferrals

* **Deferred to v2 or later:**
  * Full graphical performance charts in TUI (defer to web UI or external dashboards).
  * Kit marketplace and remote kit marketplace features.
  * Unapproved automatic installation from arbitrary online registers.
  * Advanced skill marketplace integrations beyond local and GitHub sources.

#### MVP Feature Set (confirmed)

* Unified Interface; ProxyMCP; Tool Registry; Tool Router
* Basic Lazy Loading (Stateless, Stateful, Smart policy minimal)
* Single JSON config with Hot Config Reload and JSON Schema validation
* TUI and CLI basic views and management commands
* Basic auth mode (API key/dev mode)
* Observability & Health (basic endpoints, structured logs, Prometheus metrics)
* Virtual Tools (basic sequential execution, connection caching)
* Persistent config (JSON default)
* Multiple transport adapters (HTTP, STDIO minimal)
* Hot Add/Remove Servers; Tool Management (enable/disable, aliasing)
* Proxy Compatibility Mode; Basic connection pooling and timeouts

## 3. Detailed Feature Specifications

Below are developer‑ready specifications for each feature in the consolidated Goblin MCP feature set. Each feature entry contains **Purpose** , **Description** , **User experience** , **Constraints and limitations** , **Acceptance criteria** , **Implementation notes** , **Dependencies** , and **Priority** (MVP / v1 / v2). Use these to create issues, estimate work, and drive implementation decisions. Tell me which features you want to expand further or reprioritize before I produce the Requirements Document.

### Core Gateway

#### Unified Interface

**Purpose**
Provide a single MCP endpoint that aggregates multiple backend MCP servers so clients interact with one consistent surface.

**Description**
A gateway component that exposes the MCP protocol and internally routes requests to registered backend MCP servers. Maintains a registry of servers and their tool metadata.

**User experience**
Clients connect to Goblin as if it were a single MCP server. TUI/CLI show a unified list of tools and servers.

**Constraints and limitations**
Must preserve MCP semantics (prompts, resources, notifications). Gateway must not alter tool behavior except where explicitly configured (aliasing, middleware).

**Acceptance criteria**

* A client can connect to Goblin and list tools aggregated from at least two backend MCP servers.
* Invocations to tools are routed to the correct backend and responses returned to the client.
* Registry updates reflect add/remove server operations within configured hot reload latency.

**Implementation notes**

* Implement a registry service with in‑memory index and optional SQLite backing.
* Use async request forwarding with per‑request context mapping.
* Provide a compatibility shim for clients that expect static tool lists.

**Dependencies**
Transport adapters, Tool Router, ProxyMCP.

**Priority**
MVP

#### Transparent Proxying and Compatibility

**Purpose**
Ensure existing MCP clients work unchanged and preserve notification semantics.

**Description**
ProxyMCP compatibility shim that can emulate static tool lists and forward notifications, plus a compatibility mode to freeze tool lists for legacy clients.

**User experience**
Legacy clients see a stable tool list; modern clients can receive dynamic updates.

**Constraints and limitations**
Freezing tool lists may hide newly added tools until a manual refresh; compatibility mode must be opt‑in per client or per endpoint.

**Acceptance criteria**

* Legacy client receives a stable tool list when compatibility mode is enabled.
* Notifications from backends are forwarded to clients that support them.

**Implementation notes**

* Implement a ProxyMCP adapter that can replay or buffer notifications.
* Provide per‑client capability negotiation during handshake.

**Dependencies**
Unified Interface, Multiple Transport Adapters.

**Priority**
MVP

#### Tool Registry and Tool Router

**Purpose**
Maintain unified metadata for all tools and deterministically route invocations.

**Description**
Registry stores compact capability cards and full schemas (lazy). Router resolves tool name/alias to backend server and caches routing decisions.

**User experience**
Search and list tools via TUI/CLI; tool invocation is transparent.

**Constraints and limitations**
Routing cache must be invalidated on config changes or server health events.

**Acceptance criteria**

* Registry returns compact cards for all connected tools.
* Router resolves tool names to backends with cache hit/miss metrics.
* Cache invalidates on server add/remove or health failure.

**Implementation notes**

* Use TTL-based cache with explicit invalidation hooks.
* Store compact metadata in memory; fetch full schema lazily.

**Dependencies**
Unified Interface, Health Monitoring, Hot Config Reload.

**Priority**
MVP

#### Multiple Transport Adapters

**Purpose**
Support connecting to and serving MCP over STDIO, SSE, and Streamable HTTP.

**Description**
Abstract transport layer with adapters for STDIO (child processes), SSE, and streamable HTTP endpoints. Adapters implement a common interface for send/receive, lifecycle, and health checks.

**User experience**
Admins configure server transports in JSON; TUI shows transport type and status.

**Constraints and limitations**
Transport semantics differ (e.g., STDIO lacks persistent HTTP semantics); adapters must normalize behavior.

**Acceptance criteria**

* Gateway can connect to at least two backend servers using different transports.
* Gateway can serve clients over HTTP and STDIO concurrently.

**Implementation notes**

* Define a transport interface with async read/write, ping, and close.
* Implement backpressure and streaming support to avoid buffering large payloads.

**Dependencies**
Connection Pool Management, Health Monitoring.

**Priority**
MVP

#### Full MCP Protocol Support

**Purpose**
Comply with MCP features: Prompts, Resources, Tools, notifications, and messages.

**Description**
Implement protocol handlers for all MCP message types and document any deviations.

**User experience**
Clients can use full MCP features through Goblin as they would with a native MCP server.

**Constraints and limitations**
Edge cases in protocol extensions must be documented; compatibility shim may be required for older clients.

**Acceptance criteria**

* Protocol conformance tests pass for core MCP operations.
* Notifications and resource transfers work end‑to‑end.

**Implementation notes**

* Build a test suite that exercises prompts, resources, tool invocation, and notifications.
* Provide a compatibility layer for clients lacking notification support.

**Dependencies**
ProxyMCP, Multiple Transport Adapters.

**Priority**
MVP

### Configuration and Lifecycle

#### Single JSON Configuration with Hot Config Reload

**Purpose**
Simple, single-file configuration with validation and hot reload.

**Description**
Default configuration stored as JSON with a JSON Schema. Hot reload watches file changes, validates, and applies atomically with rollback on failure.

**User experience**
Edit config file; Goblin applies changes automatically and reports success/failure in TUI/CLI.

**Constraints and limitations**
Concurrent edits must be handled safely; JSON file is single‑writer by default.

**Acceptance criteria**

* Config changes are detected and applied without restart.
* Invalid configs are rejected and previous config restored.
* TUI shows current config version and last reload status.

**Implementation notes**

* Use file watcher with debounce.
* Validate against JSON Schema before apply.
* Implement atomic swap (write temp file, validate, rename).

**Dependencies**
Configuration Validation, Optional SQLite Persistence.

**Priority**
MVP

#### Optional SQLite Persistence

**Purpose**
Provide durable, atomic storage for config and history for multi‑user or concurrent scenarios.

**Description**
Optional SQLite backend that stores server entries, tool metadata cache, and audit logs. JSON remains default; SQLite enabled via config.

**User experience**
Admins enable SQLite in config; TUI shows DB status.

**Constraints and limitations**
SQLite adds complexity and migration needs; keep JSON as canonical source unless explicitly switched.

**Acceptance criteria**

* When enabled, config changes persist to SQLite and survive restarts.
* Migration path exists between JSON and SQLite.

**Implementation notes**

* Use lightweight ORM or SQL layer with migrations.
* Keep JSON import/export tooling.

**Dependencies**
Single JSON Configuration, Audit Trail.

**Priority**
v1

#### Lazy Loading Modes

**Purpose**
Control backend server lifecycle to optimize resources and context usage.

**Description**
Three modes: Stateless (spawn/connect per call), Stateful (load once and keep), Smart (policy-driven: load on demand, unload on idle). Configurable idle timeouts and resource quotas.

**User experience**
Admins set mode per server in config; TUI shows server state and idle timers.

**Constraints and limitations**
Smart policy requires heuristics; avoid premature unloads for stateful tools.

**Acceptance criteria**

* Servers in Stateless mode are started and stopped per invocation.
* Stateful servers remain active after first use.
* Smart servers unload after idle timeout and reload on next call.

**Implementation notes**

* Implement state machine for server lifecycle.
* Track active sessions and last‑used timestamps.
* Provide metrics for load/unload events.

**Dependencies**
Connection Pool Management, Resource Tracking.

**Priority**
MVP

#### Hot Add/Remove Servers

**Purpose**
Allow runtime addition and removal of backend servers without restart.

**Description**
APIs and CLI/TUI commands to add, remove, enable, disable servers. Changes are applied via hot config reload.

**User experience**
Admins add servers via CLI/TUI or config file; changes take effect immediately.

**Constraints and limitations**
Ensure in‑flight requests are drained or routed safely during removal.

**Acceptance criteria**

* Adding a server registers its tools and makes them available.
* Removing a server prevents new invocations and drains existing ones gracefully.

**Implementation notes**

* Implement graceful drain with configurable timeout.
* Emit events for add/remove for observability.

**Dependencies**
Single JSON Configuration, Lazy Loading Modes.

**Priority**
MVP

### Tool Management and Virtualization

#### Tool Management

**Purpose**
Enable/disable tools, apply filters, and alias tools for external exposure.

**Description**
Centralized UI and API to toggle tool availability, apply name mappings, and define middleware transformations for arguments/results.

**User experience**
TUI/CLI list tools with enable/disable toggles and alias configuration. Changes can be applied live.

**Constraints and limitations**
Middleware transformations must be deterministic and safe; avoid arbitrary code execution in middleware unless explicitly allowed and sandboxed.

**Acceptance criteria**

* Admin can disable a tool and it no longer appears in registry or is invokable.
* Alias mapping routes external name to internal tool.
* Middleware transformations apply to invocations when configured.

**Implementation notes**

* Store tool state in registry with enable flag and alias map.
* Provide a safe transformation DSL or limited scripting with sandboxing (deferred to v1 if complex).

**Dependencies**
Tool Registry, Hot Config Reload.

**Priority**
MVP

#### Virtual Tools

**Purpose**
Expose composite multi‑tool workflows as single tools to reduce context and simplify agent calls.

**Description**
Virtual tool definitions specify a DAG or list of sub‑ops referencing existing tools, concurrency limits, timeouts, and error handling semantics. Connection caching reuses backend connections.

**User experience**
Admins define virtual tools in config or via TUI. Agents call virtual tool like any other tool and receive aggregated results.

**Constraints and limitations**
MVP returns results only after all sub‑ops complete; no partial streaming. Prevent cycles and runaway recursion. Limit max concurrency and total runtime.

**Acceptance criteria**

* Virtual tool executes defined sub‑ops and returns aggregated result.
* Parallelism respects `maxConcurrent`.
* Timeouts and stop‑on‑error behave as configured.

**Implementation notes**

* Implement execution engine that schedules sub‑ops, manages concurrency, and aggregates results.
* Provide validation to detect cycles and invalid references.

**Dependencies**
Tool Router, Connection Pool Management.

**Priority**
MVP (basic sequential + limited parallelism)

#### Meta Tools

**Purpose**
Provide a small number of external tools that are used as an interface to access the MCP servers managed by Goblin.
Also provide a set of internal tools that orchestrate other tools to reduce context window usage and provide zero‑latency local operations.

**Description**
Predefined meta tools implemented locally in the gateway that call other tools or read local state. The following is a suggestion of a minimal set of meta-tools:

* `search_servers` - Keyword or Semantic Search for MCP servers. Returns the servers found, a list of tools and compact description of the server.
* `describe_server` - Get detailed information about an MCP including its tools.
* `catalog_list` - Lists all available tools and returns its compact capability cards. Optionally, can list tools of a specific server.
* `catalog_search` - Keyword or Semantic search available tools. Returns a list of tools with their compact capability cards.
* `describe_tool` - Get detailed description for a tool and their schema.
* `invoke_tool` - Call a downstream tool with argument validation.
* `health` - Get gateway and server health status

**User experience**
Agents and admins can call meta tools instead of calling the MCP server tools directly.
Most of them aim to make quick operations without fetching full schemas.

**Constraints and limitations**
Most of the Meta tools should be small and explainable to avoid hiding complex behavior.
The exception to this rules are the tools related to the orchestration of the MCP servers managed by Goblin.

**Acceptance criteria**

* Meta tools return expected compact outputs (unless requested full information) and are discoverable in registry.
* Meta tool calls are audited.

**Dependencies**
Tool Registry, Observability.

**Priority**
MVP

### Automation, Skills, and Self‑Configuration

#### Skills Service

**Purpose**
Enable semantic discovery of skills and progressive disclosure of skill content to agents.

**Description**
Optional service that indexes skills from local directories and GitHub, computes embeddings, and supports semantic search with progressive disclosure (metadata → content → files). Uses local embedding cache and supports offline mode.
Online registry search is planned, but unclear at the moment.
Skills on the local directory can be pre-authorized with simple configuration on the TUI or CLI.

**User experience**
Agents call `find_skills` with a task description and receive ranked compact cards; Admins can authorize to fetch full skill documents or files in case they are not pre-authorized. The following is a suggestion of a minimal set of skill related tools:

* `find_skills` - Semantic search for relevant skills on the local registry based on task description. Returns a list of appropriate ranked compact cards for the Skills (name and description). This information is supposed to stay in context once the skill is chosen.  
* `discover_skills` - Semantic search for relevant skills based on task description from available marketplaces. Returns a list of appropriate ranked compact cards for the skills as well as metadata needed to retrieve the skill.  
* `retrieve_skill` - Retrieve and install the a skill. This includes fetching the specific files (SKILL.md, scripts, data, references, etc) from an external source and install locally (globally available).
* `use_skill` - Used when the skill is triggered. Returns the instructions of the skill as well as view of the resource tree.
* `load_skill_resource` - Loads one or more of the skill resources in the context (additional instructions, code, and resources).  
* `list_skills` - View complete inventory of all loaded skills (for exploration/debugging)

**Constraints and limitations**
Embedding model selection and storage can be heavy; default to lightweight local models or optional external providers. Respect privacy and avoid sending skill content to external APIs unless configured.

**Acceptance criteria**

* `find_skills` returns relevant skills within configured latency (<5s for frontend).
* Progressive disclosure returns metadata first and full content on demand.
* Local cache supports offline search for previously indexed skills.

**Implementation notes**

* Two‑package architecture: fast frontend that responds quickly; background worker downloads and indexes content.
* Use pluggable embedding provider interface; provide a local default (e.g., small open model) and optional external providers.

**Dependencies**
Local Embedding Cache, Kits, Optional GitHub integration.

**Priority**
v1 (basic local-only implementation), v2 for marketplace integrations

#### Self‑Service Provisioning with Admin Approval

**Purpose**
Allow LLMs or automation to propose new MCP servers while preventing uncontrolled installs.

**Description**
Provisioning requests (from LLMs, scripts, or URLs) are queued for admin approval. Sandbox the installation process and record audit logs.

**User experience**
An automated request appears in TUI/CLI with details and risk indicators; admin approves or rejects.

**Constraints and limitations**
Automated installs must not run arbitrary code without approval. Sandbox must limit network and filesystem access.

**Acceptance criteria**

* Provisioning requests are queued and visible to admins.
* Approved requests result in server installation and registration.
* Rejected requests are logged and not executed.

**Implementation notes**

* Implement approval queue with metadata, diff preview, and risk scoring.
* Use containerized or chrooted sandbox for installs if executing remote code (deferred complexity to v2).

**Dependencies**
Audit Trail, RBAC, Optional SQLite Persistence.

**Priority**
v1 (approval queue + sandboxed metadata fetch), v2 for automated sandboxed installs

#### Self‑Configuration Tools

**Purpose**
Expose configuration operations as MCP tools for automation and scripted workflows.

**Description**
These are Admin‑scoped tools that need authorization. We can classify them in basic and advanced self-config tools.
Basic tools are simple to use and most of the hard work is done by the Goblin Server.
Advanced tools on the other hand require direct manipulation of the configuration JSON file and is suited for complex workflow with last generation models.
Advanced tools required an additional level permission to be available for the model.

The following is a suggestion of a minimal set of basic self-configuration tools related tools:

* `list_servers` - List all locally available MCP servers with their connection status.
* `discover_servers` - Semantic/Natural language discovery of MCP servers on marketplaces. Returns a list of servers with all the data needed for the `provision_server` tool to install the new server and well as a compact summary of the info about the server.
* `provision_server` - Install and start MCP servers on-demand. Normally, accepts structured data supplied by the `provision_server` tool. Can try to install using just a URL, but the failure rate is higher. Intelligently configure a server to the best of its ability. Returns the status of the provision and if any manual configuration will be needed from the user.
* `enable_server` - Enable a server availability.
* `disable_server` - Disable a server availability.
* `remove_server` - Remove a server from the configuration file.
* `reload_config` - Force reload configuration from disk and apply changes. Mostly to force the reloading routine from the hot-reload system to run immediately.

Advanced self-configuration tools work using JSON manipulation. The following is a suggestion of a minimal set of advanced self-configuration tools related tools:

* `show_servers_config_schema` - Display JSON Schema for MCP configuration as well as a compact explanation of the configuration fields.
* `set_servers_config` - Set MCP configuration. Executes a validation before committing the change. Returns if the operation was successful or not. In the case of unsuccessful operation, also returns a compact error message useful for Agent self-correcting.
* `show_servers_config` - Gets the current MCP configuration file content.

**User experience**
Admins can call these tools from agents or CLI; operations require appropriate RBAC scopes.

**Constraints and limitations**
Tools that modify config must validate and be auditable.

**Acceptance criteria**

* Tools perform operations and return structured status.
* All changes are logged in audit trail.

**Implementation notes**

* Implement tool handlers that call internal config APIs and perform validation.

**Dependencies**
RBAC, Configuration Validation, Audit Trail.

**Priority**
v1

#### Kits Management Tools

**Purpose**
Load/unload and inspect kits (bundles of servers and skills) for onboarding.

**Description**
Tools to `load_kit`, `unload_kit`, `list_kits`, `kit_info`, and `search_kit` (semantic search of kit metadata):

* `load_kit` - Load a kit and its servers into the configuration
* `unload_kit` - Unload a kit and optionally its servers from the configuration
* `list_kits` - List all available kits with their status
* `search_kit` - Semantic Search of Kits
* `kit_info` - Get detailed information about a specific kit

**User experience**
Admins can quickly apply a kit to populate config for a use case.

**Constraints and limitations**
Kits are local packages in MVP; remote marketplace deferred.

**Acceptance criteria**

* Kits can be loaded and unloaded without restart.
* Kit metadata is searchable.

**Implementation notes**

* Define kit manifest schema and validation.
* Implement idempotent load/unload semantics.

**Dependencies**
Hot Config Reload, Skills Service.

**Priority**
v1

### Security and Reliability

#### Secure by Default

**Purpose**
Minimize risk out of the box.

**Description**
Default config exposes minimal tools, disables self‑provisioning, and requires explicit enablement for risky features. No hardcoded secrets; runtime warnings for insecure settings.

**User experience**
First run uses zero‑config defaults; TUI highlights security posture and required steps for production.

**Constraints and limitations**
Some convenience features require explicit opt‑in.

**Acceptance criteria**

* Default install runs in safe mode with minimal exposure.
* Insecure configs produce warnings and require explicit confirmation to proceed.

**Implementation notes**

* Implement startup checks and a security checklist in TUI.

**Dependencies**
RBAC, OAuth 2.1.

**Priority**
MVP

#### Authentication and Authorization

**Purpose**
Support dev and production auth modes with pluggable backends.

**Description**
Dev mode: API key or no auth for local testing. Production: OAuth 2.1 with scope‑based authorization. Pluggable backends for mTLS or external identity providers.

**User experience**
Admins configure auth mode in config; TUI shows active auth mode and token scopes.

**Constraints and limitations**
OAuth integration requires redirect URIs and client registration; provide clear docs.

**Acceptance criteria**

* Dev mode allows local testing.
* OAuth mode enforces scopes for admin operations and tool invocation.

**Implementation notes**

* Implement middleware for token validation and scope checks.
* Provide token introspection or JWT verification.

**Dependencies**
RBAC, Audit Trail.

**Priority**
v1

#### Role Based Access Control

**Purpose**
Map users and agents to roles with least privilege.

**Description**
Basic RBAC with roles: admin, operator, readonly, agent. Roles map to allowed MCP tools and config operations.

**User experience**
Admins assign roles to tokens or identities; TUI shows role assignments.

**Constraints and limitations**
Keep RBAC simple initially; complex policies deferred.

**Acceptance criteria**

* Role enforcement prevents unauthorized config changes.
* Audit logs record role‑based actions.

**Implementation notes**

* Implement role checks in middleware and tool handlers.
* Provide default role mappings and allow custom role definitions.

**Dependencies**
Authentication and Authorization, Audit Trail.

**Priority**
v1

#### Policy Enforcement and Sanitization

**Purpose**
Prevent data leakage and enforce output limits.

**Description**
Configurable output size caps, secret redaction rules (regex), and optional tool name sanitization.

**User experience**
Admins configure policies in JSON; TUI shows active policies and redaction examples.

**Constraints and limitations**
Redaction is heuristic; may require tuning to avoid over‑redaction.

**Acceptance criteria**

* Outputs exceeding size caps are truncated and logged.
* Secrets matching configured patterns are redacted in logs and responses.

**Implementation notes**

* Implement streaming redaction for large outputs.
* Provide test utilities to validate redaction rules.

**Dependencies**
Observability, Tool Router.

**Priority**
v1

#### Audit and Approval

**Purpose**
Provide traceability for operations and a safe approval workflow.

**Description**
Structured audit logs for all admin and provisioning actions; approval queue for self‑provisioning.

**User experience**
Admins view audit entries in TUI and export logs. Provisioning requests appear with metadata and risk indicators.

**Constraints and limitations**
Audit logs can grow large; provide rotation and optional SQLite storage.

**Acceptance criteria**

* All admin actions are logged with timestamp, actor, and diff.
* Approval queue records decisions and timestamps.

**Implementation notes**

* Use structured JSON logs with optional persistence to SQLite or file.
* Provide export endpoint for logs.

**Dependencies**
Optional SQLite Persistence, RBAC.

**Priority**
v1

### Reliability and Observability

#### Connection Pool Management

**Purpose**
Efficiently manage backend connections with health checks and reconnection.

**Description**
Per‑server connection pools with configurable size, idle timeout, and backoff strategies.

**User experience**
TUI shows pool metrics and health; admins tune pool settings.

**Constraints and limitations**
Pools must respect transport semantics (e.g., STDIO single process).

**Acceptance criteria**

* Pools reuse connections and recover from transient failures.
* Metrics expose pool usage and errors.

**Implementation notes**

* Implement async pool with health probes and exponential backoff.

**Dependencies**
Multiple Transport Adapters, Circuit Breaker.

**Priority**
MVP

#### Circuit Breaker and Rate Limiting

**Purpose**
Protect gateway and backends from overload and cascading failures.

**Description**
Token bucket rate limiting per server/key and circuit breaker with configurable thresholds and cooldown.

**User experience**
TUI shows rate limit status and circuit breaker state.

**Constraints and limitations**
Rate limiting must be configurable per role and per server.

**Acceptance criteria**

* Rate limits enforce configured quotas.
* Circuit breaker trips on repeated failures and recovers after cooldown.

**Implementation notes**

* Use standard CB libraries or implement simple sliding window counters.
* Expose metrics for trips and throttles.

**Dependencies**
Connection Pool Management, Observability.

**Priority**
v1

#### Timeouts and Error Boundaries

**Purpose**
Prevent hanging operations and isolate failures.

**Description**
Configurable timeouts for all operations and isolated error handling to avoid cascading failures.

**User experience**
TUI shows timeout events and error summaries.

**Constraints and limitations**
Timeouts must be reasonable per transport and tool type.

**Acceptance criteria**

* Long‑running operations are terminated after timeout and return structured error.
* Failures in one tool do not crash the gateway.

**Implementation notes**

* Implement per‑request context with cancellation and cleanup hooks.

**Dependencies**
Lazy Loading Modes, Virtual Tools.

**Priority**
MVP

#### Graceful Shutdown and Resource Cleanup

**Purpose**
Ensure clean exit and resource release.

**Description**
On shutdown, drain in‑flight requests, persist state if needed, and close connections. Implement session cleanup and explicit garbage collection hints.

**User experience**
Shutdown sequence reported in TUI and logs.

**Constraints and limitations**
Graceful drain timeout must be configurable.

**Acceptance criteria**

* Gateway shuts down without leaving orphaned processes or sockets.
* Idle sessions are cleaned per configured interval.

**Implementation notes**

* Implement signal handlers and shutdown hooks.
* Track resources and emit final metrics.

**Dependencies**
Connection Pool Management, Lazy Loading Modes.

**Priority**
MVP

#### Observability and Health

**Purpose**
Provide metrics, logs, and health endpoints for monitoring and debugging.

**Description**
Expose `/health`, Prometheus metrics, structured logs with sampling and redaction, and per‑server health probes. Defer heavy TUI charts to external dashboards.

**User experience**
TUI shows health summary and recent logs; metrics available for scraping.

**Constraints and limitations**
Avoid logging secrets; provide sampling to limit log volume.

**Acceptance criteria**

* `/health` returns gateway and per‑server status.
* Prometheus metrics expose request counts, latencies, errors, pool stats.
* Logs include request IDs and redaction applied.

**Implementation notes**

* Use standard metrics libraries and structured logging.
* Provide correlation IDs for tracing.

**Dependencies**
Policy Enforcement, Connection Pool Management.

**Priority**
MVP

### Developer Experience and UX

#### TUI and CLI

**Purpose**
Primary management surfaces for developers: quick actions, status, and lightweight charts.

**Description**
Feature‑rich TUI for status, quick actions, server management, and logs. Scriptable CLI mirrors TUI operations for automation.

**User experience**
TUI is keyboard‑driven with clear panes for servers, tools, and logs. CLI supports JSON output for scripting.

**Constraints and limitations**
Keep TUI lightweight; defer heavy visualizations to web UI or external dashboards.

**Acceptance criteria**

* TUI lists servers, tools, and shows basic metrics.
* CLI supports scripted operations and JSON output.

**Implementation notes**

* Use a TUI framework that supports async updates.
* Keep TUI code modular to allow future web UI reuse.

**Dependencies**
Observability, Tool Registry, Hot Config Reload.

**Priority**
MVP

#### MCP Browser

**Purpose**
Interactive exploration and scripting for servers, tools, and resources.

**Description**
Browser interface (TUI + CLI) to inspect tool schemas, download resources, and run scripted queries.

**User experience**
Admins can explore tool schemas, run test invocations, and download resources.

**Constraints and limitations**
Large resource downloads should stream and avoid buffering.

**Acceptance criteria**

* Browser can display compact cards and full schemas on demand.
* Test invocations work and show request/response logs.

**Implementation notes**

* Reuse registry and transport layers for test invocations.
* Provide safe defaults for test calls (timeouts, sandboxed inputs).

**Dependencies**
Tool Registry, Multiple Transport Adapters.

**Priority**
MVP

#### Zero Configuration Experience and Validation

**Purpose**
Make onboarding frictionless while providing helpful validation and errors.

**Description**
Sensible defaults, example kits, and real‑time validation with actionable error messages.

**User experience**
First run works out of the box; validation errors include suggested fixes.

**Constraints and limitations**
Defaults must be secure; avoid exposing dangerous defaults.

**Acceptance criteria**

* Fresh install starts with working default config.
* Validation catches common misconfigurations and surfaces clear messages.

**Implementation notes**

* Provide example configs and a quickstart guide.
* Implement validation rules and friendly error messages.

**Dependencies**
Single JSON Configuration, Configuration Validation.

**Priority**
MVP

## 4. Requirements Document

This document translates the detailed feature specifications into actionable **user requirements** and **system requirements** for Goblin MCP. It is written in a lightweight, Agile style suitable for a solo open‑source developer: clear user stories, acceptance criteria, minimal API shapes, non‑functional constraints, and an initial implementation roadmap.

### User Requirements

**Primary personas**

* **Developer** : builds and tests agent workflows locally; wants quick onboarding, CLI/TUI control, and predictable behavior.
* **Operator** : runs Goblin in a team or lab environment; needs security controls, observability, and safe automation.
* **Researcher** : experiments with skills and virtual tools; needs semantic search, reproducible kits, and low latency.

**Top-level user goals**

* Connect multiple MCP backends behind a single endpoint.
* Discover, enable, and invoke tools without manual per‑client wiring.
* Safely allow agents to propose new capabilities while preventing uncontrolled installs.
* Observe and debug requests, health, and performance with minimal setup.

**User stories and acceptance criteria**

1. **Unified Tool Access**
   * *Story:* As a Developer, I want to list and invoke tools from multiple MCP servers through one endpoint so I can simplify client code.
   * *Acceptance:* A client connected to Goblin can list tools aggregated from at least two backends and successfully invoke a tool routed to its backend.
2. **Hot Configuration**
   * *Story:* As an Operator, I want to edit a JSON config and have Goblin apply changes without restarting so I can iterate quickly.
   * *Acceptance:* Editing the config file triggers validation and an atomic apply; invalid configs are rejected and previous config restored.
3. **Safe Self‑Provisioning**
   * *Story:* As an Operator, I want automated provisioning requests to require admin approval so I can avoid unsafe installs.
   * *Acceptance:* Provisioning requests appear in an approval queue; only approved requests are executed and logged.
4. **Secure Defaults**
   * *Story:* As a Developer, I want Goblin to run safely out of the box so I can experiment without exposing services.
   * *Acceptance:* Default install exposes minimal tools, disables self‑provisioning, and shows security warnings for insecure settings.
5. **Virtual Tools**
   * *Story:* As a Researcher, I want to define a virtual tool that chains multiple backend tools so I can reduce context window usage.
   * *Acceptance:* A virtual tool defined in config executes its sub‑ops and returns aggregated results; concurrency and timeout settings are honored.
6. **Observability**
   * *Story:* As an Operator, I want health endpoints and metrics so I can monitor system health and performance.
   * *Acceptance:* `/health` returns gateway and per‑server status; Prometheus metrics expose request counts, latencies, and error rates.
7. **Transport Flexibility**
   * *Story:* As a Developer, I want Goblin to connect to backends using STDIO and HTTP so I can integrate diverse MCP servers.
   * *Acceptance:* Goblin connects to at least two backends using different transports and can serve clients over HTTP concurrently.
8. **Role Based Access**
   * *Story:* As an Operator, I want RBAC so I can restrict who can change config or approve provisioning.
   * *Acceptance:* Admin operations require the admin role; RBAC prevents unauthorized config changes and logs attempts.

### System Requirements

#### Functional Requirements

* **FR1 Registry** : Maintain a registry of connected MCP servers and their compact tool metadata.
  * *API:* `GET /registry/tools?compact=true` returns compact cards; `GET /registry/servers` returns server list.
* **FR2 Routing** : Resolve tool name/alias to backend and forward invocations preserving MCP semantics.
  * *API:* Internal router resolves `toolId` → backend connection; supports alias mapping.
* **FR3 Transports** : Support STDIO, SSE, and streamable HTTP adapters for backend connections and serve clients over HTTP and STDIO.
* **FR4 Config Management** : Single JSON config with JSON Schema validation, hot reload, atomic apply, and rollback.
  * *Config shape:* top‑level `servers[]`, `virtualTools[]`, `auth`, `policies`, `persistence`.
* **FR5 Lazy Loading** : Implement server lifecycle modes: `stateless`, `stateful`, `smart` with configurable idle timeouts.
* **FR6 Tool Management** : Enable/disable tools, aliasing, and middleware transformations (safe DSL or limited scripting).
* **FR7 Virtual Tools** : Define composite tools with sub‑ops, `maxConcurrent`, `timeoutMs`, `stopOnError`.
* **FR8 Skills Service** : Optional service for semantic skill discovery with progressive disclosure and local embedding cache.
* **FR9 Self‑Provisioning** : Accept provisioning requests into an approval queue; only execute after admin approval.
* **FR10 Auth and RBAC** : Dev mode (API key) and OAuth 2.1 production mode; RBAC roles enforced on admin tools.
* **FR11 Observability** : `/health`, Prometheus metrics, structured logs with redaction, and correlation IDs.
* **FR12 Persistence** : Default JSON file; optional SQLite mode for config and audit logs.
* **FR13 Audit Trail** : Structured audit logs for admin actions and provisioning decisions; exportable.
* **FR14 Hot Add/Remove** : Add/remove servers at runtime with graceful drain of in‑flight requests.
* **FR15 Proxy Compatibility** : ProxyMCP shim and compatibility mode to freeze tool lists for legacy clients.

#### Non‑Functional Requirements

* **NFR1 Performance** : Average request forwarding latency overhead ≤ 50ms for simple metadata calls under light load (baseline to be measured).
* **NFR2 Scalability** : Support dozens of backend servers and hundreds of tools in a single gateway instance; scale horizontally by running multiple Goblin instances behind a load balancer.
* **NFR3 Reliability** : Circuit breaker and rate limiting must prevent cascading failures; default timeouts applied to all external calls.
* **NFR4 Security** : Secure by default; no hardcoded secrets; admin approval required for provisioning; audit logs retained per config.
* **NFR5 Resource Efficiency** : Stream large payloads without buffering; memory usage must remain bounded via connection pools and idle eviction.
* **NFR6 Observability** : Expose Prometheus metrics and structured logs; provide correlation IDs for tracing.
* **NFR7 Portability** : Run on Linux and macOS; minimal dependencies; single binary or container image preferred.
* **NFR8 Developer Experience** : First run should work with zero config; TUI and CLI must be responsive and scriptable.

### Minimal API and Config Shapes

**Config JSON outline**

json

```
{
  "servers": [
    {
      "id": "string",
      "name": "string",
      "transport": "stdio|http|sse",
      "endpoint": "string",
      "mode": "stateless|stateful|smart",
      "enabled": true,
      "aliases": { "externalName": "internalToolId" },
      "filters": { "include": ["*"], "exclude": [] }
    }
  ],
  "virtualTools": [
    {
      "id": "string",
      "description": "string",
      "ops": [ { "server": "id", "tool": "toolId", "args": {} } ],
      "maxConcurrent": 4,
      "timeoutMs": 60000,
      "stopOnError": true
    }
  ],
  "auth": { "mode": "dev|oauth", "oauth": { "issuer": "", "clientId": "" } },
  "policies": { "outputSizeLimit": 65536, "redactionRegex": ["regex1"] },
  "persistence": { "type": "json|sqlite", "path": "~/.goblin/config.json" }
}
```

**Key internal APIs (examples)**

* `GET /api/v1/registry/tools?compact=true` → list compact capability cards.
* `POST /api/v1/invoke` → `{ "tool": "externalName", "args": {...}, "session": "id" }` returns invocation result.
* `POST /api/v1/admin/provision` → enqueue provisioning request (admin scope required).
* `GET /api/v1/admin/approvals` → list pending provisioning requests.
* `POST /api/v1/admin/approvals/{id}/approve` → approve and execute provisioning.

### Security Requirements

* **Default secure posture** : self‑provisioning disabled; minimal tool exposure.
* **Auth** : support OAuth 2.1 with scope enforcement; dev mode for local testing.
* **RBAC** : roles enforced for admin operations; tokens mapped to roles.
* **Audit** : every admin action and provisioning decision logged with actor, timestamp, and diff.
* **Redaction** : logs and responses must apply configured redaction rules before persistence or display.
* **Sandboxing** : metadata fetches for provisioning must not execute remote code; any remote install requires explicit approval and sandboxed execution (deferred full sandboxing to v2).

### Observability and Testing

**Metrics**

* Request counts per tool and server.
* Latency histograms per endpoint.
* Circuit breaker trips and rate limit events.
* Connection pool usage.

**Logs**

* Structured JSON logs with `request_id`, `actor`, `server_id`, `tool_id`, `status`, and `redacted` flag.
* Sampling for high‑volume endpoints.

**Health**

* `/health` returns `{ "status": "ok|degraded|down", "servers": [{ "id": "", "status": "" }] }`.

**Testing strategy**

* Unit tests for registry, router, transport adapters, and config validation.
* Integration tests with mock MCP backends for protocol conformance, notifications, and transport behavior.
* End‑to‑end tests for hot reload, virtual tools, and approval workflow.
* Security tests for RBAC and redaction rules.

### Deployment and Operational Notes

* **Packaging** : single binary with optional container image.
* **Config** : default JSON at `~/.goblin/config.json`; support `GOBLIN_CONFIG` env override.
* **Persistence** : JSON default; enable SQLite via config for multi‑user setups.
* **Backups** : recommend periodic export of config and audit logs.
* **Upgrade** : support config migrations and safe rollback on startup failure.

### Prioritization and Initial Roadmap

**First three implementation tickets for MVP**

1. **Registry + Router + Basic HTTP transport** — core gateway that lists tools from multiple backends and routes invocations.
2. **Single JSON Config + Hot Reload + TUI/CLI skeleton** — config file handling, validation, and a minimal TUI/CLI to view servers and tools.
3. **ProxyMCP compatibility + Basic Observability** — compatibility shim for legacy clients, `/health` endpoint, and structured logging.

**MVP milestone (next 6–10 weeks for solo dev, estimate)**

* Complete core gateway, config hot reload, basic TUI/CLI, basic transports (HTTP, STDIO), virtual tools (sequential), and basic observability.

**v1 milestone**

* OAuth 2.1, RBAC, approval queue, skills service (local), SQLite option, circuit breaker, rate limiting.

## 5. Architecture Overview

Goblin MCP is a modular gateway that aggregates multiple MCP servers behind a single endpoint. The architecture favors small, well‑defined components with clear responsibilities, low operational friction, and secure defaults. The design supports a single binary or container deployment for solo developers while allowing horizontal scaling and optional durable persistence for team use.

### Core Components

* **Gateway Frontend**
  * **Role:** Exposes MCP endpoints to clients; handles client capability negotiation and compatibility mode.
  * **Key responsibilities:** authentication middleware, request routing, correlation IDs, rate limiting hooks.
* **Registry Service**
  * **Role:** Indexes servers, tools, compact capability cards, and aliases.
  * **Key responsibilities:** in‑memory index with optional SQLite backing, TTL cache for full schemas, config versioning.
* **Transport Adapter Layer**
  * **Role:** Pluggable adapters for STDIO, SSE, and streamable HTTP.
  * **Key responsibilities:** normalize transport semantics, implement backpressure, provide health probes.
* **Tool Router and Invocation Engine**
  * **Role:** Resolve tool name/alias to backend, apply middleware transforms, forward requests, and return responses.
  * **Key responsibilities:** routing cache, connection pooling, circuit breaker integration, per‑request timeouts.
* **Virtual Tools Engine**
  * **Role:** Execute composite tool definitions (DAG or list) as single tools.
  * **Key responsibilities:** scheduling, concurrency control, aggregation of results, cycle detection, error semantics.
* **Skills Service**
  * **Role:** Optional semantic index for skills with progressive disclosure.
  * **Key responsibilities:** embedding provider interface, local embedding cache, fast metadata frontend and background indexer.
* **Admin Services**
  * **Role:** Approval queue, provisioning orchestrator, config validation, and audit trail.
  * **Key responsibilities:** queue management, diff previews, audit persistence, RBAC enforcement.
* **Observability Stack**
  * **Role:** Health endpoints, Prometheus metrics, structured logs, and correlation IDs.
  * **Key responsibilities:** metrics export, log redaction, sampling, and event hooks for monitoring.
* **TUI and CLI**
  * **Role:** Developer/operator surfaces for management and exploration.
  * **Key responsibilities:** server/tool views, quick actions, approval workflows, JSON output for automation.

### Data Flows

* **Tool Discovery Flow**
  1. Registry polls or receives server registration.
  2. Registry stores compact capability cards; full schemas fetched lazily.
  3. TUI/CLI and clients query registry for compact cards.
* **Tool Invocation Flow**
  1. Client sends invocation to Gateway Frontend.
  2. Auth middleware validates token and RBAC.
  3. Router resolves tool to backend using registry and cache.
  4. Invocation Engine applies middleware transforms and policies (redaction, size caps).
  5. Transport Adapter forwards request to backend; response streamed back to client.
  6. Observability records metrics and logs with correlation ID.
* **Virtual Tool Execution Flow**
  1. Client invokes virtual tool.
  2. Virtual Tools Engine validates DAG and schedules sub‑ops.
  3. Sub‑ops routed via Tool Router; connection caching reused.
  4. Engine aggregates results and enforces timeouts and stop‑on‑error semantics.
  5. Final aggregated result returned and audited.
* **Provisioning and Approval Flow**
  1. Self‑provision request enqueued by agent or admin tool.
  2. Admin reviews request in TUI/CLI; approval required.
  3. On approval, provisioning orchestrator performs sandboxed metadata fetch and registers server.
  4. Audit entry created for the decision and actions.

### Deployment and Scaling Patterns

* **Single Node Developer Mode**
  * Single binary or container with JSON config file; SQLite optional.
  * Default for quick start and local experimentation.
* **Production Single Instance**
  * Containerized deployment behind a reverse proxy; enable OAuth and SQLite for durability.
  * Use process supervisor for graceful restarts and health checks.
* **Horizontal Scaling**
  * Run multiple Goblin instances behind a load balancer for read scale.
  * Use shared persistence (SQLite replaced by a small central DB or file sync) or treat registry as eventually consistent; prefer sticky sessions for transports that require process affinity.
* **High Availability Considerations**
  * Stateless Gateway Frontend components scale horizontally.
  * Stateful elements (connection pools, STDIO child processes) require affinity or a dedicated worker tier.
  * For HA, separate the registry and approval queue into a small durable service (SQLite → lightweight DB) or use leader election for single‑writer semantics.
* **Operational Integrations**
  * Expose Prometheus metrics for scraping.
  * Logs to stdout in structured JSON for aggregator ingestion.
  * Provide health and readiness endpoints for orchestrators.

### Security and Operational Considerations

* **Secure Defaults**
  * Self‑provisioning disabled by default; minimal tool exposure.
  * No hardcoded secrets; require explicit configuration for OAuth.
* **Authentication and RBAC**
  * Middleware enforces OAuth scopes and maps to RBAC roles.
  * Admin APIs and approval actions require admin role.
* **Sandboxing and Provisioning Safety**
  * Metadata fetches do not execute remote code.
  * Full automated installs require explicit admin approval and run in a sandboxed environment when implemented.
* **Resource Controls**
  * Per‑server quotas, connection pool limits, and idle eviction prevent resource exhaustion.
  * Circuit breakers and rate limiting protect backends and gateway.
* **Audit and Compliance**
  * All admin actions and provisioning decisions logged with actor, timestamp, and diffs.
  * Logs support rotation and export; optional persistence to SQLite.
* **Trade-offs**
  * **Simplicity vs Durability:** JSON config is simple but single‑writer; SQLite adds durability and concurrency at the cost of complexity.
  * **Compatibility vs Dynamism:** Compatibility mode preserves legacy client behavior but delays exposure of new tools.
  * **Local-first Skills vs External Models:** Local embeddings preserve privacy and offline capability but may be less accurate than cloud models.
