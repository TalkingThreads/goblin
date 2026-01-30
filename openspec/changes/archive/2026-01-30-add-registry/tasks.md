## 1. Registry Foundation
- [x] 1.1 Define `ToolCard` and `ToolEntry` types in `src/gateway/types.ts`
- [x] 1.2 Implement `Registry` class in `src/gateway/registry.ts`
- [x] 1.3 Add `EventEmitter` inheritance

## 2. Tool Synchronization
- [x] 2.1 Implement `fetchTools(client)` helper with pagination support
- [x] 2.2 Implement `addServer(serverId, client)` method
- [x] 2.3 Implement `removeServer(serverId)` method
- [x] 2.4 Add error handling for failed syncs

## 3. Query API
- [x] 3.1 Implement `listTools(compact?)` method
- [x] 3.2 Implement `getTool(name)` method
- [x] 3.3 Implement `getToolsByServer(serverId)` method

## 4. Aliasing & Namespacing
- [x] 4.1 Implement namespacing logic (`${serverId}_${toolName}` default)
- [x] 4.2 Support custom alias overrides (future proofing)

## 5. Integration & Testing
- [x] 5.1 Add unit tests with mocked SDK Client
- [x] 5.2 Integrate Registry into `src/index.ts`
