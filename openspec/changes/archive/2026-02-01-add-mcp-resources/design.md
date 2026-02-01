## Context

MCP Resources is a core protocol feature that allows MCP servers to expose read-only data (files, database records, logs, API responses). Goblin must act as a transparent proxy/aggregator for resources, just as it does for Tools and Prompts.

**Current State:**
- Partial infrastructure exists (handlers, registry, router)
- Resources stored by raw URI (no namespacing)
- No URI template matching (TODO exists in code)
- Subscriptions explicitly disabled with TODO comment
- No TUI integration
- No meta tools for resource discovery
- No comprehensive tests

**Goal:** Complete implementation following exact Tools/Prompts aggregation pattern, with adaptations for URI-based resources.

## Goals / Non-Goals

**Goals:**
- Implement complete resource/resource template aggregation from multiple backend servers
- Add namespacing to prevent URI collisions (different pattern than tools/prompts)
- Implement URI template matching for dynamic resources
- Enable resource subscriptions with proper routing
- Add resource meta tools (catalog_resources, describe_resource, search_resources, catalog_resource_templates)
- Add TUI integration for resource management
- Implement comprehensive testing
- Ensure notification propagation works end-to-end

**Non-Goals:**
- No resource modification (MCP Resources are read-only)
- No local resource creation (defer to v2)
- No resource caching beyond current registry patterns

## Decisions

### Decision 1: Namespacing Pattern for Resources

**Choice:** Use URI prefix format instead of `${serverId}_${name}` pattern.

**Rationale:**
- Resources are identified by URIs, not names
- Can't simply prefix names - would break URI structure
- Need to preserve URI scheme and path structure
- Pattern: `${serverId}://${originalUri}` or namespace within URI

**Implementation:**
```typescript
// Option: Store with serverId annotation in registry, but return raw URIs to clients
// Client sees: file:///path/to/file
// Registry stores: { uri: "file:///path/to/file", serverId: "filesystem", namespacedUri: "filesystem_file___path_to_file" }

// For template matching, store mapping
interface ResourceEntry {
  id: string;              // namespaced URI (e.g., "filesystem_file___path_to_file")
  def: Resource;           // Full MCP Resource definition
  serverId: string;        // Original server ID
  namespacedUri: string;   // Client-facing URI with namespace
}

interface ResourceTemplateEntry {
  id: string;                    // unique identifier
  def: ResourceTemplate;         // Full MCP ResourceTemplate definition
  serverId: string;              // Original server ID
  uriTemplate: string;           // Original template
}
```

**Examples:**
- Raw URI: `file:///logs/app.log` → Namespaced: `filesystem_file___logs_app.log`
- Template: `mcp://database/{table}/{id}` → Stored with serverId mapping

### Decision 2: Registry Structure

**Choice:** Enhanced registry with namespacing, template matching, and subscription tracking.

**Implementation:**
```typescript
class Registry {
  private resources = new Map<string, ResourceEntry>();
  private resourceTemplates = new Map<string, ResourceTemplateEntry>();
  private serverResources = new Map<string, Set<string>>(); // serverId -> Set<resourceId>
  private serverResourceTemplates = new Map<string, Set<string>>();
  private subscriptions = new Map<string, Set<string>>(); // clientId -> Set<uri>
  private uriToResource = new Map<string, string>(); // rawUri -> namespacedId
  private cachedResources: Resource[] | null = null;

  // Sync resources from backend
  async syncServer(serverId: string, client: Client): Promise<void> {
    const result = await client.listResources();
    const resources = result.resources || [];
    const newResourceIds = new Set<string>();

    for (const resource of resources) {
      const id = this.namespaceUri(serverId, resource.uri);
      newResourceIds.add(id);
      this.resources.set(id, {
        id,
        def: resource,
        serverId,
        namespacedUri: id,
      });
      this.uriToResource.set(resource.uri, id);
    }
    // ... handle removals
  }

  // Sync resource templates
  async syncResourceTemplates(serverId: string, client: Client): Promise<void> {
    const result = await client.listResourceTemplates();
    const templates = result.resourceTemplates || [];

    for (const template of templates) {
      const id = `${serverId}_${template.uriTemplate}`;
      this.resourceTemplates.set(id, {
        id,
        def: template,
        serverId,
        uriTemplate: template.uriTemplate,
      });
    }
  }

  // Find server for a URI (supports template matching)
  findServerForResource(namespacedUri: string): { serverId: string; originalUri: string } | null {
    const entry = this.resources.get(namespacedUri);
    if (entry) {
      return { serverId: entry.serverId, originalUri: entry.def.uri };
    }

    // Try template matching
    for (const template of this.resourceTemplates.values()) {
      if (this.matchesTemplate(namespacedUri, template.uriTemplate)) {
        return { serverId: template.serverId, originalUri: namespacedUri };
      }
    }

    return null;
  }

  // Subscribe client to resource
  async subscribe(clientId: string, uri: string): Promise<void> {
    if (!this.subscriptions.has(clientId)) {
      this.subscriptions.set(clientId, new Set());
    }
    this.subscriptions.get(clientId)!.add(uri);
  }

  // Get subscribers for a URI
  getSubscribers(uri: string): string[] {
    const subscribers: string[] = [];
    for (const [clientId, uris] of this.subscriptions.entries()) {
      if (uris.has(uri)) {
        subscribers.push(clientId);
      }
    }
    return subscribers;
  }
}
```

