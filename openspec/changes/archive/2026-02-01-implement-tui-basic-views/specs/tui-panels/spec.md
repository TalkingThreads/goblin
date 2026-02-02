## ADDED Requirements

### Requirement: TUI Entry Point
The TUI SHALL render the main App component using Ink's render function when launched with `--tui` flag.

#### Scenario: Launch TUI from CLI
- **WHEN** user runs `goblin --tui`
- **THEN** Ink renders the App component to stdout
- **AND** TUI displays header, sidebar, content area, and footer

#### Scenario: Launch TUI from main
- **WHEN** user runs `goblin` in interactive mode
- **AND** TUI is the default interface
- **THEN** TUI displays with full functionality

### Requirement: Main Layout Structure
The TUI SHALL display a consistent layout with header, sidebar, content area, and footer.

#### Scenario: Display default layout
- **WHEN** TUI renders
- **THEN** Header appears at top with version and status
- **AND** Sidebar appears on left (20% width)
- **AND** Content area appears in center (flex grow)
- **AND** Footer appears at bottom with keybindings

#### Scenario: Layout responds to terminal size
- **WHEN** terminal window is resized
- **THEN** TUI components reflow to fit new dimensions
- **AND** minimum dimensions are enforced (80x24)

### Requirement: Dashboard Panel
The Dashboard panel SHALL display gateway overview with server counts, tool counts, and health metrics.

#### Scenario: Display dashboard overview
- **WHEN** user navigates to Dashboard panel
- **THEN** displays total server count (online/offline)
- **AND** displays total tool count across all servers
- **AND** displays total prompt count
- **AND** displays total resource count
- **AND** displays gateway uptime
- **AND** displays memory usage estimate

#### Scenario: Dashboard shows server summary
- **WHEN** Dashboard is active
- **THEN** lists top 5 servers by tool count
- **AND** shows status distribution (online/offline/error)
- **AND** shows recent activity summary

### Requirement: Servers Panel
The Servers panel SHALL display connected MCP servers with status, transport, tool count, and enable/disable actions.

#### Scenario: Display server list
- **WHEN** user navigates to Servers panel
- **THEN** displays list of all configured servers
- **AND** each row shows: name, transport type, tool count, status icon
- **AND** servers are sorted alphabetically by name
- **AND** online servers show green indicator
- **AND** offline servers show red indicator

#### Scenario: Server status indicators
- **WHEN** server connection state changes
- **THEN** status indicator updates within 1 second
- **AND** color reflects current state (green=online, red=offline, yellow=connecting)

#### Scenario: Enable server via keybinding
- **WHEN** server is selected AND user presses `e`
- **THEN** server enabled state toggles
- **AND** change is reflected in server list immediately
- **AND** server reconnects if enabling

#### Scenario: Disable server via keybinding
- **WHEN** server is selected AND user presses `e` while enabled
- **THEN** server becomes disabled
- **AND** status changes to offline
- **AND** server stops receiving requests

#### Scenario: Server detail view
- **WHEN** user selects server AND presses Enter
- **THEN** detail panel shows server configuration
- **AND** displays transport type and endpoint
- **AND** displays enabled/disabled status
- **AND** displays list of available tools

### Requirement: Tools Panel
The Tools panel SHALL display aggregated tools from all servers with search, compact cards, and invoke actions.

#### Scenario: Display tool list
- **WHEN** user navigates to Tools panel
- **THEN** displays all tools from all connected servers
- **AND** each tool shows: name (namespaced), server source, description summary
- **AND** tools are grouped by server or flat sorted by name
- **AND** selection highlights the tool

#### Scenario: Tool compact card
- **WHEN** tool is displayed in list
- **THEN** card shows: name, serverId, brief description (truncated to 50 chars)
- **AND** name is namespaced (serverId_toolName format)
- **AND** serverId is displayed as tag

#### Scenario: Search tools
- **WHEN** user presses `/` in Tools panel
- **THEN** search bar becomes active
- **AND** typing filters tool list by name or description
- **AND** results update in real-time
- **AND** pressing Esc clears search

#### Scenario: Invoke tool via keybinding
- **WHEN** tool is selected AND user presses `i`
- **THEN** invoke modal appears
- **AND** user can input arguments in JSON format
- **AND** pressing Enter submits invocation
- **AND** result is displayed in modal or log panel

#### Scenario: Tool detail view
- **WHEN** tool is selected AND user presses Enter
- **THEN** detail panel shows full tool description
- **AND** displays input schema
- **AND** displays output schema
- **AND** displays server source

### Requirement: Prompts Panel
The Prompts panel SHALL display aggregated prompts from all servers with search and invoke actions.

#### Scenario: Display prompt list
- **WHEN** user navigates to Prompts panel
- **THEN** displays all prompts from all connected servers
- **AND** each prompt shows: name (namespaced), description summary, argument count
- **AND** prompts are sorted alphabetically

