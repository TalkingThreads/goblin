import { Box, Text, useApp, useInput } from "ink";
import { memo, useCallback, useState } from "react";
import type { GoblinGateway } from "../core/gateway.js";
import AddServerForm from "./components/AddServerForm.js";
import ConfirmDialog from "./components/ConfirmDialog.js";
import ServerContextMenu from "./components/ServerContextMenu.js";
import ServerDetails from "./components/ServerDetails.js";
import ServerList from "./components/ServerList.js";
import Sidebar, { type SidebarItem } from "./components/Sidebar.js";
import SlashMode from "./components/SlashMode.js";
import ToolInvocationPanel from "./components/ToolInvocationPanel.js";
import { useGatewayData } from "./hooks/useGatewayData.js";
import MetricsPanel from "./MetricsPanel.js";
import PromptsPanel from "./PromptsPanel.js";
import ResourcesPanel from "./ResourcesPanel.js";
import type { AddServerFormData, TuiScreen, TuiServer } from "./types.js";

const Header = memo(function Header({ gateway }: { gateway: GoblinGateway | null }) {
  const { metrics } = useGatewayData(gateway);

  return (
    <Box borderStyle="round" borderColor="green" paddingX={1} marginBottom={1}>
      <Box flexGrow={1}>
        <Text color="green" bold>
          Goblin MCP Gateway v0.1.0
        </Text>
      </Box>
      <Box marginRight={2}>
        <Text color="blue">●</Text>
        <Text> {metrics.connections} conns</Text>
      </Box>
      <Box marginRight={2}>
        <Text color={metrics.errors > 0 ? "red" : "green"}>
          <Text color="green">●</Text> {metrics.errors} errs
        </Text>
      </Box>
      <Box>
        <Text>Status: </Text>
        <Text color="green" bold>
          ● Online
        </Text>
      </Box>
    </Box>
  );
});

const LogsPane = memo(function LogsPane({
  logs,
  isActive,
}: {
  logs: Array<{
    timestamp: Date;
    message: string;
    level: "info" | "warn" | "error" | "debug";
  }>;
  isActive: boolean;
}) {
  return (
    <Box
      flexDirection="column"
      borderStyle="single"
      borderColor={isActive ? "cyan" : "gray"}
      paddingX={1}
      flexGrow={1}
    >
      <Box marginBottom={1}>
        <Text bold underline color={isActive ? "cyan" : "gray"}>
          RECENT ACTIVITY
        </Text>
      </Box>
      <Box flexDirection="column">
        {logs.slice(-20).map((log, i) => (
          <Box key={i}>
            <Text color="gray" dimColor>
              [{log.timestamp.toLocaleTimeString()}]
            </Text>
            <Text color={log.level === "error" ? "red" : log.level === "warn" ? "yellow" : "white"}>
              {" "}
              {log.message}
            </Text>
          </Box>
        ))}
        {logs.length === 0 && (
          <Box>
            <Text color="gray">No activity yet</Text>
          </Box>
        )}
      </Box>
    </Box>
  );
});

const Footer = memo(function Footer({ showMetrics: _showMetrics }: { showMetrics: boolean }) {
  return (
    <Box marginTop={1} paddingX={1} justifyContent="space-between">
      <Box>
        <Text color="gray">
          <Text dimColor>Tab: Focus | q: Quit | m: Metrics</Text>
        </Text>
      </Box>
      <Box>
        <Text dimColor>Goblin Dashboard v0.1</Text>
      </Box>
    </Box>
  );
});

/**
 * MAIN APP COMPONENT
 */