### Decision 3: Router Routing

**Choice:** Route resource read requests to correct backend, handle subscriptions.

**Implementation:**
```typescript
class Router {
  async readResource(namespacedUri: string): Promise<ReadResourceResult> {
    return this.executeRequest(
      "resource",
      namespacedUri,
      () => this.registry.findServerForResource(namespacedUri),
      async (client, originalUri, signal) => {
        const result = await client.readResource({ uri: originalUri }, ReadResourceResultSchema, { signal });
        return result;
      }
    );
  }

  async subscribe(namespacedUri: string): Promise<void> {
    const mapping = this.registry.findServerForResource(namespacedUri);
    if (!mapping) {
      throw new Error(`Resource not found: ${namespacedUri}`);
    }

    const client = this.getClient(mapping.serverId);
    await client.subscribeResource({ uri: mapping.originalUri });
    await this.registry.subscribe(this.currentClientId, namespacedUri);
  }

  async unsubscribe(namespacedUri: string): Promise<void> {
    const mapping = this.registry.findServerForResource(namespacedUri);
    if (mapping) {
      const client = this.getClient(mapping.serverId);
      await client.unsubscribeResource({ uri: mapping.originalUri });
    }
    await this.registry.unsubscribe(this.currentClientId, namespacedUri);
  }
}
```

### Decision 4: Server Handlers

**Choice:** Enable resource handlers including subscriptions, maintain namespacing in responses.

**Implementation:**
```typescript
class GatewayServer {
  private setupResourceHandlers(): void {
    // Resources List
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      if (!this.cachedResourceList) {
        this.cachedResourceList = this.registry.getAllResources().map((entry) => ({
          uri: entry.namespacedUri,
          name: entry.def.name,
          title: entry.def.title,
          description: entry.def.description,
          mimeType: entry.def.mimeType,
          size: entry.def.size,
        }));
      }
      return { resources: this.cachedResourceList };
    });

    // Resource Templates List
    this.server.setRequestHandler(ListResourceTemplatesRequestSchema, async () => {
      if (!this.cachedResourceTemplateList) {
        this.cachedResourceTemplateList = this.registry.getAllResourceTemplates().map((entry) => ({
          uriTemplate: entry.uriTemplate,
          name: entry.def.name,
          title: entry.def.title,
          description: entry.def.description,
        }));
      }
      return { resourceTemplates: this.cachedResourceTemplateList };
    });

    // Resource Read
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;
      try {
        return await this.router.readResource(uri);
      } catch (error) {
        throw this.mapError(error);
      }
    });

    // Resource Subscribe
    this.server.setRequestHandler(SubscribeRequestSchema, async (request) => {
      const { uri } = request.params;
      await this.router.subscribe(uri);
    });

    // Resource Unsubscribe
    this.server.setRequestHandler(UnsubscribeRequestSchema, async (request) => {
      const { uri } = request.params;
      await this.router.unsubscribe(uri);
    });
  }

  private setupResourceNotificationHandlers(): void {
    // Handle resource list changes from backend
    client.setNotificationHandler(ResourceListChangedNotificationSchema, async () => {
      await this.syncServer(serverId, client);
    });

    // Handle resource updates (for subscribed resources)
    client.setNotificationHandler(ResourceUpdatedNotificationSchema, async (notification) => {
      const { uri } = notification.params;
      // Find original URI and forward to subscribed clients
      const originalUri = this.registry.getOriginalUri(uri);
      if (originalUri) {
        // Notify all clients subscribed to this resource
        const subscribers = this.registry.getSubscribers(originalUri);
        for (const clientId of subscribers) {
          this.notifyClient(clientId, {
            method: "notifications/resources/updated",
            params: { uri: originalUri },
          });
        }
      }
    });
  }
}
```

