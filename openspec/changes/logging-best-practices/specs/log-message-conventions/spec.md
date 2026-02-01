## log-message-conventions Specification

### Purpose
Define standardized patterns for log messages to ensure consistency and readability.

### Requirements

#### Scenario: Action-oriented messages
- **WHEN** logging any operation
- **THEN** use past tense action-oriented format
- **AND** include the subject and action in the message

#### Scenario: Message format examples
- **WHEN** logging a successful operation
- **THEN** use format: "[Subject] [action in past tense]"
- **AND** include subject in message, not just in context

#### Scenario: Component context
- **WHEN** creating a logger for a component
- **THEN** use kebab-case component name
- **AND** the component name reflects the file or module name

#### Scenario: Dynamic values in context
- **WHEN** logging with dynamic values
- **THEN** include values in structured context object
- **AND** keep the message template simple and static
- **AND** avoid embedding values in the message string

#### Scenario: Success message format
- **WHEN** logging a successful operation
- **THEN** include the operation type and outcome
- **AND** include relevant identifiers in context

#### Scenario: Debug message format
- **WHEN** logging debug information
- **THEN** include technical details in context
- **AND** keep message concise but informative

### Message Patterns

#### Success Operations
```typescript
// ✅ Correct
logger.info({ serverId }, "Server connected");
logger.info({ serverId, toolName }, "Tool registered");
logger.info({ requestId, duration }, "Request completed");

// ❌ Avoid
logger.info("Server is connected");
logger.info("Tool was registered successfully");
logger.info("Request processing done");
```

#### Error Operations
```typescript
// ✅ Correct
logger.error({ error, serverId }, "Connection failed");
logger.error({ error, toolName }, "Tool invocation failed");

// ❌ Avoid
logger.error("Error occurred");
logger.error("Something went wrong");
```

#### State Changes
```typescript
// ✅ Correct
logger.info({ serverId, previousState, newState }, "Server state changed");
logger.warn({ serverId, reason }, "Server disabled");
```

#### Configuration Changes
```typescript
// ✅ Correct
logger.info({ configPath }, "Configuration reloaded");
logger.info({ changes }, "Configuration updated");
```

### Component Naming
- `gateway-server`: Main MCP gateway server
- `http-gateway`: HTTP transport handler
- `tool-registry`: Tool registration and management
- `config-loader`: Configuration loading and validation
- `cli-commands`: CLI command implementations
- `transport-stdio`: STDIO transport handler
- `transport-http`: HTTP transport handler
