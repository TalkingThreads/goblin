import { Box, Text, useInput } from "ink";
import { useState, useCallback, memo } from "react";
import type { TuiServer } from "../types.js";

interface ServerContextMenuProps {
  server: TuiServer;
  onSelect: (action: "details" | "enable" | "disable" | "remove") => void;
  onClose: () => void;
}

const ServerContextMenu = memo(function ServerContextMenu({
  server,
  onSelect,
  onClose,
}: ServerContextMenuProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const menuItems = [
    { key: "details", label: "View Details", enabled: true },
    { key: "enable", label: "Enable Server", enabled: !server.enabled },
    { key: "disable", label: "Disable Server", enabled: server.enabled },
    { key: "remove", label: "Remove Server", enabled: true },
  ];

  const enabledItems = menuItems.filter((item) => item.enabled);

  const handleKeyDown = useCallback(
    (input: string) => {
      if (input === "\u001b") {
        onClose();
        return;
      }

      if (input === "k" || input === "\u001b[A") {
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : enabledItems.length - 1));
      } else if (input === "j" || input === "\u001b[B") {
        setSelectedIndex((prev) => (prev < enabledItems.length - 1 ? prev + 1 : 0));
      } else if (input === "\r" || input === "\n") {
        const item = enabledItems[selectedIndex];
        if (item) {
          onSelect(item.key as "details" | "enable" | "disable" | "remove");
        }
      } else if (input === "d") {
        onSelect("details");
      } else if (input === "e" && !server.enabled) {
        onSelect("enable");
      } else if (input === "x" && server.enabled) {
        onSelect("disable");
      } else if (input === "r") {
        onSelect("remove");
      }
    },
    [selectedIndex, enabledItems, onSelect, onClose, server.enabled],
  );

  useInput(handleKeyDown, { isActive: true });

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor="yellow"
      paddingX={1}
      paddingY={1}
      marginLeft={1}
    >
      <Box marginBottom={1}>
        <Text bold color="yellow">
          Server Actions: {server.name}
        </Text>
      </Box>
      {enabledItems.map((item, index) => (
        <Box key={item.key}>
          <Text color={index === selectedIndex ? "green" : "gray"}>
            {index === selectedIndex ? "▶" : " "} {item.label}
          </Text>
        </Box>
      ))}
      <Box marginTop={1}>
        <Text color="gray" dimColor>
          [↑/↓ or j/k: Select] [Enter: Execute] [Esc: Close]
        </Text>
      </Box>
    </Box>
  );
});

export default ServerContextMenu;
