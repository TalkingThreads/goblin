## Context

MCP Prompts is a core protocol feature that allows MCP servers to expose reusable prompt templates. Goblin must act as a transparent proxy/aggregator for prompts, just as it does for Tools.

**Current State:**
- Infrastructure partially exists (handlers, registry, router)
- Namespacing pattern partially implemented
- Notification handling exists but needs verification
- No TUI integration
- No meta tools for prompt discovery
- No comprehensive tests

**Goal:** Complete implementation following exact Tools pattern

## Goals / Non-Goals

**Goals:**
- Implement complete prompt aggregation from multiple backend servers
- Follow exact same architecture as Tools (sync → namespace → cache → route → notify)
- Add prompt meta tools (`catalog_prompts`, `describe_prompt`, `search_prompts`)
- Add TUI integration for prompt management
- Implement comprehensive testing
- Ensure notification propagation works end-to-end

**Non-Goals:**
- No new prompt-specific features beyond standard MCP protocol
- No local prompt creation (defer to v2)
- No prompt execution/sandboxing (just proxying)

## Decisions

### Decision 1: Namespacing Pattern

**Choice:** Use `${serverId}_${promptName}` format, identical to Tools.

**Rationale:**
- Consistent with existing Tools pattern
- Prevents collisions when multiple servers have same prompt names
- Easy to parse and reverse-engineer

**Examples:**
- `filesystem_codeReview` → from `filesystem` server
- `github_prReview` → from `github` server
- `goblin_health` → local meta tool

### Decision 2: Registry Structure

**Choice:** Identical to ToolEntry structure.

**Implementation:**
```typescript
interface PromptEntry {
  id: string;           // namespaced (e.g., "serverId_promptName")
  def: Prompt;          // Full MCP Prompt definition
  serverId: string;     // Original server ID
}

class Registry {
  private prompts = new Map<string, PromptEntry>();
  private serverPrompts = new Map<string, Set<string>>(); // serverId -> Set<promptId>
  private cachedPrompts: PromptEntry[] | null = null;

  // Same pattern as tools
  async syncServer(serverId: string, client: Client): Promise<void> {
    const prompts = await this.fetchPrompts(client);
    const newPromptIds = new Set<string>();
    for (const prompt of prompts) {
      const id = `${serverId}_${prompt.name}`;
      newPromptIds.add(id);
      this.prompts.set(id, { id, def: prompt, serverId });
    }
    // ... handle removals and cache invalidation
  }
}
```

### Decision 3: Router Routing

**Choice:** Identical to Tool routing pattern.

**Implementation:**
```typescript
class Router {
  async getPrompt(name: string, args: Record<string, string> = {}): Promise<GetPromptResult> {
    return this.executeRequest(
      "prompt",
      name,
      () => this.registry.getPrompt(name),
      (client, originalName, signal) =>
        client.getPrompt({ name: originalName, arguments: args }, GetPromptResultSchema, { signal })
    );
  }
}
```

### Decision 4: Server Handlers

**Choice:** Identical to Tool handlers.

**Implementation:**
```typescript
class GatewayServer {
  private setupHandlers(): void {
    // Prompts List
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => {
      if (!this.cachedPromptList) {
        this.cachedPromptList = this.registry.getAllPrompts().map((entry) => ({
          name: entry.id,
          description: entry.def.description,
          arguments: entry.def.arguments,
        }));
      }
      return { prompts: this.cachedPromptList };
    });

    // Prompts Get
    this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      try {
        return await this.router.getPrompt(name, args as Record<string, string>);
      } catch (error) {
        throw this.mapError(error);
      }
    });
  }
}
```

### Decision 5: Meta Tools for Prompts

**Choice:** Create analogous meta tools to Tools.

