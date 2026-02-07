import { Box, Text, useInput } from "ink";
import { useState, useCallback, memo } from "react";
import type { TuiServer } from "../types.js";

interface ServerListProps {
  servers: TuiServer[];
  onSelectServer: (server: TuiServer) => void;
  onAddServer: () => void;
  onContextMenu?: (server: TuiServer) => void;
}

interface ServerItemProps {
  server: TuiServer;
  isSelected: boolean;
}

const ServerItem = memo(function ServerItem({ server, isSelected }: ServerItemProps) {
  const getStatusColor = (status: string, enabled: boolean): string => {
    if (!enabled) return "gray";
    return status === "online" ? "green" : "red";
  };

  const getStatusIcon = (status: string, enabled: boolean): string => {
    if (!enabled) return "○";
    return status === "online" ? "●" : "○";
  };

  return (
    <Box>
      <Box width={2}>
        <Text color={isSelected ? "cyan" : undefined}>{isSelected ? "▶" : " "}</Text>
      </Box>
      <Box width={20}>
        <Text color={isSelected ? "cyan" : undefined}>{server.name}</Text>
      </Box>
      <Box width={12}>
        <Text color="gray">{server.transport}</Text>
      </Box>
      <Box width={8}>
        <Text>{server.tools ?? "-"}</Text>
      </Box>
      <Box>
        <Text color={getStatusColor(server.status, server.enabled)}>
          {getStatusIcon(server.status, server.enabled)} {server.status.toUpperCase()}
        </Text>
      </Box>
    </Box>
  );
});

const ServerList = memo(function ServerList({
  servers,
  onSelectServer,
  onAddServer,
  onContextMenu,
}: ServerListProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const handleUp = useCallback(() => {
    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : servers.length));
  }, [servers.length]);

  const handleDown = useCallback(() => {
    setSelectedIndex((prev) => (prev < servers.length ? prev + 1 : 0));
  }, [servers.length]);

  const handleEnter = useCallback(() => {
    if (selectedIndex < servers.length) {
      const server = servers[selectedIndex];
      if (server) {
        onSelectServer(server);
      }
    }
  }, [servers.length, selectedIndex, servers, onSelectServer]);

  const handleContextMenuAction = useCallback(() => {
    if (selectedIndex < servers.length && onContextMenu) {
      const server = servers[selectedIndex];
      if (server) {
        onContextMenu(server);
      }
    }
  }, [servers.length, selectedIndex, servers, onContextMenu]);

  useInput(
    (input) => {
      if (input === "k" || input === "↑") {
        handleUp();
      } else if (input === "j" || input === "↓") {
        handleDown();
      } else if (input === "a") {
        onAddServer();
      } else if (input === "\r" || input === "\n") {
        handleEnter();
      } else if (input === " " || input === "Enter") {
        handleEnter();
      } else if ((input === "c" || input === "x") && onContextMenu) {
        handleContextMenuAction();
      }
    },
    { isActive: true },
  );

  return (
    <Box flexDirection="column" borderStyle="single" paddingX={1}>
      <Box marginBottom={1}>
        <Text bold underline color="cyan">
          SERVERS ({servers.length})
        </Text>
        <Box marginLeft={2}>
          <Text color="gray">[A: Add]</Text>
        </Box>
      </Box>

      <Box marginBottom={1}>
        <Box width={2}>
          <Text bold color="gray">
            #
          </Text>
        </Box>
        <Box width={20}>
          <Text bold color="gray">
            Name
          </Text>
        </Box>
        <Box width={12}>
          <Text bold color="gray">
            Transport
          </Text>
        </Box>
        <Box width={8}>
          <Text bold color="gray">
            Tools
          </Text>
        </Box>
        <Box>
          <Text bold color="gray">
            Status
          </Text>
        </Box>
      </Box>

      <Box flexDirection="column">
        {servers.map((server, index) => (
          <ServerItem key={server.name} server={server} isSelected={index === selectedIndex} />
        ))}

        {servers.length === 0 && (
          <Box marginTop={1}>
            <Text color="gray">No servers configured. Press [A] to add a server.</Text>
          </Box>
        )}

        {servers.length > 0 && (
          <Box marginTop={1}>
            <Text color="gray">↑/↓ Navigate | Enter: Select | A: Add Server</Text>
          </Box>
        )}
      </Box>
    </Box>
  );
});

export default ServerList;