const App = ({ gateway }: { gateway: GoblinGateway | null }) => {
  const { exit } = useApp();
  const [showMetrics, setShowMetrics] = useState(false);
  const [slashMode, setSlashMode] = useState(false);
  const [activeScreen, setActiveScreen] = useState<TuiScreen>("dashboard");
  const [selectedServer, setSelectedServer] = useState<TuiServer | null>(null);
  const [contextMenuServer, setContextMenuServer] = useState<TuiServer | null>(null);

  // Layout State
  const [activeView, setActiveView] = useState<SidebarItem>("servers");
  const [focusArea, setFocusArea] = useState<"sidebar" | "content">("sidebar");

  const { servers, tools, logs } = useGatewayData(gateway);

  const handleSelectServer = useCallback((server: TuiServer) => {
    setSelectedServer(server);
  }, []);

  const handleAddServer = useCallback(() => {
    setActiveScreen("add-server");
  }, []);

  const handleAddServerSubmit = useCallback((data: AddServerFormData) => {
    console.log("Adding server:", data);
    setActiveScreen("dashboard");
    setSelectedServer(null);
  }, []);

  const handleAddServerCancel = useCallback(() => {
    setActiveScreen("dashboard");
  }, []);

  const handleConfirmRemove = useCallback(() => {
    if (selectedServer) {
      console.log("Removing server:", selectedServer.name);
    }
    setActiveScreen("dashboard");
    setSelectedServer(null);
  }, [selectedServer]);

  const handleConfirmCancel = useCallback(() => {
    setActiveScreen("dashboard");
    setSelectedServer(null);
  }, []);

  const handleContextMenu = useCallback((server: TuiServer) => {
    setContextMenuServer(server);
  }, []);

  const handleContextMenuAction = useCallback(
    (action: "details" | "enable" | "disable" | "remove") => {
      setContextMenuServer(null);
      if (!contextMenuServer) return;

      switch (action) {
        case "details":
          setSelectedServer(contextMenuServer);
          setActiveScreen("server-details");
          break;
        case "enable":
          console.log("Enabling server:", contextMenuServer.name);
          break;
        case "disable":
          console.log("Disabling server:", contextMenuServer.name);
          break;
        case "remove":
          setSelectedServer(contextMenuServer);
          setActiveScreen("confirm-remove");
          break;
      }
    },
    [contextMenuServer],
  );

  const handleContextMenuClose = useCallback(() => {
    setContextMenuServer(null);
  }, []);

  const handleServerDetailsClose = useCallback(() => {
    setActiveScreen("dashboard");
    setSelectedServer(null);
  }, []);

  useInput((input, key) => {
    if (activeScreen !== "dashboard") {
      if (input === "\u001b") {
        if (activeScreen === "add-server") {
          handleAddServerCancel();
        } else if (activeScreen === "confirm-remove") {
          handleConfirmCancel();
        }
      }
      return;
    }

    if (slashMode) {
      if (input === "/") {
        // Handled by SlashMode component
      }
      return;
    }

    // Global navigation
    if (key.tab) {
      setFocusArea((prev) => (prev === "sidebar" ? "content" : "sidebar"));
      return;
    }

    if (focusArea === "sidebar") {
      if (key.return || input === " ") {
        setFocusArea("content");
        return;
      }
    }

    if (focusArea === "content") {
      if (key.escape) {
        setFocusArea("sidebar");
        return;
      }
    }

    // Global hotkeys (when not in content mode that consumes input)
    // We allow these if focus is sidebar OR if the active content doesn't aggressively consume all keys
    // For safety, let's keep them global but handle conflicts in sub-components if needed.
    // Actually, sub-components with useInput({isActive: true}) will consume input first if they return/stop propagation?
    // Ink doesn't stop propagation by default.

    if (input === "q") {
      exit();
    }
    if (input === "m") {
      setShowMetrics((prev) => !prev);
    }
    if (input === "/") {
      setSlashMode(true);
    }
  });

  const handleSlashExecute = (command: string, args?: Record<string, string>) => {
    console.log(`Executing slash command: ${command}`, args);
    setSlashMode(false);
  };

  const handleSlashExit = () => {
    setSlashMode(false);
  };

  return (
    <Box flexDirection="column" padding={1} height="100%">
      <Header gateway={gateway} />

      {slashMode && (
        <SlashMode
          registry={gateway?.registry ?? null}
          onExecute={handleSlashExecute}
          onExit={handleSlashExit}
        />
      )}

      {/* Modal Dialogs */}
      {activeScreen === "add-server" && (
        <AddServerForm onSubmit={handleAddServerSubmit} onCancel={handleAddServerCancel} />
      )}
      {activeScreen === "confirm-remove" && selectedServer && (
        <ConfirmDialog
          type="remove"
          server={selectedServer}
          onConfirm={handleConfirmRemove}
          onCancel={handleConfirmCancel}
        />
      )}
      {activeScreen === "server-details" && selectedServer && (
        <ServerDetails server={selectedServer} onClose={handleServerDetailsClose} />
      )}
      {activeScreen === "dashboard" && contextMenuServer && (
        <ServerContextMenu
          server={contextMenuServer}
          onSelect={handleContextMenuAction}
          onClose={handleContextMenuClose}
        />
      )}

      {/* Main Dashboard Layout */}
      {activeScreen === "dashboard" && (
        <Box flexDirection="row" flexGrow={1}>
          {/* Left Sidebar */}
          <Sidebar
            activeView={activeView}
            onSelect={setActiveView}
            isActive={focusArea === "sidebar"}
          />

          {/* Right Content Area */}
          <Box flexGrow={1} flexDirection="column">
            {activeView === "servers" && (
              <ServerList
                servers={servers as import("./types.js").TuiServer[]}
                onSelectServer={handleSelectServer}
                onAddServer={handleAddServer}
                onContextMenu={handleContextMenu}
                isActive={focusArea === "content"}
              />
            )}
            {activeView === "tools" && (
              <ToolInvocationPanel
                tools={tools}
                gateway={gateway}
                isActive={focusArea === "content"}
              />
            )}
            {activeView === "prompts" && (
              <PromptsPanel gateway={gateway} isActive={focusArea === "content"} />
            )}
            {activeView === "resources" && (
              <ResourcesPanel gateway={gateway} isActive={focusArea === "content"} />
            )}
            {activeView === "logs" && <LogsPane logs={logs} isActive={focusArea === "content"} />}

            {showMetrics && <MetricsPanel />}
          </Box>
        </Box>
      )}

      {activeScreen === "dashboard" && <Footer showMetrics={showMetrics} />}
    </Box>
  );
};

export default App;
