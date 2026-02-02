## 1. Set Up TUI Infrastructure

- [ ] 1.1 Create `src/tui/types.ts` with TypeScript interfaces for panels, items, state
- [ ] 1.2 Create `src/tui/utils/formatters.ts` for data formatting (sizes, timestamps)
- [ ] 1.3 Create `src/tui/utils/keybindings.ts` for keybinding definitions and helpers
- [ ] 1.4 Create `src/tui/utils/navigation.ts` for focus management utilities
- [ ] 1.5 Create `src/tui/utils/constants.ts` for colors, dimensions, style constants
- [ ] 1.6 Create `src/tui/hooks/useRegistry.ts` for tool/prompt/resource state from registry
- [ ] 1.7 Create `src/tui/hooks/useServers.ts` for server connection status
- [ ] 1.8 Create `src/tui/hooks/useLogs.ts` for activity log stream
- [ ] 1.9 Create `src/tui/hooks/useHealth.ts` for gateway/server health metrics
- [ ] 1.10 Create `src/tui/hooks/useSearch.ts` for search/filter state management
- [ ] 1.11 Create `src/tui/hooks/useFocus.ts` for focus management across panes
- [ ] 1.12 Create `src/tui/hooks/useKeybindings.ts` for keyboard handler registration
- [ ] 1.13 Create `src/tui/hooks/index.ts` exports for all hooks

## 2. Extract and Refactor Existing Components

- [ ] 2.1 Extract `Header` component to `src/tui/components/Header.tsx`
- [ ] 2.2 Extract `Footer` component to `src/tui/components/Footer.tsx`
- [ ] 2.3 Extract `ServersPane` to `src/tui/components/panels/ServersPanel.tsx`
- [ ] 2.4 Extract `LogsPane` to `src/tui/components/panels/LogsPanel.tsx`
- [ ] 2.5 Update `src/tui/App.tsx` to import extracted components
- [ ] 2.6 Remove mock data from extracted components
- [ ] 2.7 Connect extracted components to real hooks

## 3. Implement Layout Components

- [ ] 3.1 Create `src/tui/components/Layout.tsx` main layout wrapper
- [ ] 3.2 Create `src/tui/components/Sidebar.tsx` with navigation tabs
- [ ] 3.3 Implement sidebar tab rendering with icons
- [ ] 3.4 Implement sidebar keyboard navigation (arrows, Enter)
- [ ] 3.5 Create `src/tui/components/SearchBar.tsx` search input component
- [ ] 3.6 Implement search bar activation and input handling
- [ ] 3.7 Create `src/tui/components/FocusManager.tsx` for focus cycling
- [ ] 3.8 Implement Tab/Shift+Tab focus cycle logic

## 4. Implement Reusable UI Components

- [ ] 4.1 Create `src/tui/components/List.tsx` reusable list component
- [ ] 4.2 Add keyboard navigation (j/k, arrows, g/G) to List
- [ ] 4.3 Add selection highlighting to List
- [ ] 4.4 Add empty state handling to List
- [ ] 4.5 Create `src/tui/components/Detail.tsx` inspector panel component
- [ ] 4.6 Add JSON syntax highlighting to Detail panel
- [ ] 4.7 Create `src/tui/components/StatusCell.tsx` status indicator component
- [ ] 4.8 Create `src/tui/components/Tag.tsx` for server/source tags
- [ ] 4.9 Create `src/tui/components/Modal.tsx` for invoke/read modals
- [ ] 4.10 Create `src/tui/components/Loading.tsx` loading spinner component

## 5. Implement Dashboard Panel

- [ ] 5.1 Create `src/tui/components/panels/Dashboard.tsx`
- [ ] 5.2 Display server count summary (total, online, offline)
- [ ] 5.3 Display tool/prompt/resource count totals
- [ ] 5.4 Display gateway uptime
- [ ] 5.5 Display memory usage estimate
- [ ] 5.6 Display top 5 servers by tool count
- [ ] 5.7 Display status distribution chart
- [ ] 5.8 Display recent activity summary

