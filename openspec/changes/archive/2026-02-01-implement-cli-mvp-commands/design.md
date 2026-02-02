## Context

The Goblin CLI currently exists as a scaffold in `src/cli/index.ts` using Commander.js. It defines three commands (`start`, `status`, `tools`) but all are stubs that only log messages. The CLI is essential for developer workflows, scripting, and automation.

**Current State:**
- `src/cli/index.ts` has ~47 lines with stub implementations
- Commands log messages but don't actually start gateway or access services
- No connection to registry, connection manager, or health endpoints
- No JSON output mode for scripting
- No server management commands

**Stakeholders:**
- Developers using CLI for local development and scripting
- Operators automating gateway management
- CI/CD pipelines integrating with Goblin

**Constraints:**
- Must use Commander.js (already in dependencies)
- Must integrate with existing gateway services (registry, connection manager, health)
- Must support both human-readable and JSON output
- Must follow existing code style from AGENTS.md

## Goals / Non-Goals

**Goals:**
- Implement functional `goblin start` command that initializes and runs the gateway
- Implement `goblin status` command showing server count, tool count, health
- Implement `goblin tools` command listing available tools
- Add `goblin servers` command showing configured servers with status
- Add `goblin health` command for detailed health checks
- Add `goblin config validate` and `goblin config show` commands
- Add `goblin logs` command for log viewing
- Support `--json` flag for scriptable output
- Support `--config` flag for config path override
- Follow existing CLI patterns and error handling

**Non-Goals:**
- No TUI launching from CLI (separate `--tui` flag already exists)
- No interactive server management (use config file)
- No admin approval queue (v1 feature)
- No skills service commands (v1 feature)
- No RBAC configuration (v1 feature)

## Decisions

### Decision 1: Command Structure

**Choice:** Modular command files in `src/cli/commands/` directory

**Rationale:**
- Current `src/cli/index.ts` is getting crowded
- Separation enables testing and maintainability
- Each command can have its own imports and logic
- Consistent with project structure (`src/tui/components/` pattern)

**Implementation:**
```
src/cli/
├── index.ts              # CLI entry, command registration
├── commands/
│   ├── start.ts          # Start gateway command
│   ├── status.ts         # Status command
│   ├── tools.ts          # Tools list command
│   ├── servers.ts        # Servers list command
│   ├── health.ts         # Health command
│   ├── config.ts         # Config subcommands (validate, show)
│   └── logs.ts           # Logs command
└── utils/
    ├── output.ts         # JSON output formatting
    ├── errors.ts         # CLI error handling
    └── flags.ts          # Global flag definitions
```

### Decision 2: Gateway Startup Flow

**Choice:** Reuse gateway initialization logic from `src/index.ts`

**Rationale:**
- Avoid duplicating initialization code
- Gateway startup is complex (config, transports, server)
- Single source of truth for startup

**Implementation:**
```typescript
// src/cli/commands/start.ts
import { createGateway } from "../../index.js";

async function startGateway(options: StartOptions): Promise<void> {
  const gateway = await createGateway({
    configPath: options.config,
  });
  
  await gateway.start();
  
  // Handle graceful shutdown
  process.on("SIGINT", async () => {
    await gateway.stop();
    process.exit(0);
  });
  
  // Keep process running
  await new Promise(() => {}); // Never resolve
}
```

### Decision 3: Status Command Data Source

**Choice:** Use health endpoint (`/health`) for status data

**Rationale:**
- Health endpoint already aggregates gateway and server status
- Consistent with how TUI would get data
- Works even when CLI is remote

**Implementation:**
```typescript
// src/cli/commands/status.ts
import { fetchHealth } from "../utils/health.js";

async function showStatus(options: StatusOptions): Promise<void> {
  const health = await fetchHealth(options.gatewayUrl);
  
  if (options.json) {
    console.log(JSON.stringify(health, null, 2));
  } else {
    printHumanStatus(health);
  }
}
```

### Decision 4: Tools Command Implementation

**Choice:** Connect to registry via HTTP API or direct import

**Rationale:**
- If gateway is running, use HTTP API (works remotely)
- If not running, could import registry directly (MVP scope: assume running)
- HTTP API is more realistic for CLI usage

**Implementation:**
```typescript
// src/cli/commands/tools.ts
import { fetchTools } from "../utils/api.js";

async function listTools(options: ToolsOptions): Promise<void> {
  const tools = await fetchTools(options.gatewayUrl);
  
  if (options.json) {
    console.log(JSON.stringify({ tools }, null, 2));
  } else {
    printToolTable(tools);
  }
}
```

### Decision 5: Output Formatting

**Choice:** Separate formatting logic from command logic

