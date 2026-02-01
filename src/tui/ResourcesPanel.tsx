import { useState, useEffect } from "react";
import { Box, Text, useInput } from "ink";
import { useGatewayData, useFilteredResources } from "./hooks/useGatewayData.js";
import type { GoblinGateway } from "../core/gateway.js";

/**
 * ResourcesPanel Component
 * Displays available resources with filtering and search capabilities
 */
const ResourcesPanel = ({ gateway }: { gateway: GoblinGateway | null }) => {
  const { resources } = useGatewayData(gateway);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [filterServer, setFilterServer] = useState<string | null>(null);
  const [filterMimeType, setFilterMimeType] = useState<string | null>(null);
  const [searchQuery] = useState("");

  const filteredResources = useFilteredResources(resources, filterServer, filterMimeType, searchQuery);

  // Get unique MIME types for filter
  const mimeTypes = [...new Set(resources.map((r) => r.def.mimeType))];

  // Get unique server names for filter
  const serverNames = [...new Set(resources.map((r) => r.serverId))].filter(
    (s) => s !== "goblin",
  );

  // Reset selected index when filtered results change
  useEffect(() => {
    if (selectedIndex >= filteredResources.length) {
      setSelectedIndex(Math.max(0, filteredResources.length - 1));
    }
  }, [filteredResources.length]);

  useInput((input, key) => {
    if (key.upArrow) {
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
    }
    if (key.downArrow) {
      setSelectedIndex((prev) => (prev < filteredResources.length - 1 ? prev + 1 : prev));
    }
    if (input === "f") {
      // Toggle server filter
      setFilterServer((prev) => {
        const currentIdx = serverNames.findIndex((s) => s === prev);
        const nextIdx = currentIdx < serverNames.length - 1 ? currentIdx + 1 : -1;
        return nextIdx >= 0 ? serverNames[nextIdx] ?? null : null;
      });
    }
    if (input === "m") {
      // Toggle MIME type filter
      setFilterMimeType((prev) => {
        const currentIdx = mimeTypes.findIndex((m) => m === prev);
        const nextIdx = currentIdx < mimeTypes.length - 1 ? currentIdx + 1 : -1;
        return nextIdx >= 0 ? mimeTypes[nextIdx] ?? null : null;
      });
    }
  });

  return (
    <Box
      flexDirection="column"
      borderStyle="single"
      paddingX={1}
      flexGrow={1}
      minWidth={40}
    >
      <Box marginBottom={1}>
        <Text bold underline color="green">
          AVAILABLE RESOURCES
        </Text>
      </Box>

      {/* Filter bars */}
      <Box marginBottom={1} flexDirection="column">
        <Box>
          <Text color="gray">Server: </Text>
          <Text color={filterServer ? "cyan" : "gray"}>
            {filterServer
              ? serverNames.find((s) => s === filterServer) || filterServer
              : "All"}
          </Text>
          <Text color="gray"> | </Text>
          <Text color="gray">MIME: </Text>
          <Text color={filterMimeType ? "yellow" : "gray"}>
            {filterMimeType || "All"}
          </Text>
        </Box>
      </Box>

      {/* Column headers */}
      <Box>
        <Box width={15}>
          <Text bold>Name</Text>
        </Box>
        <Box width={10}>
          <Text bold>Type</Text>
        </Box>
        <Box width={10}>
          <Text bold>Server</Text>
        </Box>
        <Box>
          <Text bold>Description</Text>
        </Box>
      </Box>

      {/* Resource list */}
      <Box flexDirection="column" marginTop={1}>
        {filteredResources.length === 0 ? (
          <Text color="gray">No resources found</Text>
        ) : (
          filteredResources.map((resource, index) => (
            <Box
              key={resource.def.uri}
              backgroundColor={index === selectedIndex ? "gray" : undefined}
            >
              <Box width={15}>
                <Text color={index === selectedIndex ? "cyan" : "white"}>
                  {(resource.def.name || resource.def.uri.split("/").pop() || "Unknown").length > 14
                    ? (resource.def.name || resource.def.uri.split("/").pop() || "Unknown").slice(0, 11) + "..."
                    : resource.def.name || resource.def.uri.split("/").pop() || "Unknown"}
                </Text>
              </Box>
              <Box width={10}>
                <Text color="blue">{resource.def.mimeType?.split("/")[1] || "?"}</Text>
              </Box>
              <Box width={10}>
                <Text color="gray">{resource.serverId}</Text>
              </Box>
              <Box flexGrow={1}>
                <Text color="gray" dimColor>
                  {resource.def.description && resource.def.description.length > 35
                    ? resource.def.description.slice(0, 32) + "..."
                    : resource.def.description || "No description"}
                </Text>
              </Box>
            </Box>
          ))
        )}
      </Box>

      {/* URI display for selected resource */}
      {filteredResources.length > 0 && filteredResources[selectedIndex] && (
        <Box marginTop={1} flexDirection="column">
          <Text color="gray" dimColor>
            URI:{" "}
          </Text>
          <Text color="white">
            {filteredResources[selectedIndex]!.def.uri.length > 60
              ? "..." + filteredResources[selectedIndex]!.def.uri.slice(-60)
              : filteredResources[selectedIndex]!.def.uri}
          </Text>
        </Box>
      )}

      {/* Help text */}
      <Box marginTop={1}>
        <Text color="gray" dimColor>
          ↑↓: Navigate | f: Server filter | m: MIME filter | Enter: Read
        </Text>
      </Box>
    </Box>
  );
};

export default ResourcesPanel;
