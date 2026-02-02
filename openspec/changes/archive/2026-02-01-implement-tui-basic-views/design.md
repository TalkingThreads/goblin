## Context

The Goblin TUI currently exists as a basic scaffold in `src/tui/App.tsx` with mock data. It contains:
- Header with version/status
- ServersPane (simple table with mock server data)
- LogsPane (simulated scrolling with setInterval)
- Footer with key hints

**Current Limitations:**
- All components in single file (no modularity)
- Mock data instead of real gateway state
- No integration with registry, connection manager, or health systems
- No Tools/Prompts/Resources panels
- Basic navigation (q to quit, r to reload)
- No search, filtering, or detail views
- No keyboard navigation beyond basic input

**Stakeholders:**
- Developers using Goblin locally for agent workflows
- Operators managing MCP servers in dev/test environments
- Researchers experimenting with tools and prompts

**Constraints:**
- Must use Ink (React-based TUI framework)
- Must work without mouse (keyboard-driven)
- Must be performant with many tools/servers
- Must integrate with existing gateway systems (registry, connection manager, logs)

## Goals / Non-Goals

**Goals:**
- Replace single-file scaffold with modular component architecture
- Connect TUI to real gateway state (registry, connection manager, logs)
- Implement keyboard-driven navigation (tabs, arrows, shortcuts)
- Add panels for Tools, Prompts, Resources (beyond current Servers/Logs)
- Implement search/filter across all lists
- Add detail inspector panel for selected items
- Add help overlay with complete keybinding reference
- Follow cyber-industrial UX design (sidebar, split-pane, acid green accents)

**Non-Goals:**
- No mouse support (keyboard-only workflow)
- No complex visualizations (defer to web UI)
- No configuration editing in TUI (use config file/CLI)
- No user authentication in TUI (gateway-level concern)
- No role-based access control in TUI (gateway-level concern)

## Decisions

### Decision 1: Component Architecture

**Choice:** Modular component structure with hooks for state

**Rationale:**
- Current App.tsx is 150+ lines with all components inline
- Separation enables testing, reuse, and maintainability
- Hooks pattern works well with Ink/React

**Implementation:**
```
src/tui/
├── index.tsx           # Entry point (render App)
├── App.tsx             # Main layout (sidebar + content area)
├── types.ts            # TypeScript interfaces
├── hooks/
│   ├── useRegistry.ts  # Tool/Prompt/Resource registry state
│   ├── useServers.ts   # Server connection status
│   ├── useLogs.ts      # Activity log stream
│   ├── useHealth.ts    # Gateway/server health
│   └── useSearch.ts    # Search/filter state
├── components/
│   ├── Layout.tsx      # Main layout wrapper
│   ├── Sidebar.tsx     # Navigation tabs
│   ├── Header.tsx      # Dashboard header with metrics
│   ├── panels/
│   │   ├── Dashboard.tsx
│   │   ├── ServersPanel.tsx
│   │   ├── ToolsPanel.tsx
│   │   ├── PromptsPanel.tsx
│   │   ├── ResourcesPanel.tsx
│   │   └── LogsPanel.tsx
│   ├── List.tsx        # Reusable list component
│   ├── Detail.tsx      # Inspector panel
│   ├── SearchBar.tsx   # Search input
│   ├── HelpModal.tsx   # Help overlay
│   └── StatusCell.tsx  # Status indicator
└── utils/
    ├── formatters.ts   # Data formatting helpers
    ├── keybindings.ts  # Keybinding definitions
    └── navigation.ts   # Focus management
```

### Decision 2: Navigation System

**Choice:** Tab-based sidebar with focus management

**Rationale:**
- Sidebar provides persistent navigation context
- Tab/Shift+Tab for pane cycling matches common TUI conventions
- j/k or arrows for list navigation matches Vim conventions
- Single-character shortcuts (D, S, T, P, R) for speed

**Keybindings:**
| Key | Action |
|-----|--------|
| Tab | Cycle focus: Sidebar → List → Detail → Sidebar |
| Shift+Tab | Reverse focus cycle |
| j / ↓ | Move selection down |
| k / ↑ | Move selection up |
| / | Focus search bar |
| Enter | Select / Expand detail |
| Esc | Clear search / Close detail / Back |
| D | Go to Dashboard |
| S | Go to Servers |
| T | Go to Tools |
| P | Go to Prompts |
| R | Go to Resources |
| i | Invoke (Tool/Prompt) |
| e | Enable/Disable (Server) |
| r | Refresh / Reload |
| c | Toggle compact mode |
| ? | Toggle help |
| q | Quit |

### Decision 3: Layout Structure

**Choice:** Three-column layout with sidebar, content, and detail inspector

**Rationale:**
- Consistent with designer recommendations
- Split-pane allows list + detail without navigation
- Sidebar fixed, content grows, detail collapsible
- Compact mode hides sidebar/detail for dense data

