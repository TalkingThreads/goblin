import { Box, Text, useInput } from "ink";
import { memo } from "react";

export type SidebarItem = "servers" | "tools" | "prompts" | "resources" | "logs";

interface SidebarProps {
  activeView: SidebarItem;
  onSelect: (view: SidebarItem) => void;
  isActive: boolean;
}

const ITEMS: { id: SidebarItem; label: string }[] = [
  { id: "servers", label: "Servers" },
  { id: "tools", label: "Tools" },
  { id: "prompts", label: "Prompts" },
  { id: "resources", label: "Resources" },
  { id: "logs", label: "Logs" },
];

const Sidebar = memo(function Sidebar({ activeView, onSelect, isActive }: SidebarProps) {
  useInput(
    (_input, key) => {
      if (key.upArrow) {
        const currentIndex = ITEMS.findIndex((item) => item.id === activeView);
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : ITEMS.length - 1;
        const target = ITEMS[prevIndex];
        if (target) onSelect(target.id);
      }
      if (key.downArrow) {
        const currentIndex = ITEMS.findIndex((item) => item.id === activeView);
        const nextIndex = currentIndex < ITEMS.length - 1 ? currentIndex + 1 : 0;
        const target = ITEMS[nextIndex];
        if (target) onSelect(target.id);
      }
    },
    { isActive },
  );

  return (
    <Box
      flexDirection="column"
      borderStyle="single"
      borderColor={isActive ? "cyan" : "gray"}
      paddingX={1}
      width={20}
      marginRight={1}
    >
      <Box marginBottom={1}>
        <Text bold underline color={isActive ? "cyan" : "gray"}>
          MENU
        </Text>
      </Box>
      {ITEMS.map((item) => (
        <Box key={item.id}>
          <Text
            color={activeView === item.id ? (isActive ? "cyan" : "white") : "gray"}
            bold={activeView === item.id}
          >
            {activeView === item.id ? "▶ " : "  "}
            {item.label}
          </Text>
        </Box>
      ))}
    </Box>
  );
});

export default Sidebar;