#### Scenario: Prompt compact card
- **WHEN** prompt is displayed in list
- **THEN** card shows: name, serverId, argument names, description
- **AND** name is namespaced (serverId_promptName format)
- **AND** required arguments are marked with asterisk

#### Scenario: Search prompts
- **WHEN** user presses `/` in Prompts panel
- **THEN** search bar becomes active
- **AND** typing filters prompt list by name or description
- **AND** results update in real-time

#### Scenario: Invoke prompt via keybinding
- **WHEN** prompt is selected AND user presses `i`
- **THEN** invoke modal appears
- **AND** user can input arguments for prompt variables
- **AND** pressing Enter submits invocation
- **AND** generated messages are displayed

#### Scenario: Prompt detail view
- **WHEN** prompt is selected AND user presses Enter
- **THEN** detail panel shows full prompt description
- **AND** displays all arguments with descriptions
- **AND** displays message template

### Requirement: Resources Panel
The Resources panel SHALL display aggregated resources from all servers with search and read actions.

#### Scenario: Display resource list
- **WHEN** user navigates to Resources panel
- **THEN** displays all resources from all connected servers
- **AND** each resource shows: URI (namespaced), name, MIME type, size
- **AND** resources are sorted alphabetically by URI

#### Scenario: Resource compact card
- **WHEN** resource is displayed in list
- **THEN** card shows: URI (truncated), name, MIME type, size
- **AND** URI is namespaced (serverId_uri format)
- **AND** size is formatted (bytes, KB, MB)

#### Scenario: Search resources
- **WHEN** user presses `/` in Resources panel
- **THEN** search bar becomes active
- **AND** typing filters resource list by URI or name
- **AND** results update in real-time

#### Scenario: Read resource via keybinding
- **WHEN** resource is selected AND user presses `i`
- **THEN** resource content is fetched
- **AND** content is displayed in modal or new panel
- **AND** text resources show content directly
- **AND** blob resources show metadata and download option

#### Scenario: Resource detail view
- **WHEN** resource is selected AND user presses Enter
- **THEN** detail panel shows full resource metadata
- **AND** displays URI, name, description, MIME type, size
- **AND** displays resource template info if applicable

### Requirement: Navigation System
The TUI SHALL provide keyboard-driven navigation between panels and within lists.

#### Scenario: Navigate between panels via sidebar
- **WHEN** sidebar has focus
- **AND** user presses arrow keys or j/k
- **THEN** selection moves between sidebar items
- **AND** pressing Enter or Space activates selected panel

#### Scenario: Cycle focus between panes
- **WHEN** user presses Tab
- **THEN** focus cycles: Sidebar → List → Detail → Sidebar
- **AND** focused pane has highlight border
- **AND** unfocused panes have dim border

#### Scenario: Navigate list with keyboard
- **WHEN** list has focus
- **AND** user presses j or down arrow
- **THEN** selection moves down one item
- **AND** pressing k or up arrow moves selection up
- **AND** pressing g/G jumps to top/bottom

#### Scenario: Quick panel navigation
- **WHEN** user presses D
- **THEN** Dashboard panel becomes active
- **AND** when user presses S
- **THEN** Servers panel becomes active
- **AND** when user presses T
- **THEN** Tools panel becomes active
- **AND** when user presses P
- **THEN** Prompts panel becomes active
- **AND** when user presses R
- **THEN** Resources panel becomes active

#### Scenario: Return to previous view
- **WHEN** user presses Esc
- **AND** detail panel is open
- **THEN** detail panel closes
- **AND** focus returns to list
- **AND** when search is active
- **THEN** search clears and focus returns to list

### Requirement: Search Functionality
The TUI SHALL provide instant search and filter across all list panels.

#### Scenario: Activate search
- **WHEN** user presses `/` in any panel with list
- **THEN** search input becomes active
- **AND** cursor appears in search field
- **AND** placeholder shows search hint

#### Scenario: Search filters list
- **WHEN** user types in search field
- **THEN** list filters to matching items
- **AND** matching is case-insensitive
- **AND** search matches item name and description
- **AND** list updates in real-time

#### Scenario: Clear search
- **WHEN** user presses Backspace with empty query
- **OR** user presses Escape
- **THEN** search field clears
- **AND** full list is restored

#### Scenario: Search with no results
- **WHEN** search returns no matches
- **THEN** empty state is displayed
- **AND** message says "No results found"
- **AND** hint to clear search is shown

### Requirement: Help System
The TUI SHALL display a help overlay with complete keybinding reference.

#### Scenario: Display help overlay
- **WHEN** user presses `?`
- **THEN** help modal appears
- **AND** modal covers entire TUI
- **AND** displays all global keybindings
- **AND** displays panel-specific keybindings
- **AND** displays status indicators legend

#### Scenario: Close help overlay
- **WHEN** help modal is open
- **AND** user presses Escape or `?`
- **THEN** help modal closes
- **AND** previous focus is restored

#### Scenario: Help shows context
- **WHEN** help is opened
- **AND** Dashboard panel is active
- **THEN** help highlights Dashboard-specific shortcuts
- **AND** when Tools panel is active
- **THEN** help highlights Tools-specific shortcuts