## 6. Implement Servers Panel

- [ ] 6.1 Create `src/tui/components/panels/ServersPanel.tsx`
- [ ] 6.2 Display server list with name, transport, tools, status
- [ ] 6.3 Add server status indicators (green/red/yellow)
- [ ] 6.4 Implement server selection
- [ ] 6.5 Implement `e` keybinding for enable/disable toggle
- [ ] 6.6 Implement Enter key for server detail view
- [ ] 6.7 Connect to `useServers` hook for real data
- [ ] 6.8 Handle real-time status updates

## 7. Implement Tools Panel

- [ ] 7.1 Create `src/tui/components/panels/ToolsPanel.tsx`
- [ ] 7.2 Display tool list with namespaced names
- [ ] 7.3 Display tool compact cards (name, serverId, description)
- [ ] 7.4 Add server filter dropdown
- [ ] 7.5 Implement `/` keybinding for search
- [ ] 7.6 Connect to `useRegistry` hook for real tool data
- [ ] 7.7 Implement tool selection
- [ ] 7.8 Implement Enter key for tool detail view (schema display)
- [ ] 7.9 Implement `i` keybinding for invoke modal
- [ ] 7.10 Create invoke modal with JSON argument input
- [ ] 7.11 Handle tool invocation and display results

## 8. Implement Prompts Panel

- [ ] 8.1 Create `src/tui/components/panels/PromptsPanel.tsx`
- [ ] 8.2 Display prompt list with namespaced names
- [ ] 8.3 Display prompt compact cards (name, serverId, args, description)
- [ ] 8.4 Add server filter dropdown
- [ ] 8.5 Implement `/` keybinding for search
- [ ] 8.6 Connect to `useRegistry` hook for real prompt data
- [ ] 8.7 Implement prompt selection
- [ ] 8.8 Implement Enter key for prompt detail view
- [ ] 8.9 Implement `i` keybinding for invoke modal
- [ ] 8.10 Create invoke modal with argument inputs
- [ ] 8.11 Handle prompt invocation and display messages

## 9. Implement Resources Panel

- [ ] 9.1 Create `src/tui/components/panels/ResourcesPanel.tsx`
- [ ] 9.2 Display resource list with namespaced URIs
- [ ] 9.3 Display resource compact cards (URI, name, MIME type, size)
- [ ] 9.4 Add server filter dropdown
- [ ] 9.5 Add MIME type filter
- [ ] 9.6 Implement `/` keybinding for search
- [ ] 9.7 Connect to `useRegistry` hook for real resource data
- [ ] 9.8 Implement resource selection
- [ ] 9.9 Implement Enter key for resource detail view
- [ ] 9.10 Implement `i` keybinding for read modal
- [ ] 9.11 Handle resource read and display content
- [ ] 9.12 Display resource templates section

## 10. Implement Help System

- [ ] 10.1 Create `src/tui/components/HelpModal.tsx`
- [ ] 10.2 Display global keybindings
- [ ] 10.3 Display panel-specific keybindings
- [ ] 10.4 Display status indicators legend
- [ ] 10.5 Implement `?` keybinding to toggle help
- [ ] 10.6 Implement Escape to close help
- [ ] 10.7 Make help context-aware (highlight current panel shortcuts)

## 11. Implement Logs Panel

- [ ] 11.1 Create `src/tui/components/panels/LogsPanel.tsx`
- [ ] 11.2 Display activity log with timestamps
- [ ] 11.3 Connect to `useLogs` hook for real log stream
- [ ] 11.4 Auto-scroll to show newest entries
- [ ] 11.5 Add log filtering
- [ ] 11.6 Color-code log entries (info, success, error)
- [ ] 11.7 Display log source (server name, tool name)

## 12. Implement Footer with Keybindings

- [ ] 12.1 Update `Footer` component with context-aware keybindings
- [ ] 12.2 Group keybindings by category (Navigation, Actions, System)
- [ ] 12.3 Dim unavailable actions
- [ ] 12.4 Update keybindings based on active panel
- [ ] 12.5 Update keybindings based on selection state