**Rationale:**
- Commands focus on data retrieval
- Formatters handle output style
- Easy to add new formats later

**Implementation:**
```typescript
// src/cli/utils/output.ts
interface OutputOptions {
  json: boolean;
  compact: boolean;
}

function formatTools(tools: Tool[], options: OutputOptions): string {
  if (options.json) {
    return JSON.stringify({ tools }, null, 2);
  }
  return formatToolTable(tools, options.compact);
}
```

### Decision 6: Error Handling

**Choice:** Consistent error messages with exit codes

**Rationale:**
- Scripts need to detect failures
- Clear messages for humans
- Follow Unix conventions

**Exit Codes:**
| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | General error |
| 2 | Invalid arguments |
| 3 | Gateway not running (when required) |
| 4 | Config validation error |
| 5 | Connection error |

**Implementation:**
```typescript
// src/cli/utils/errors.ts
class CliError extends Error {
  constructor(
    message: string,
    public readonly exitCode: number,
    public readonly code: string
  ) {
    super(message);
  }
}

function handleError(error: unknown): never {
  if (error instanceof CliError) {
    console.error(`Error: ${error.message}`);
    process.exit(error.exitCode);
  }
  console.error(`Unexpected error: ${error}`);
  process.exit(1);
}
```

### Decision 7: Global Flags

**Choice:** Common flags defined once, shared across commands

**Rationale:**
- Consistent behavior across commands
- Easy to discover via `--help`
- DRY principle

**Global Flags:**
| Flag | Description | Default |
|------|-------------|---------|
| `--config <path>` | Config file path | `~/.goblin/config.json` |
| `--json` | JSON output | `false` |
| `--url <url>` | Gateway URL | `http://localhost:3000` |
| `--help` | Show help | - |
| `--version` | Show version | - |

### Decision 8: Config Validation Command

**Choice:** Use existing config loader validation

**Rationale:**
- Config loader already validates on load
- Reuse `ConfigLoader.validate()` or similar

**Implementation:**
```typescript
// src/cli/commands/config.ts
import { loadConfig } from "../../config/loader.js";

async function validateConfig(configPath: string): Promise<void> {
  try {
    const config = await loadConfig(configPath);
    console.log(`Config is valid: ${configPath}`);
    process.exit(0);
  } catch (error) {
    console.error(`Config validation failed:`);
    console.error(error.message);
    process.exit(4);
  }
}
```

### Decision 9: Logs Command

**Choice:** Stream logs from gateway or show recent logs

**Rationale:**
- Need real-time log visibility
- Could connect to log stream or show recent from file
- MVP: Show recent logs from file/pino

**Implementation:**
```typescript
// src/cli/commands/logs.ts
import { tailLogs } from "../utils/logs.js";

async function showLogs(options: LogsOptions): Promise<void> {
  if (options.follow) {
    await tailLogs(options.path, options.filter);
  } else {
    const logs = await getRecentLogs(options.count);
    printLogs(logs);
  }
}
```

## Risks / Trade-offs

### [Risk] Gateway Must Be Running
**→ Mitigation:** Status/tools commands require gateway to be running. Show clear error message if connection fails. Consider adding `--offline` mode for config-only commands.

### [Risk] Circular Dependencies
**→ Mitigation:** CLI importing from gateway code. Keep CLI separate, import only necessary functions. Use interfaces to decouple.

### [Risk] Testability
**→ Mitigation:** Write unit tests for each command. Mock HTTP responses for integration tests. Test error paths.

### [Risk] Output Formatting Complexity
**→ Mitigation:** Start with simple tables. Add columns dynamically. Use existing libraries like `cli-table3` if needed.

## Migration Plan

1. **Phase 1: Infrastructure**
   - Create `src/cli/commands/` directory
   - Create `src/cli/utils/` directory
   - Move/rewrite `start` command with real implementation

2. **Phase 2: Status Commands**
   - Implement `status` command
   - Implement `health` command
   - Add `servers` command

3. **Phase 3: Listing Commands**
   - Implement `tools` command
   - Add filtering options

4. **Phase 4: Config Commands**
   - Implement `config validate`
   - Implement `config show`

5. **Phase 5: Logs Command**
   - Implement `logs` command
   - Add follow/tail functionality

6. **Phase 6: Polish**
   - Add JSON output to all commands
   - Add error handling and exit codes
   - Test all commands
   - Update documentation

## Open Questions

1. **Should CLI start gateway if not running?** (e.g., `goblin tools` auto-starts)
2. **Should logs command connect to running gateway or read log files?**
3. **Should we support YAML output in addition to JSON?**
4. **Should config show display sensitive data?**
