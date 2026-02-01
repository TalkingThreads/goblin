import { useState, useEffect } from "react";
import { Box, Text, useInput, useApp } from "ink";
import PromptsPanel from "./PromptsPanel.js";
import ResourcesPanel from "./ResourcesPanel.js";
import MetricsPanel from "./MetricsPanel.js";
import { mcpActiveConnections, mcpToolCallsTotal } from "../observability/metrics.js";

/**
 * MOCK DATA
 */
const MOCK_SERVERS = [
  { id: "1", name: "FileSystem", transport: "stdio", status: "online", tools: 12 },
  { id: "2", name: "GoogleSearch", transport: "sse", status: "online", tools: 5 },
  { id: "3", name: "Database", transport: "stdio", status: "offline", tools: 0 },
  { id: "4", name: "WeatherAPI", transport: "sse", status: "online", tools: 3 },
  { id: "5", name: "Slack", transport: "sse", status: "online", tools: 8 },
];

const MOCK_LOGS = [
  "Checking server status...",
  "Connected to FileSystem via stdio",
  "Error: Database server unreachable",
  "Aggregated 20 tools from 3 servers",
  "Gateway listening on port 3000",
  "User requested 'ls' from FileSystem",
  "FileSystem returned 42 items",
];

/**
 * HEADER COMPONENT
 * Displays the gateway version, global status, and key metrics summary.
 */
const Header = () => {
  const [metrics, setMetrics] = useState({ connections: 0, errors: 0 });

  useEffect(() => {
    const interval = setInterval(() => {
      const connectionGauges = mcpActiveConnections.getAll();
      const connections = connectionGauges.reduce((sum, g) => sum + g.value, 0);
      const errors = mcpToolCallsTotal.value({ status: "error" }) || 0;

      setMetrics({ connections, errors });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

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
          {metrics.errors > 0 ? "●" : "●"} {metrics.errors} errs
        </Text>
      </Box>
      <Box>
        <Text>Status: </Text>
        <Text color="green" bold>● Online</Text>
      </Box>
    </Box>
  );
};

/**
 * SERVERS PANE
 * A table-like view of connected MCP servers.
 */
const ServersPane = () => (
  <Box flexDirection="column" borderStyle="single" paddingX={1} flexGrow={1} minWidth={40}>
    <Box marginBottom={1}>
      <Text bold underline color="cyan">CONNECTED SERVERS</Text>
    </Box>
    <Box>
      <Box width={15}><Text bold>Name</Text></Box>
      <Box width={12}><Text bold>Transport</Text></Box>
      <Box width={8}><Text bold>Tools</Text></Box>
      <Box><Text bold>Status</Text></Box>
    </Box>
    <Box flexDirection="column" marginTop={1}>
      {MOCK_SERVERS.map((server) => (
        <Box key={server.id}>
          <Box width={15}><Text>{server.name}</Text></Box>
          <Box width={12}><Text color="gray">{server.transport}</Text></Box>
          <Box width={8}><Text>{server.tools}</Text></Box>
          <Box>
            <Text color={server.status === "online" ? "green" : "red"}>
              {server.status === "online" ? "🟢" : "🔴"} {server.status.toUpperCase()}
            </Text>
          </Box>
        </Box>
      ))}
    </Box>
  </Box>
);

/**
 * LOGS PANE
 * A simulated scrolling log view.
 */
const LogsPane = () => {
  const [logs, setLogs] = useState(MOCK_LOGS);

  useEffect(() => {
    const interval = setInterval(() => {
      setLogs((prev) => {
        const newLog = `Incoming request to ${MOCK_SERVERS[Math.floor(Math.random() * MOCK_SERVERS.length)]?.name}...`;
        return [...prev.slice(-12), newLog];
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Box flexDirection="column" borderStyle="single" paddingX={1} flexGrow={2} marginLeft={1}>
      <Box marginBottom={1}>
        <Text bold underline color="yellow">RECENT ACTIVITY</Text>
      </Box>
      <Box flexDirection="column">
        {logs.map((log, i) => (
          <Box key={i}>
            <Text color="gray" dimColor>[{new Date().toLocaleTimeString()}]</Text>
            <Text> {log}</Text>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

/**
 * FOOTER COMPONENT
 * Help text for the TUI.
 */
const Footer = ({ showMetrics }: { showMetrics: boolean }) => (
  <Box marginTop={1} paddingX={1} justifyContent="space-between">
    <Box>
      <Text color="gray">q: </Text><Text dimColor>Quit</Text>
      <Text color="gray"> | r: </Text><Text dimColor>Reload</Text>
      <Text color="gray"> | m: </Text>
      <Text dimColor={!showMetrics}>Metrics</Text>
    </Box>
    <Box>
      <Text dimColor>Goblin Dashboard v0.1</Text>
    </Box>
  </Box>
);

/**
 * MAIN APP COMPONENT
 */
const App = () => {
  const { exit } = useApp();
  const [showMetrics, setShowMetrics] = useState(false);

  useInput((input) => {
    if (input === "q") {
      exit();
    }
    if (input === "r") {
      // Simulate reload
    }
    if (input === "m") {
      setShowMetrics((prev) => !prev);
    }
  });

  return (
    <Box flexDirection="column" padding={1}>
      <Header />
      <Box flexGrow={1} height={18}>
        <ServersPane />
        <PromptsPanel />
        <ResourcesPanel />
        {showMetrics && <MetricsPanel />}
        <LogsPane />
      </Box>
      <Footer showMetrics={showMetrics} />
    </Box>
  );
};

export default App;
