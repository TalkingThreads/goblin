## Prompts Aggregation Specification

### Purpose
Define how Goblin aggregates, proxies, and manages MCP Prompts from multiple backend servers, following the exact same pattern as Tool aggregation.

### Requirements

#### Scenario: Prompt Synchronization from Backend Server
- **WHEN** a backend MCP server connects to Goblin
- **THEN** Goblin fetches available prompts via `prompts/list`
- **AND** each prompt is stored with namespaced ID: `${serverId}_${promptName}`
- **AND** the registry maintains server-to-prompts mapping
- **AND** the cached prompt list is invalidated

#### Scenario: Prompt List Request from Client
- **WHEN** a client sends `prompts/list` request to Gateway
- **THEN** Gateway returns all aggregated prompts from all connected servers
- **AND** each prompt includes: name (namespaced), description, arguments
- **AND** the response is cached for performance
- **AND** cache is invalidated when any backend sends `notifications/prompts/list_changed`

#### Scenario: Prompt Get Request from Client
- **WHEN** a client sends `prompts/get` request with namespaced prompt name
- **THEN** Gateway extracts the server ID from the namespaced name
- **AND** Gateway routes request to the appropriate backend server
- **AND** Gateway strips namespace before calling backend
- **AND** Gateway returns the prompt content (messages) to client
- **AND** errors are mapped to appropriate Gateway error codes

#### Scenario: Prompt Notification from Backend
- **WHEN** a backend server sends `notifications/prompts/list_changed`
- **THEN** Goblin re-syncs prompts from that server
- **AND** the Gateway cache is invalidated
- **AND** Gateway broadcasts `notifications/prompts/list_changed` to all connected clients

#### Scenario: Prompt Argument Validation
- **WHEN** a client requests a prompt with arguments
- **THEN** Gateway validates required arguments are present
- **AND** Gateway passes arguments to backend server
- **AND** any validation errors are returned to client with helpful message

#### Scenario: Multi-modal Prompt Content
- **WHEN** a prompt returns messages with multi-modal content (text, image, audio, resource)
- **THEN** Gateway proxies the content without modification
- **AND** content types are preserved in the response
- **AND** resource references are maintained

#### Scenario: Prompt Meta Tool - catalog_prompts
- **WHEN** client calls `catalog_prompts` meta tool
- **THEN** returns compact prompt cards with: name, description, argument keys, serverId
- **AND** supports optional `serverId` filter
- **AND** returns empty array if no prompts match

#### Scenario: Prompt Meta Tool - describe_prompt
- **WHEN** client calls `describe_prompt` meta tool with namespaced name
- **THEN** returns full prompt definition including all arguments and metadata
- **AND** returns error if prompt not found
- **AND** includes serverId in response

#### Scenario: Prompt Meta Tool - search_prompts
- **WHEN** client calls `search_prompts` meta tool with query
- **THEN** returns compact cards matching the query
- **AND** supports fuzzy/keyword matching
- **AND** results are sorted by relevance

### Data Structures

#### PromptEntry
```typescript
interface PromptEntry {
  id: string;           // namespaced (e.g., "serverId_promptName")
  def: Prompt;          // Full MCP Prompt definition
  serverId: string;     // Original server ID
}
```

#### Prompt Definition (MCP Protocol)
```typescript
interface Prompt {
  name: string;
  description?: string;
  arguments?: PromptArgument[];
  icons?: Icon[];
}

interface PromptArgument {
  name: string;
  description?: string;
  required?: boolean;
}

interface PromptMessage {
  role: "user" | "assistant";
  content: {
    type: "text" | "image" | "audio" | "resource";
    text?: string;
    data?: string;
    mimeType?: string;
    resource?: {
      uri: string;
    };
  };
}

interface GetPromptResult {
  messages: PromptMessage[];
}
```

#### Meta Tool Responses
```typescript
interface PromptCompactCard {
  name: string;              // namespaced ID
  description: string;
  arguments: string[];       // argument names
  serverId: string;
}

interface PromptFullDescription {
  name: string;
  description: string;
  arguments: PromptArgument[];
  serverId: string;
}

interface SearchPromptsResult {
  prompts: PromptCompactCard[];
  query: string;
  count: number;
}
```

### Namespacing Convention

**Format:** `${serverId}_${promptName}`

**Rules:**
- serverId is the configured ID for the backend server
- promptName is the original name from the backend
- Separator is underscore (`_`)
- Namespaced name is used in all Gateway→Client communications
- Original name is used in Gateway→Backend communications

**Examples:**
- `filesystem_codeReview` - codeReview prompt from filesystem server
- `github_prReview` - prReview prompt from github server
- `postgres_schemaSummary` - schemaSummary prompt from postgres server
- `goblin_health` - health meta tool (local)

### Error Codes

```typescript
const PromptErrorCodes = {
  PROMPT_NOT_FOUND: "PROMPT-001",
  PROMPT_INVALID_ARGS: "PROMPT-002",
  PROMPT_BACKEND_ERROR: "PROMPT-003",
  PROMPT_TIMEOUT: "PROMPT-004",
  PROMPT_NOT_IMPLEMENTED: "PROMPT-005",
} as const;
```

### Configuration

No additional configuration required for prompts aggregation. All behavior is determined by connected backend servers.

### Testing Requirements

1. **Unit Tests:**
   - PromptEntry creation and storage
   - Namespacing logic
   - Registry methods (get, getAll, getByServer)
   - Router routing logic
   - Error mapping

2. **Integration Tests:**
   - End-to-end prompt aggregation from multiple servers
   - Notification propagation chain
   - Meta tools functionality
   - Cache invalidation behavior

3. **Manual Tests:**
   - Verify TUI prompts panel displays correctly
   - Test prompt invocation through Gateway
   - Verify notification propagation

### Performance Considerations

- Prompt list is cached; cache invalidation on notification
- Most servers have few prompts (typically < 20)
- No pagination needed for current scale
- Consider pagination if aggregating 100+ prompts total
