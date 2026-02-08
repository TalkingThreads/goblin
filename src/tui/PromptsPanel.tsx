import { Box, Text, useInput } from "ink";
import { useEffect, useState } from "react";
import type { GoblinGateway } from "../core/gateway.js";
import { useFilteredPrompts, useGatewayData } from "./hooks/useGatewayData.js";

/**
 * PromptsPanel Component
 * Displays available prompts with filtering and search capabilities
 */
const PromptsPanel = ({ gateway }: { gateway: GoblinGateway | null }) => {
  const { prompts } = useGatewayData(gateway);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [filterServer, setFilterServer] = useState<string | null>(null);
  const [searchQuery] = useState("");

  const filteredPrompts = useFilteredPrompts(prompts, filterServer, searchQuery);

  // Get unique server names for filter
  const serverNames = [...new Set(prompts.map((p) => p.serverId))].filter((s) => s !== "goblin");

  // Reset selected index when filtered results change
  useEffect(() => {
    if (selectedIndex >= filteredPrompts.length) {
      setSelectedIndex(Math.max(0, filteredPrompts.length - 1));
    }
  }, [filteredPrompts.length, selectedIndex]);

  useInput((input, key) => {
    if (key.upArrow) {
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
    }
    if (key.downArrow) {
      setSelectedIndex((prev) => (prev < filteredPrompts.length - 1 ? prev + 1 : prev));
    }
    if (input === "f") {
      // Toggle server filter
      setFilterServer((prev) => {
        const currentIdx = serverNames.indexOf(prev);
        const nextIdx = currentIdx < serverNames.length - 1 ? currentIdx + 1 : -1;
        return nextIdx >= 0 ? (serverNames[nextIdx] ?? null) : null;
      });
    }
    if (input === "/") {
      // Enter search mode (simplified - just clears selection)
    }
  });

  return (
    <Box flexDirection="column" borderStyle="single" paddingX={1} flexGrow={1} minWidth={40}>
      <Box marginBottom={1}>
        <Text bold underline color="magenta">
          AVAILABLE PROMPTS
        </Text>
      </Box>

      {/* Filter bar */}
      <Box marginBottom={1}>
        <Text color="gray">Filter: </Text>
        <Text color={filterServer ? "cyan" : "gray"}>
          {filterServer ? serverNames.find((s) => s === filterServer) || filterServer : "All"}
        </Text>
        <Text color="gray"> | </Text>
        <Text color="gray">Search: </Text>
        <Text color={searchQuery ? "green" : "gray"}>{searchQuery || "(press / to search)"}</Text>
      </Box>

      {/* Column headers */}
      <Box>
        <Box width={20}>
          <Text bold>Name</Text>
        </Box>
        <Box width={12}>
          <Text bold>Server</Text>
        </Box>
        <Box>
          <Text bold>Description</Text>
        </Box>
      </Box>

      {/* Prompt list */}
      <Box flexDirection="column" marginTop={1}>
        {filteredPrompts.length === 0 ? (
          <Text color="gray">No prompts found</Text>
        ) : (
          filteredPrompts.map((prompt, index) => (
            <Box key={prompt.id} backgroundColor={index === selectedIndex ? "gray" : undefined}>
              <Box width={20}>
                <Text color={index === selectedIndex ? "cyan" : "white"}>
                  {prompt.id.split("_").slice(1).join("_")}
                </Text>
              </Box>
              <Box width={12}>
                <Text color="gray">{prompt.serverId}</Text>
              </Box>
              <Box flexGrow={1}>
                <Text color="gray" dimColor>
                  {prompt.def.description && prompt.def.description.length > 40
                    ? `${prompt.def.description.slice(0, 37)}...`
                    : prompt.def.description || "No description"}
                </Text>
              </Box>
            </Box>
          ))
        )}
      </Box>

      {/* Arguments display for selected prompt */}
      {filteredPrompts.length > 0 && (
        <Box marginTop={1} flexDirection="column">
          <Text color="gray" dimColor>
            Args:{" "}
          </Text>
          <Text color="yellow">
            {filteredPrompts[selectedIndex]?.def.arguments?.map((a) => a.name).join(", ") || "none"}
          </Text>
        </Box>
      )}

      {/* Help text */}
      <Box marginTop={1}>
        <Text color="gray" dimColor>
          ↑↓: Navigate | f: Filter by server | /: Search | Enter: Select
        </Text>
      </Box>
    </Box>
  );
};

export default PromptsPanel;
