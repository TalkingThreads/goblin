## MODIFIED Requirements

### Requirement: Server Management

The registry SHALL manage the lifecycle of tool synchronization for connected servers.

#### Scenario: Add server
- **WHEN** `addServer(serverId, client)` is called
- **THEN** registry fetches all tools from the client (handling pagination) and stores them indexed by server ID
- **AND** registry subscribes to `notifications/tools/list_changed` from the client

#### Scenario: Remove server
- **WHEN** `removeServer(serverId)` is called
- **THEN** registry removes all tools associated with that server

#### Scenario: Handle backend updates
- **WHEN** backend sends `notifications/tools/list_changed`
- **THEN** registry re-fetches tools from that backend and updates the catalog
- **AND** emits a `change` event

### Requirement: Event Notification

The registry SHALL emit events when the tool catalog changes.

#### Scenario: Emit change event
- **WHEN** tools are added, removed, or updated
- **THEN** registry emits `change` event
- **AND** `GatewayServer` sends `notifications/tools/list_changed` to all connected clients
