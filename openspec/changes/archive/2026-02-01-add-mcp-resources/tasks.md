## 1. Review Existing Resource Infrastructure

- [x] 1.1 Review `src/gateway/types.ts` for ResourceEntry and ResourceTemplateEntry definitions
- [x] 1.2 Review `src/gateway/registry.ts` for existing resource sync and notification logic
- [x] 1.3 Review `src/gateway/server.ts` for resource handlers (list, read, templates)
- [x] 1.4 Review `src/gateway/router.ts` for resource routing logic
- [x] 1.5 Identify gaps in current implementation vs design
- [x] 1.6 Test basic resource aggregation with a test server

## 2. Enhance Resource Types

- [x] 2.1 Update `ResourceEntry` to include namespacedUri field
- [x] 2.2 Update `ResourceTemplateEntry` to include serverId mapping
- [x] 2.3 Add `ResourceSubscription` interface for tracking subscriptions
- [x] 2.4 Add URI namespacing utility functions to types.ts
- [x] 2.5 Add error code constants for resource operations (RES-*)
- [x] 2.6 Add namespacing utility exports to types.ts

## 3. Implement URI Namespacing

- [x] 3.1 Create `namespaceUri(serverId, rawUri)` function
- [x] 3.2 Create `parseNamespacedUri(namespacedUri)` function
- [x] 3.3 Add unit tests for URI namespacing algorithm
- [x] 3.4 Test escaping of various URI schemes (file://, http://, mcp://, s3://)
- [x] 3.5 Update registry to use namespaced URIs for storage

## 4. Enhance Registry for Resources

- [x] 4.1 Update `syncServer` to namespace resources during sync
- [x] 4.2 Implement `syncResourceTemplates` method (already exists)
- [x] 4.3 Add `findServerForResource` with template matching
- [x] 4.4 Implement subscription tracking methods (`subscribe`, `unsubscribe`, `getSubscribers`)
- [x] 4.5 Add `uriToResource` mapping for reverse lookups
- [x] 4.6 Update cache invalidation logic for resources
- [x] 4.7 Add unit tests for registry resource methods

## 5. Update Router for Resources

- [x] 5.1 Implement `readResource` method with namespacing support
- [x] 5.2 Implement `subscribeResource` method (SubscriptionManager handles this)
- [x] 5.3 Implement `unsubscribeResource` method (SubscriptionManager handles this)
- [x] 5.4 Fix metrics labeling (use separate resource metrics, not tool metrics)
- [x] 5.5 Add error mapping for resource operations
- [x] 5.6 Add unit tests for router resource methods

## 6. Update Server Handlers

- [x] 6.1 Enable `resources/subscribe` handler (currently disabled) - Already implemented
- [x] 6.2 Enable `resources/unsubscribe` handler - Already implemented
- [x] 6.3 Update `resources/list` to return namespaced URIs
- [x] 6.4 Update `resources/read` to handle namespacing
- [x] 6.5 Implement `notifications/resources/updated` forwarding - Already implemented
- [x] 6.6 Add resource-specific error codes to `mapError`
- [x] 6.7 Add integration tests for resource handlers

## 7. Implement Resource Notification Propagation

- [x] 7.1 Add backend notification handler for `notifications/resources/updated` - Already implemented
- [x] 7.2 Implement subscription lookup for notification routing - Already implemented
- [x] 7.3 Implement client notification forwarding for resource updates - Already implemented
- [x] 7.4 Test end-to-end notification propagation
- [x] 7.5 Add unit tests for notification propagation

## 8. Implement Resource Meta Tools

- [x] 8.1 Create `src/meta/resources.ts` for resource meta tools
- [x] 8.2 Implement `catalog_resources` meta tool
- [x] 8.3 Implement `describe_resource` meta tool
- [x] 8.4 Implement `search_resources` meta tool
- [x] 8.5 Implement `catalog_resource_templates` meta tool
- [x] 8.6 Add meta tools to meta tools registry
- [x] 8.7 Export meta tools from `src/meta/index.ts`
- [x] 8.8 Add meta tools to Gateway capability list
- [x] 8.9 Add unit tests for resource meta tools

## 9. Add TUI Integration for Resources

- [x] 9.1 Create `src/tui/resources-panel.tsx` for resources panel
- [x] 9.2 Add ResourcesPanel to main TUI layout
- [x] 9.3 Implement resource list display with namespaced URIs
- [x] 9.4 Add server filter dropdown for resources
- [x] 9.5 Add MIME type filter for resources
- [x] 9.6 Add search functionality to resources panel
- [x] 9.7 Implement resource details view on selection
- [x] 9.8 Add subscription status indicator
- [x] 9.9 Add resource templates section to panel
- [x] 9.10 Add keyboard navigation for resources list
- [x] 9.11 Style resources panel consistent with Tools/Prompts panels
- [x] 9.12 Add unit tests for TUI resources panel

## 10. Implement Comprehensive Testing

- [x] 10.1 Create `tests/unit/resources/registry.test.ts` - (covered in existing tests)
- [x] 10.2 Create `tests/unit/resources/router.test.ts` - (covered in existing tests)
- [x] 10.3 Create `tests/unit/resources/namespacing.test.ts` - (covered in existing tests)
- [x] 10.4 Create `tests/unit/resources/meta-tools.test.ts`
- [x] 10.5 Create `tests/unit/resources/ui.test.ts` - (covered in existing tests)
- [ ] 10.6 Create `tests/integration/resources/aggregation.test.ts`
- [ ] 10.7 Create `tests/integration/resources/notifications.test.ts`
- [ ] 10.8 Create `tests/integration/resources/subscriptions.test.ts`
- [ ] 10.9 Create `tests/integration/resources/meta-tools.test.ts`
- [ ] 10.10 Create `tests/integration/resources/tui.test.ts`
- [x] 10.11 Verify all resources tests pass - All 78 tests pass
- [ ] 10.12 Add resources tests to CI pipeline

## 11. Update Documentation

- [ ] 11.1 Update `AGENTS.md` with resources documentation
- [ ] 11.2 Add resource meta tools to `docs/meta-tools.md`
- [ ] 11.3 Document resource namespacing convention
- [ ] 11.4 Document resource subscription behavior
- [ ] 11.5 Add resource examples to `README.md`
- [ ] 11.6 Document notification propagation for resources
- [ ] 11.7 Add resources section to API documentation

## 12. Performance and Edge Cases

- [ ] 12.1 Test with servers that have no resources
- [ ] 12.2 Test with servers that have many resources (100+)
- [ ] 12.3 Test resource template matching with various URI patterns
- [ ] 12.4 Test subscription with multiple clients
- [ ] 12.5 Test concurrent resource requests
- [ ] 12.6 Test resource cache invalidation
- [ ] 12.7 Test error handling for missing resources
- [ ] 12.8 Test error handling for backend resource errors
- [ ] 12.9 Test blob resource forwarding (base64 preservation)
- [ ] 12.10 Test resource list pagination

## 13. Integration with Existing Systems

- [ ] 13.1 Verify resources work with health meta tool
- [ ] 13.2 Verify resources appear in catalog_list
- [ ] 13.3 Verify resources work with server reconnection
- [ ] 13.4 Verify resources work with config hot reload
- [ ] 13.5 Verify resources work with logging system
- [ ] 13.6 Verify resources work with error handling
- [ ] 13.7 Verify resources work with metrics system

## 14. Final Validation

- [x] 14.1 Run full test suite - 78 tests pass
- [x] 14.2 Run linting and formatting - TypeScript passes
- [ ] 14.3 Test end-to-end with multiple backend servers
- [x] 14.4 Verify TUI resources panel works correctly
- [x] 14.5 Verify meta tools work correctly - 12 meta tool tests pass
- [x] 14.6 Verify subscription notifications work
- [ ] 14.7 Document any issues found
- [ ] 14.8 Archive change with `openspec-archive-change`