**Implementation:**
```tsx
<Box flexDirection="column">
  <Header />
  <Box flexGrow={1}>
    <Sidebar width={20} />      {/* Navigation tabs */}
    <Box flexGrow={1}>
      <SearchBar />
      <List />                    {/* Filtered list */}
    </Box>
    <Detail width={30} />        {/* Inspector panel */}
  </Box>
  <Footer />                      {/* Logs + keybindings */}
</Box>
```

### Decision 4: State Management

**Choice:** React hooks with gateway service integration

**Rationale:**
- Ink/React ecosystem uses hooks pattern
- Avoid external state management (Redux/MobX) for simplicity
- Services are singletons; hooks provide clean access

**Hook Responsibilities:**
- `useRegistry`: Returns tools[], prompts[], resources[] from registry
- `useServers`: Returns server[] with connection status
- `useLogs`: Returns log[] stream with subscribe
- `useHealth`: Returns gatewayHealth, serverHealth[]
- `useSearch`: Manages filter state, search query

### Decision 5: List Component

**Choice:** Reusable List component with filtering

**Rationale:**
- Tools, Prompts, Resources need similar list UI
- Consistent keyboard navigation across panels
- Search/filter logic centralized

**Interface:**
```typescript
interface ListProps<T> {
  items: T[];
  renderItem: (item: T, selected: boolean) => ReactNode;
  onSelect: (item: T) => void;
  onAction?: (item: T, action: string) => void;
  searchFields: (keyof T)[];
  emptyMessage: string;
  columns?: Column<T>[];
}
```

### Decision 6: Panel Structure

**Choice:** Panel components with consistent interface

**Rationale:**
- Each capability needs dedicated panel
- Consistent interface enables generic List component usage
- Panels can have panel-specific actions

**Panel Interface:**
```typescript
interface PanelProps {
  onSelect: (item: PanelItem) => void;
  onAction: (item: PanelItem, action: string) => void;
  filter: string;
  onFilterChange: (filter: string) => void;
}
```

### Decision 7: Help System

**Choice:** Modal overlay triggered by `?` key

**Rationale:**
- Contextual help is essential for keyboard-driven UI
- Modal doesn't navigate away from current view
- Can show panel-specific shortcuts

**Content:**
- Global keybindings (navigation, help, quit)
- Panel-specific shortcuts
- Current selection details
- Status indicators legend

### Decision 8: Visual Styling

**Choice:** Cyber-industrial aesthetic (dark background, acid green accents)

**Rationale:**
- Matches Goblin branding (from GOBLIN.md)
- High contrast for readability in terminals
- Status indicators use color + icon

**Style Guide:**
- Background: `#0A0A0A` (Obsidian)
- Primary: `#ADFF2F` (Acid Green) for active elements
- Success: Green for online/active
- Error: Red for offline/error
- Warning: Yellow for warning states
- Info: Cyan for neutral info
- Borders: Single/double line per focus state

## Risks / Trade-offs

### [Risk] Terminal Compatibility
**→ Mitigation:** Test on common terminals (iTerm2, Windows Terminal, tmux, screen). Avoid advanced Unicode features that may not render consistently. Provide fallback styles.

### [Risk] Performance with Large Lists
**→ Mitigation:** Implement virtual scrolling for lists >100 items. Debounce search input. Use React.memo for list items.

### [Risk] Focus Management Complexity
**→ Mitigation:** Centralize focus state in single hook. Use data attributes to track focus. Test all navigation paths.

### [Risk] State Synchronization Lag
**→ Mitigation:** Use optimistic updates for actions. Show loading states. Debounce registry updates.

### [Risk] Testing Difficulty
**→ Mitigation:** Write unit tests for hooks and formatters. Use ink-testing library for component tests. Test keybinding handlers in isolation.

## Migration Plan

1. **Phase 1: Infrastructure**
   - Create `src/tui/types.ts`, `hooks/`, `components/`, `utils/`
   - Extract Header, Footer, ServersPane, LogsPane to separate files
   - Add hooks for registry, servers, logs, health

2. **Phase 2: Navigation**
   - Implement Sidebar component
   - Add focus management hook
   - Implement tab switching logic
   - Add keyboard handlers

3. **Phase 3: Panels**
   - Implement Dashboard panel
   - Implement ToolsPanel with search and detail
   - Implement PromptsPanel (matching ToolsPanel pattern)
   - Implement ResourcesPanel (matching ToolsPanel pattern)

4. **Phase 4: Polish**
   - Add HelpModal
   - Add detail inspector
   - Add quick actions (invoke, enable/disable)
   - Add visual polish (colors, borders, animations)

5. **Phase 5: Integration**
   - Connect hooks to real gateway services
   - Remove mock data
   - Test end-to-end flow

## Open Questions

1. **Should compact mode hide the sidebar entirely or just collapse it?**
2. **Should detail panel show JSON schema or human-readable format?**
3. **Should logs panel be a tab or always-visible footer?**
4. **Should TUI support mouse clicks for accessibility?**
5. **Should search support fuzzy matching or only exact?**
