## 1. Verify Existing Prompt Infrastructure

- [x] 1.1 Review `src/gateway/types.ts` for PromptEntry type definition
- [x] 1.2 Review `src/gateway/server.ts` for prompts/list and prompts/get handlers
- [x] 1.3 Review `src/gateway/registry.ts` for fetchPrompts and sync logic
- [x] 1.4 Review `src/gateway/router.ts` for getPrompt routing logic
- [x] 1.5 Review notification handlers for `notifications/prompts/list_changed`
- [x] 1.6 Verify namespacing pattern is correctly implemented
- [x] 1.7 Test basic prompt aggregation with a test server

## 2. Implement Prompt Meta Tools

- [x] 2.1 Create `src/meta/prompts.ts` for prompt meta tools
- [x] 2.2 Implement `catalog_prompts` meta tool
- [x] 2.3 Implement `describe_prompt` meta tool
- [x] 2.4 Implement `search_prompts` meta tool
- [x] 2.5 Add meta tools to the meta tools registry
- [x] 2.6 Export meta tools from `src/meta/index.ts`
- [x] 2.7 Add meta tools to Gateway capability list

## 3. Add TUI Integration for Prompts

- [x] 3.1 Create `src/tui/prompts-panel.tsx` for prompts panel
- [x] 3.2 Add PromptsPanel to main TUI layout
- [x] 3.3 Implement prompt list display with namespaced names
- [x] 3.4 Add server filter dropdown for prompts
- [x] 3.5 Add search functionality to prompts panel
- [x] 3.6 Implement prompt details view on selection
- [x] 3.7 Add keyboard navigation for prompts list
- [x] 3.8 Style prompts panel consistent with Tools panel

## 4. Implement Comprehensive Testing

- [x] 4.1 Create `tests/unit/prompts/registry.test.ts`
- [x] 4.2 Create `tests/unit/prompts/router.test.ts`
- [x] 4.3 Create `tests/unit/prompts/meta-tools.test.ts`
- [x] 4.4 Create `tests/unit/prompts/namespacing.test.ts`
- [ ] 4.5 Create `tests/integration/prompts/aggregation.test.ts`
- [ ] 4.6 Create `tests/integration/prompts/notifications.test.ts`
- [ ] 4.7 Create `tests/integration/prompts/meta-tools.test.ts`
- [ ] 4.8 Create `tests/integration/prompts/tui.test.ts` (if applicable)
- [ ] 4.9 Verify all prompts tests pass
- [ ] 4.10 Add prompts tests to CI pipeline

## 5. Update Documentation

- [ ] 5.1 Update `AGENTS.md` with prompts documentation
- [ ] 5.2 Add prompt meta tools to `docs/meta-tools.md`
- [ ] 5.3 Document prompt namespacing convention
- [ ] 5.4 Add prompt examples to `README.md`
- [ ] 5.5 Document notification propagation for prompts
- [ ] 5.6 Add prompts section to API documentation

## 6. Performance and Edge Cases

- [ ] 6.1 Test with servers that have no prompts
- [ ] 6.2 Test with servers that have many prompts (50+)
- [ ] 6.3 Test prompt argument validation
- [ ] 6.4 Test multi-modal prompt content (text, image, audio, resource)
- [ ] 6.5 Test concurrent prompt requests
- [ ] 6.6 Test prompt cache invalidation
- [ ] 6.7 Test error handling for missing prompts
- [ ] 6.8 Test error handling for backend prompt errors

## 7. Integration with Existing Systems

- [ ] 7.1 Verify prompts work with health meta tool
- [ ] 7.2 Verify prompts appear in catalog_list
- [ ] 7.3 Verify prompts work with server reconnection
- [ ] 7.4 Verify prompts work with config hot reload
- [ ] 7.5 Verify prompts work with logging system
- [ ] 7.6 Verify prompts work with error handling

## 8. Final Validation

- [ ] 8.1 Run full test suite
- [ ] 8.2 Run linting and formatting
- [ ] 8.3 Test end-to-end with multiple backend servers
- [ ] 8.4 Verify TUI prompts panel works correctly
- [ ] 8.5 Verify meta tools work correctly
- [ ] 8.6 Document any issues found
- [ ] 8.7 Archive change with `openspec-archive-change`