### Decision 5: Meta Tools for Resources

**Choice:** Create analogous meta tools to Tools/Prompts.

**Implementation:**
```typescript
// catalog_resources - List all resources with compact cards
export const catalogResources = defineMetaTool({
  name: "catalog_resources",
  description: "Lists all available resources with compact cards (uri, name, mimeType).",
  parameters: z.object({
    serverId: z.string().optional().describe("Filter resources by server ID"),
    mimeType: z.string().optional().describe("Filter by MIME type"),
  }),
  execute: async ({ serverId, mimeType }, { registry }) => {
    const allResources = registry.getAllResources();
    let filtered = serverId ? allResources.filter((r) => r.serverId === serverId) : allResources;
    if (mimeType) {
      filtered = filtered.filter((r) => r.def.mimeType === mimeType);
    }
    const resources = filtered.map((r) => ({
      uri: r.namespacedUri,
      name: r.def.name,
      mimeType: r.def.mimeType,
      size: r.def.size,
      serverId: r.serverId,
    }));
    return { resources };
  },
});

// describe_resource - Get full resource details
export const describeResource = defineMetaTool({
  name: "describe_resource",
  description: "Get detailed information about a specific resource including metadata.",
  parameters: z.object({
    uri: z.string().describe("Namespaced resource URI"),
  }),
  execute: async ({ uri }, { registry }) => {
    const resource = registry.getResource(uri);
    if (!resource) throw new Error(`Resource not found: ${uri}`);
    return {
      uri: resource.namespacedUri,
      name: resource.def.name,
      title: resource.def.title,
      description: resource.def.description,
      mimeType: resource.def.mimeType,
      size: resource.def.size,
      serverId: resource.serverId,
    };
  },
});

// search_resources - Search resources
export const searchResources = defineMetaTool({
  name: "search_resources",
  description: "Search for resources using keyword or MIME type matching.",
  parameters: z.object({
    query: z.string().describe("Search query"),
    mimeType: z.string().optional().describe("Filter by MIME type"),
  }),
  execute: async ({ query, mimeType }, { registry }) => {
    // Use MiniSearch similar to catalog_search
    // Return compact cards matching the query
  },
});

// catalog_resource_templates - List all resource templates
export const catalogResourceTemplates = defineMetaTool({
  name: "catalog_resource_templates",
  description: "Lists all available resource templates with their URI patterns.",
  parameters: z.object({
    serverId: z.string().optional().describe("Filter templates by server ID"),
  }),
  execute: async ({ serverId }, { registry }) => {
    const allTemplates = registry.getAllResourceTemplates();
    const filtered = serverId ? allTemplates.filter((t) => t.serverId === serverId) : allTemplates;
    const templates = filtered.map((t) => ({
      uriTemplate: t.uriTemplate,
      name: t.def.name,
      description: t.def.description,
      serverId: t.serverId,
    }));
    return { templates };
  },
});
```

### Decision 6: TUI Integration

**Choice:** Add Resources panel alongside Tools/Prompts panels.

**Implementation:**
```tsx
// In TUI main layout
<Box>
  <ServersPanel />
  <ToolsPanel />
  <PromptsPanel />
  <ResourcesPanel />  {/* NEW */}
  <LogsPanel />
</Box>

// ResourcesPanel shows:
// - List of aggregated resources with namespaced URIs
// - Filter by server
// - Filter by MIME type
// - Search functionality
// - Resource details on selection
// - Subscription status indicator
// - Resource templates section
```

### Decision 7: Notification Propagation Chain

**Choice:** Complete subscription routing and notification forwarding.

**Implementation:**
```typescript
// Backend → Registry
client.setNotificationHandler(ResourceListChangedNotificationSchema, async () => {
  await this.syncServer(serverId, client);
});

client.setNotificationHandler(ResourceUpdatedNotificationSchema, async (notification) => {
  const { uri } = notification.params;
  const mapping = this.findMappingForOriginalUri(uri);
  if (mapping) {
    // Notify registry of update
    this.registry.notifyResourceUpdated(mapping.namespacedUri);

    // Forward to subscribed clients
    const subscribers = this.registry.getSubscribers(mapping.namespacedUri);
    for (const clientId of subscribers) {
      this.sendNotificationToClient(clientId, {
        method: "notifications/resources/updated",
        params: { uri: mapping.namespacedUri },
      });
    }
  }
});

// Registry → Gateway Server
this.registry.on("resource-change", () => {
  this.cachedResourceList = null;
  this.server.notification({ method: "notifications/resources/list_changed" });
});

this.registry.on("resource-update", (uri) => {
  // Notify clients with matching subscriptions
  this.notifySubscribedClients(uri);
});
```

