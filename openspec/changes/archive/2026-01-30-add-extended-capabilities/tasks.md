## 1. Registry Updates
- [ ] 1.1 Update `src/gateway/types.ts`: Add `PromptEntry` and `ResourceEntry` types.
- [ ] 1.2 Update `src/gateway/registry.ts`: Add storage for prompts and resources.
- [ ] 1.3 Update `Registry.syncServer`: Fetch prompts and resources from backend and store them.
- [ ] 1.4 Update `Registry` to handle `notifications/prompts/list_changed` and `notifications/resources/list_changed`.
- [ ] 1.5 Implement `listPrompts`, `getPrompt`, `listResources`, `listResourceTemplates`, `getResource` methods.

## 2. Gateway Server Updates
- [ ] 2.1 Update `src/gateway/server.ts`: Add `prompts` and `resources` to capabilities.
- [ ] 2.2 Register handlers:
    - `ListPromptsRequestSchema`
    - `GetPromptRequestSchema`
    - `ListResourcesRequestSchema`
    - `ListResourceTemplatesRequestSchema`
    - `ReadResourceRequestSchema`
- [ ] 2.3 Implement notification broadcasting for prompts/resources changes.

## 3. Router Updates?
- [ ] 3.1 Verify if `Router` needs changes. Currently Router is for Tools. Resource reading might need routing logic too.
- [ ] 3.2 Decision: Implement resource reading logic directly in `GatewayServer` (using Registry to find backend) or extend `Router`.
- [ ] 3.3 Task: Implement `Router.routeResource(uri)`? Or just handle in Server. Let's handle in Server + Registry lookup for now as URI routing is different from Name routing.

## 4. Testing
- [ ] 4.1 Add unit tests for Prompt aggregation.
- [ ] 4.2 Add unit tests for Resource aggregation.
- [ ] 4.3 Add unit tests for Request forwarding.