**Implementation:**
```typescript
// catalog_prompts - List all prompts with compact cards
export const catalogPrompts = defineMetaTool({
  name: "catalog_prompts",
  description: "Lists all available prompts with compact cards (name, description, argument keys).",
  parameters: z.object({
    serverId: z.string().optional().describe("Filter prompts by server ID"),
  }),
  execute: async ({ serverId }, { registry }) => {
    const allPrompts = registry.getAllPrompts();
    const filtered = serverId ? allPrompts.filter((p) => p.serverId === serverId) : allPrompts;
    const prompts = filtered.map((p) => ({
      name: p.id,
      description: p.def.description,
      arguments: p.def.arguments?.map((arg) => arg.name) || [],
      serverId: p.serverId,
    }));
    return { prompts };
  },
});

// describe_prompt - Get full prompt details
export const describePrompt = defineMetaTool({
  name: "describe_prompt",
  description: "Get detailed information about a specific prompt including arguments and message templates.",
  parameters: z.object({
    name: z.string().describe("Namespaced prompt name (e.g., 'serverId_promptName')"),
  }),
  execute: async ({ name }, { registry }) => {
    const prompt = registry.getPrompt(name);
    if (!prompt) throw new Error(`Prompt not found: ${name}`);
    return {
      name: prompt.id,
      description: prompt.def.description,
      arguments: prompt.def.arguments,
      serverId: prompt.serverId,
    };
  },
});

// search_prompts - Search prompts
export const searchPrompts = defineMetaTool({
  name: "search_prompts",
  description: "Search for prompts using keyword or fuzzy matching.",
  parameters: z.object({
    query: z.string().describe("Search query"),
  }),
  execute: async ({ query }, { registry }) => {
    // Use MiniSearch similar to catalog_search
    // Return compact cards matching the query
  },
});
```

### Decision 6: TUI Integration

**Choice:** Add Prompts panel alongside Tools panel.

**Implementation:**
```tsx
// In TUI main layout
<Box>
  <ServersPanel />
  <ToolsPanel />
  <PromptsPanel />  {/* NEW */}
  <LogsPanel />
</Box>

// PromptsPanel shows:
// - List of aggregated prompts
// - Filter by server
// - Search functionality
// - Prompt details on selection
```

### Decision 7: Notification Propagation Chain

**Choice:** Identical to Tools notification chain.

**Implementation:**
```typescript
// Backend → Registry
client.setNotificationHandler(PromptListChangedNotificationSchema, async () => {
  await this.syncServer(serverId, client);
});

// Registry → Gateway Server
this.registry.on("prompt-change", () => {
  this.cachedPromptList = null;
  this.server.notification({ method: "notifications/prompts/list_changed" });
});
```

## Risks / Trade-offs

### [Risk] Argument Validation
**→ Mitigation:** Ensure prompt arguments are validated before routing. The MCP SDK handles this, but we need to test edge cases.

### [Risk] Message Content Handling
**→ Mitigation:** Prompt messages can contain multi-modal content (text, images, audio, resources). Ensure the proxy correctly forwards all content types without modification.

### [Risk] Performance with Large Prompt Sets
**→ Mitigation:** Use caching and pagination. Most servers won't have hundreds of prompts, but we should still optimize.

### [Risk] Argument Type Mismatch
**→ Mitigation:** Ensure types match between registry storage and backend expectations. Prompts use `Record<string, string>` for arguments.

## Open Questions

1. **Prompt Arguments in Meta Tools?** Should meta tools accept prompt arguments or just return definitions?
2. **Prompt Content Caching?** Should we cache prompt content (messages) or just definitions?
3. **Prompt Filtering in TUI?** What filters should be available in the TUI Prompts panel?

## Implementation Pattern (Copy from Tools)

```
┌─────────────────────────────────────────────────────────────────┐
│                    PROMPT AGGREGATION FLOW                      │
└─────────────────────────────────────────────────────────────────┘

  Backend Server                          Goblin Gateway
        │                                        │
        │  1. client.listPrompts()              │
        │ ──────────────────────────────────────►│
        │  2. Store with namespacing            │
        │     prompts.set("serverId_prompt",     │
        │       { id, def: Prompt, serverId })   │
        │                                        │
        │  3. notifications/prompts/list_changed │
        │ ◄─────────────────────────────────────│
        │                                        │
        │  Client Request                       │
        │ ──────────────────────────────────────►│
        │  4. GatewayServer.listPrompts()       │
        │     Returns all namespaced prompts     │
        │                                        │
        │  5. Client selects "serverId_prompt" │
        │ ──────────────────────────────────────►│
        │  6. GatewayServer.getPrompt()         │
        │     → Router.getPrompt()              │
        │     → Lookup registry                │
        │     → Route to backend               │
        │     → Proxy client.getPrompt()        │
        │     → Return GetPromptResult          │
        │                                        │
        │  7. Backend prompt list changes       │
        │ ◄─────────────────────────────────────│
        │  8. Emit "prompt-change" event        │
        │     → Invalidate cache                │
        │     → Notify clients                 │
        │     (notifications/prompts/list_changed)
```

This follows EXACTLY the same pattern as Tools implementation.