## 13. Implement Compact Mode

- [ ] 13.1 Create compact mode state in App
- [ ] 13.2 Implement `c` keybinding to toggle compact mode
- [ ] 13.3 Hide sidebar in compact mode
- [ ] 13.4 Hide detail panel in compact mode
- [ ] 13.5 Expand list to fill space in compact mode
- [ ] 13.6 Keep footer visible in compact mode

## 14. Implement Refresh Functionality

- [ ] 14.1 Implement `r` keybinding for manual refresh
- [ ] 14.2 Add loading indicator during refresh
- [ ] 14.3 Connect refresh to all hooks (registry, servers, logs)
- [ ] 14.4 Auto-refresh on server add/remove
- [ ] 14.5 Handle auto-refresh on registry changes

## 15. Implement Visual Styling

- [ ] 15.1 Apply cyber-industrial color scheme (#0A0A0A background, #ADFF2F accent)
- [ ] 15.2 Style focus indicators (double-line for focused, single for unfocused)
- [ ] 15.3 Style status indicators (green/red/yellow circles)
- [ ] 15.4 Apply zebra striping to list items
- [ ] 15.5 Style borders with appropriate Unicode characters
- [ ] 15.6 Apply typography (headers vs body text)

## 16. Update CLI Integration

- [ ] 16.1 Update `src/cli/index.ts` TUI launch logic
- [ ] 16.2 Import and render App component
- [ ] 16.3 Handle graceful exit
- [ ] 16.4 Connect CLI args to TUI options

## 17. Add TUI Unit Tests

- [ ] 17.1 Create `tests/unit/tui/utils/formatters.test.ts`
- [ ] 17.2 Create `tests/unit/tui/utils/keybindings.test.ts`
- [ ] 17.3 Create `tests/unit/tui/hooks/useSearch.test.ts`
- [ ] 17.4 Create `tests/unit/tui/hooks/useFocus.test.ts`
- [ ] 17.5 Create `tests/unit/tui/components/List.test.tsx`
- [ ] 17.6 Create `tests/unit/tui/components/StatusCell.test.tsx`
- [ ] 17.7 Create `tests/unit/tui/components/SearchBar.test.tsx`

## 18. Add TUI Integration Tests

- [ ] 18.1 Create `tests/integration/tui/keyboard.test.ts` - Test keyboard navigation
- [ ] 18.2 Create `tests/integration/tui/panels.test.ts` - Test panel switching
- [ ] 18.3 Create `tests/integration/tui/search.test.ts` - Test search filtering
- [ ] 18.4 Create `tests/integration/tui/help.test.ts` - Test help modal
- [ ] 18.5 Create `tests/integration/tui/compact.test.ts` - Test compact mode

## 19. Update Documentation

- [ ] 19.1 Update `README.md` with TUI section including:
  - How to launch TUI (`goblin --tui`)
  - Panel overview (Dashboard, Servers, Tools, Prompts, Resources)
  - Navigation keybindings (with table)
  - Quick actions (invoke, enable/disable, read)
  - Search functionality
  - Help system
  - Compact mode
- [ ] 19.2 Create `docs/tui-keybindings.md` with complete keybinding reference
- [ ] 19.3 Create `docs/tui-user-guide.md` with detailed TUI user guide
- [ ] 19.4 Update `AGENTS.md` with TUI development guidelines
- [ ] 19.5 Add TUI screenshots to documentation

## 20. Final Validation

- [ ] 20.1 Run full test suite
- [ ] 20.2 Run linting and formatting
- [ ] 20.3 Test TUI with real registry data
- [ ] 20.4 Test TUI with multiple connected servers
- [ ] 20.5 Test keyboard navigation flow
- [ ] 20.6 Test search and filter functionality
- [ ] 20.7 Test help system and keybindings
- [ ] 20.8 Test compact mode toggle
- [ ] 20.9 Test refresh functionality
- [ ] 20.10 Document any issues found
- [ ] 20.11 Archive change with `openspec-archive-change`
