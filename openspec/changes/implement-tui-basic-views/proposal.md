## Why

The Goblin TUI currently exists as a basic scaffold with mock data in `src/tui/App.tsx`. It shows servers and logs, but lacks integration with actual gateway state, panels for Tools/Prompts/Resources, search functionality, and keyboard-driven navigation. Without a functional TUI, users cannot visually manage servers, discover tools, or monitor gateway activity—critical for developer experience and operational visibility.

## What Changes

### New Capabilities
- **Complete TUI Panel System**: Replace single-file scaffold with modular panels (Servers, Tools, Prompts, Resources, Logs)
- **Real State Integration**: Connect TUI to gateway registry, connection manager, and observability systems
- **Keyboard Navigation**: Tab-based navigation, arrow keys, search (`/`), quick actions
- **Tabbed Interface**: Dashboard overview, Servers list, Tools panel, Prompts panel, Resources panel
- **Split-Pane Layout**: List view with detail inspector panel
- **Search & Filter**: Instant filtering across tools, prompts, resources
- **Quick Actions**: Enable/disable servers, invoke tools, read resources
- **Help System**: Contextual help overlay with keybindings

### Implementation Changes
- **Refactor App.tsx**: Extract components to `src/tui/components/`
- **Add State Management**: Hooks for registry, connection manager, logs
- **Add Panel Components**: ToolsPanel, PromptsPanel, ResourcesPanel, Dashboard
- **Add Navigation**: Tab system, focus management, keyboard handlers
- **Add Search**: Filterable lists with instant search
- **Add Detail Views**: Inspector panel showing schema/metadata
- **Add Help Modal**: Global help overlay with keybindings
- **Update CLI**: Proper TUI launch integration

### Breaking Changes
- **None**: TUI is currently non-functional; changes are additive

## Capabilities

### New Capabilities
- `tui-dashboard`: Main dashboard with gateway overview (servers, tools, health, metrics summary)
- `tui-servers-panel`: Server list with status, transport, tool count, enable/disable actions
- `tui-tools-panel`: Tool list with search, compact cards, detail view, invoke action
- `tui-prompts-panel`: Prompt list with search, detail view, invoke action
- `tui-resources-panel`: Resource list with search, detail view, read action
- `tui-navigation`: Tab-based keyboard navigation (Tab/Arrows/jk, Enter, Esc, /)
- `tui-search`: Instant search/filter across all panels
- `tui-help`: Contextual help overlay with complete keybinding reference
- `tui-logs-panel`: Real-time activity log with filtering

### Modified Capabilities
- **None**: No existing spec-level requirements being changed

## Impact

### Affected Code
- `src/tui/App.tsx`: Refactor into modular components
- `src/tui/components/`: New panel components (Dashboard, Servers, Tools, Prompts, Resources, Logs, Help)
- `src/tui/hooks/`: New hooks (useRegistry, useConnectionManager, useLogs, useSearch)
- `src/tui/types.ts`: Panel types, state interfaces, component props
- `src/tui/utils.ts`: Formatters, search logic, navigation helpers
- `src/cli/index.ts`: Update TUI launch integration

### MCP Capabilities Exposed via TUI
- Server management (list, enable/disable)
- Tool discovery (catalog_list, catalog_search, describe_tool)
- Prompt discovery (catalog_prompts, describe_prompt)
- Resource discovery (catalog_resources, describe_resource)
- Health monitoring (health meta tool)

### User Impact
- Visual server management with status indicators
- Searchable tool/prompt/resource discovery
- Keyboard-driven workflow (no mouse required)
- Real-time activity monitoring
- Quick actions (enable/disable, invoke, read)

### UX Design
- **Layout**: Persistent sidebar navigation, dynamic multi-pane content area, split list/detail view
- **Keybindings**: Tab/Shift+Tab (nav), j/k or arrows (list), / (search), Enter (select), Esc (back), i (invoke), e (enable), r (refresh), ? (help), q (quit)
- **Visual Style**: Cyber-industrial aesthetic (acid green accents, dark background), high-contrast status indicators
- **Navigation Flow**: Sidebar tabs → Filtered list → Detail inspector → Quick action modal

### Dependencies
- `ink`: React-based TUI framework (already in dependencies)
- Registry service for tool/prompt/resource data
- Connection manager for server status
- Logging system for activity feed
- Health endpoint for metrics