### Decision 8: URI Namespacing Algorithm

**Choice:** Transform URI to safe namespaced identifier.

**Implementation:**
```typescript
function namespaceUri(serverId: string, rawUri: string): string {
  // Replace special characters with underscores for safe storage
  // file:///path/to/file -> filesystem_file___path_to_file
  const safeUri = rawUri
    .replace(/[^a-zA-Z0-9._~-]/g, "_")
    .replace(/_{2,}/g, "_");
  return `${serverId}_${safeUri}`;
}

function parseNamespacedUri(namespacedUri: string): { serverId: string; originalUri: string } | null {
  const firstUnderscore = namespacedUri.indexOf("_");
  if (firstUnderscore === -1) return null;

  const serverId = namespacedUri.substring(0, firstUnderscore);
  const uriPart = namespacedUri.substring(firstUnderscore + 1);

  // Restore original URI (reverse the escaping)
  const originalUri = uriPart.replace(/_/g, "/");
  return { serverId, originalUri };
}
```

## Risks / Trade-offs

### [Risk] URI Escaping Collisions
**→ Mitigation:** Use consistent escaping algorithm and handle edge cases. Test with various URI schemes (file://, http://, mcp://, etc.).

### [Risk] Template Matching Complexity
**→ Mitigation:** Start with simple prefix matching, add full RFC 6570 support in v2. Store template→server mapping for O(1) lookups.

### [Risk] Subscription Memory Usage
**→ Mitigation:** Track subscriptions efficiently, clean up on client disconnect. Most users won't subscribe to hundreds of resources.

### [Risk] Blob Resource Forwarding
**→ Mitigation:** Ensure base64 encoding is preserved. Blob contents are already base64 in MCP protocol.

### [Risk] Large Resource Content
**→ Mitigation:** Consider streaming for very large resources. MCP doesn't define streaming, so proxy as-is for now.

## Open Questions

1. **URI Scheme Handling:** Should we preserve or transform the scheme in namespaced URIs?
2. **Template Variables:** How to handle template variable validation before routing?
3. **Subscription QoS:** Should we acknowledge subscription after backend confirms?
4. **Resource Size Limits:** Should Goblin enforce max resource size?

## Implementation Pattern (Resources)

```
┌─────────────────────────────────────────────────────────────────┐
│                   RESOURCE AGGREGATION FLOW                     │
└─────────────────────────────────────────────────────────────────┘

  Backend Server                          Goblin Gateway
        │                                        │
        │  1. client.listResources()             │
        │ ──────────────────────────────────────►│
        │  2. Store with URI namespacing         │
        │     resources.set("serverId_uri...",   │
        │       { id, def: Resource, serverId }) │
        │                                        │
        │  3. client.listResourceTemplates()     │
        │ ──────────────────────────────────────►│
        │  4. Store template with mapping        │
        │                                        │
        │  5. notifications/resources/list_changed│
        │ ◄─────────────────────────────────────│
        │                                        │
        │  Client Request                       │
        │ ──────────────────────────────────────►│
        │  6. GatewayServer.listResources()      │
        │     Returns all namespaced resources   │
        │                                        │
        │  7. Client selects "serverId_uri..."  │
        │ ──────────────────────────────────────►│
        │  8. GatewayServer.readResource()       │
        │     → Router.readResource()            │
        │     → Lookup registry (exact + template)│
        │     → Route to backend                 │
        │     → Proxy client.readResource()      │
        │     → Return contents                  │
        │                                        │
        │  9. Client subscribes to resource      │
        │ ──────────────────────────────────────►│
        │  10. Gateway subscribes to backend     │
        │     → Track subscription               │
        │                                        │
        │  11. Backend resource changes          │
        │ ◄─────────────────────────────────────│
        │  12. notifications/resources/updated   │
        │     → Lookup subscribers               │
        │     → Forward notifications            │
        │                                        │
        │  13. Backend resource list changes     │
        │ ◄─────────────────────────────────────│
        │  14. Emit "resource-change" event      │
        │     → Invalidate cache                 │
        │     → Notify clients                   │
        │     (notifications/resources/list_changed)
```

This follows the SAME pattern as Tools/Prompts with adaptations for URI-based resources.
