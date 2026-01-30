## 1. Gateway Server Compliance
- [ ] 1.1 Modify `src/gateway/server.ts`: Remove `prompts` and `resources` from capabilities configuration.
- [ ] 1.2 Modify `src/gateway/server.ts`: Implement `sendToolListChanged()` method using `this.server.notification()`.
- [ ] 1.3 Update `setupEvents` to call `sendToolListChanged` on registry change.

## 2. Registry Dynamic Sync
- [ ] 2.1 Modify `src/gateway/registry.ts`: Add `subscribeToBackend(serverId, client)` logic.
- [ ] 2.2 Implement handler for `notifications/tools/list_changed`.
- [ ] 2.3 Implement `updateServer(serverId, client)` to re-fetch and diff tools.
- [ ] 2.4 Ensure `addServer` calls `subscribeToBackend`.

## 3. Testing
- [ ] 3.1 Add unit test: `GatewayServer` sends notification on registry change.
- [ ] 3.2 Add unit test: `Registry` re-syncs when client emits notification.