### Requirement: Logs Panel
The Logs panel SHALL display real-time activity log with timestamps and filtering.

#### Scenario: Display activity log
- **WHEN** Logs panel is active
- **OR** Footer is visible
- **THEN** recent activity is displayed
- **AND** each line shows: timestamp, source, message
- **AND** logs scroll with newest at bottom

#### Scenario: Real-time log updates
- **WHEN** new log entry is generated
- **THEN** logs panel updates within 1 second
- **AND** auto-scrolls to show new entry
- **AND** visual indicator shows new entries

#### Scenario: Log entries
- **WHEN** server connects
- **THEN** log entry: "[timestamp] Connected to serverName via transport"
- **AND** when tool is invoked
- **THEN** log entry: "[timestamp] Invoked toolName from serverName"
- **AND** when error occurs
- **THEN** log entry: "[timestamp] Error: errorMessage"

#### Scenario: Log filtering
- **WHEN** user types in log filter
- **THEN** only matching log entries are shown
- **AND** filtering is case-insensitive
- **AND** filter matches timestamp, source, or message

### Requirement: Footer with Keybindings
The TUI SHALL display a footer with context-aware keybinding hints.

#### Scenario: Display keybinding hints
- **WHEN** TUI renders
- **THEN** footer shows relevant keybindings for current panel
- **AND** hints are grouped by category (Navigation, Actions, System)
- **AND** inactive or unavailable actions are dimmed

#### Scenario: Dynamic keybinding updates
- **WHEN** panel changes
- **THEN** footer keybindings update to match new panel
- **AND** when no server is selected
- **THEN** enable/disable hints are dimmed
- **AND** when tool is selected
- **THEN** invoke hint becomes active

### Requirement: Header with Status
The TUI SHALL display a header with gateway version, status, and summary metrics.

#### Scenario: Display header
- **WHEN** TUI renders
- **THEN** header shows: Goblin MCP Gateway v{version}
- **AND** displays: Status indicator (Online/Offline)
- **AND** displays: Connected servers count
- **AND** displays: Total tools count

#### Scenario: Header status updates
- **WHEN** gateway status changes
- **THEN** header updates within 1 second
- **AND** color reflects status (green=online, red=error)

### Requirement: Compact Mode
The TUI SHALL support a compact mode for dense data display.

#### Scenario: Toggle compact mode
- **WHEN** user presses `c`
- **THEN** sidebar collapses or hides
- **AND** detail panel hides
- **AND** list expands to fill space
- **AND** footer remains visible

#### Scenario: Exit compact mode
- **WHEN** compact mode is active
- **AND** user presses `c` again
- **THEN** sidebar and detail panel reappear
- **AND** layout returns to normal

### Requirement: Refresh Data
The TUI SHALL support refreshing data from gateway services.

#### Scenario: Manual refresh
- **WHEN** user presses `r`
- **THEN** all panels refresh data from services
- **AND** loading indicator appears briefly
- **AND** data updates within 2 seconds

#### Scenario: Auto-refresh on server change
- **WHEN** server is added or removed
- **THEN** TUI automatically refreshes server list
- **AND** tools/prompts/resources refresh if affected

### Requirement: State Integration
The TUI SHALL integrate with real gateway state services.

#### Scenario: Connect to registry
- **WHEN** TUI starts
- **AND** registry service is available
- **THEN** tools, prompts, and resources are loaded from registry
- **AND** data is refreshed on registry changes

#### Scenario: Connect to connection manager
- **WHEN** TUI starts
- **AND** connection manager is available
- **THEN** server statuses are loaded from connection manager
- **AND** statuses update in real-time

#### Scenario: Connect to logging system
- **WHEN** TUI starts
- **AND** logging system is available
- **THEN** activity logs are streamed to TUI
- **AND** logs appear with sub-second latency

#### Scenario: Handle service disconnection
- **WHEN** gateway service becomes unavailable
- **THEN** TUI shows disconnected state
- **AND** status indicator changes to error
- **AND** error message is displayed
- **AND** TUI attempts reconnection

### Requirement: Visual Styling
The TUI SHALL follow consistent visual styling with cyber-industrial aesthetic.

#### Scenario: Color scheme
- **WHEN** TUI renders
- **THEN** background is dark (#0A0A0A)
- **AND** primary accent is acid green (#ADFF2F)
- **AND** success states use green
- **AND** error states use red
- **AND** warning states use yellow
- **AND** info states use cyan

#### Scenario: Status indicators
- **WHEN** server is online
- **THEN** indicator shows green circle (●)
- **AND** when server is offline
- **THEN** indicator shows red circle (●)
- **AND** when server is connecting
- **THEN** indicator shows yellow circle (●)

#### Scenario: Focus indicators
- **WHEN** pane has focus
- **THEN** border uses double-line style
- **AND** when pane does not have focus
- **THEN** border uses single-line style
