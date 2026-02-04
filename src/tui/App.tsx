import { memo, useState } from "react";
import { Box, Text, useInput, useApp } from "ink";
import PromptsPanel from "./PromptsPanel.js";
import ResourcesPanel from "./ResourcesPanel.js";
import MetricsPanel from "./MetricsPanel.js";
import SlashMode from "./components/SlashMode.js";
import { useGatewayData } from "./hooks/useGatewayData.js";
import type { GoblinGateway } from "../core/gateway.js";

const Header = memo(function Header({
  gateway,
}: {
  gateway: GoblinGateway | null;
}) {
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

const ServersPane = memo(function ServersPane({
  servers,
}: {
  servers: Array<{
    id: string;
    name: string;
    transport: string;
    status: "online" | "offline";
    tools: number;
  }>;
}) {
  return (
    <Box
      flexDirection="column"
      borderStyle="single"
      paddingX={1}
      flexGrow={1}
      minWidth={40}
    >
      <Box marginBottom={1}>
        <Text bold underline color="cyan">
          CONNECTED SERVERS
        </Text>
      </Box>
      <Box>
        <Box width={15}>
          <Text bold>Name</Text>
        </Box>
        <Box width={12}>
          <Text bold>Transport</Text>
        </Box>
        <Box width={8}>
          <Text bold>Tools</Text>
        </Box>
        <Box>
          <Text bold>Status</Text>
        </Box>
      </Box>
      <Box flexDirection="column" marginTop={1}>
        {servers.map((server) => (
          <Box key={server.id}>
            <Box width={15}>
              <Text>{server.name}</Text>
            </Box>
            <Box width={12}>
              <Text color="gray">{server.transport}</Text>
            </Box>
            <Box width={8}>
              <Text>{server.tools}</Text>
            </Box>
            <Box>
              <Text color={server.status === "online" ? "green" : "red"}>
                {server.status === "online" ? "🟢" : "🔴"}{" "}
                {server.status.toUpperCase()}
              </Text>
            </Box>
          </Box>
        ))}
        {servers.length === 0 && (
          <Box>
            <Text color="gray">No servers connected</Text>
          </Box>
        )}
      </Box>
    </Box>
  );
});

const LogsPane = memo(function LogsPane({
  logs,
}: {
  logs: Array<{
    timestamp: Date;
    message: string;
    level: "info" | "warn" | "error" | "debug";
  }>;
}) {
  return (
    <Box
      flexDirection="column"
      borderStyle="single"
      paddingX={1}
      flexGrow={2}
      marginLeft={1}
    >
      <Box marginBottom={1}>
        <Text bold underline color="yellow">
          RECENT ACTIVITY
        </Text>
      </Box>
      <Box flexDirection="column">
        {logs.slice(-12).map((log, i) => (
          <Box key={i}>
            <Text color="gray" dimColor>
              [{log.timestamp.toLocaleTimeString()}]
            </Text>
            <Text
              color={
                log.level === "error"
                  ? "red"
                  : log.level === "warn"
                    ? "yellow"
                    : "white"
              }
            >
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

const Footer = memo(function Footer({ showMetrics }: { showMetrics: boolean }) {
  return (
    <Box marginTop={1} paddingX={1} justifyContent="space-between">
      <Box>
        <Text color="gray">
          q: <Text dimColor>Quit</Text>
          <Text color="gray"> | r: </Text>
          <Text dimColor>Reload</Text>
          <Text color="gray"> | m: </Text>
          <Text dimColor={!showMetrics}>Metrics</Text>
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
  const { servers, logs } = useGatewayData(gateway);

  useInput((input) => {
    if (slashMode) {
      if (input === "/") {
        // Already in slash mode, let the SlashMode component handle it
      }
      return;
    }

    if (input === "q") {
      exit();
    }
    if (input === "r") {
      // Trigger refresh - the hook will pick up changes
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
    <Box flexDirection="column" padding={1}>
      <Header gateway={gateway} />
      {slashMode && (
        <SlashMode
          registry={gateway?.registry ?? null}
          onExecute={handleSlashExecute}
          onExit={handleSlashExit}
        />
      )}
      <Box flexGrow={1} height={18}>
        <ServersPane servers={servers} />
        <PromptsPanel gateway={gateway} />
        <ResourcesPanel gateway={gateway} />
        {showMetrics && <MetricsPanel />}
        <LogsPane logs={logs} />
      </Box>
      <Footer showMetrics={showMetrics} />
    </Box>
  );
};

export default App;
