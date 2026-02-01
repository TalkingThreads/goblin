import { useState, useEffect } from "react";
import { Box, Text, useInput } from "ink";

/**
 * Mock data for resources panel development
 */
const MOCK_RESOURCES = [
  {
    uri: "file:///home/user/docs/readme.md",
    name: "README.md",
    description: "Project README documentation",
    mimeType: "text/markdown",
    serverId: "filesystem",
  },
  {
    uri: "file:///home/user/config/settings.json",
    name: "settings.json",
    description: "User configuration file",
    mimeType: "application/json",
    serverId: "filesystem",
  },
  {
    uri: "https://api.example.com/users",
    name: "Users API",
    description: "REST API endpoint for users",
    mimeType: "application/json",
    serverId: "http-api",
  },
  {
    uri: "s3://bucket/docs/guide.pdf",
    name: "User Guide",
    description: "PDF documentation for end users",
    mimeType: "application/pdf",
    serverId: "s3-storage",
  },
  {
    uri: "file:///home/user/docs/api.md",
    name: "API Reference",
    description: "Complete API documentation with endpoints and examples. This is a longer description to test truncation behavior.",
    mimeType: "text/markdown",
    serverId: "filesystem",
  },
];

const MOCK_SERVERS = [
  { id: "filesystem", name: "FileSystem" },
  { id: "http-api", name: "HTTP API" },
  { id: "s3-storage", name: "S3 Storage" },
];

/**
 * ResourcesPanel Component
 * Displays available resources with filtering and search capabilities
 */
const ResourcesPanel = () => {
  const [resources, setResources] = useState(MOCK_RESOURCES);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [filterServer, setFilterServer] = useState<string | null>(null);
  const [filterMimeType, setFilterMimeType] = useState<string | null>(null);

  // Get unique MIME types for filter
  const mimeTypes = [...new Set(MOCK_RESOURCES.map((r) => r.mimeType))];

  // Filter resources based on server and MIME type
  useEffect(() => {
    let filtered = MOCK_RESOURCES;

    if (filterServer) {
      filtered = filtered.filter((r) => r.serverId === filterServer);
    }

    if (filterMimeType) {
      filtered = filtered.filter((r) => r.mimeType === filterMimeType);
    }

    setResources(filtered);
  }, [filterServer, filterMimeType]);

  useInput((input, key) => {
    if (key.upArrow) {
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
    }
    if (key.downArrow) {
      setSelectedIndex((prev) => (prev < resources.length - 1 ? prev + 1 : prev));
    }
    if (input === "f") {
      // Toggle server filter
      setFilterServer((prev) => {
        const currentIdx = MOCK_SERVERS.findIndex((s) => s.id === prev);
        const nextIdx = currentIdx < MOCK_SERVERS.length - 1 ? currentIdx + 1 : -1;
        return nextIdx >= 0 ? MOCK_SERVERS[nextIdx]?.id ?? null : null;
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
              ? MOCK_SERVERS.find((s) => s.id === filterServer)?.name || filterServer
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
        {resources.length === 0 ? (
          <Text color="gray">No resources found</Text>
        ) : (
          resources.map((resource, index) => (
            <Box
              key={resource.uri}
              backgroundColor={index === selectedIndex ? "gray" : undefined}
            >
              <Box width={15}>
                <Text color={index === selectedIndex ? "cyan" : "white"}>
                  {resource.name.length > 14
                    ? resource.name.slice(0, 11) + "..."
                    : resource.name}
                </Text>
              </Box>
              <Box width={10}>
                <Text color="blue">{resource.mimeType.split("/")[1] || "?"}</Text>
              </Box>
              <Box width={10}>
                <Text color="gray">{resource.serverId}</Text>
              </Box>
              <Box flexGrow={1}>
                <Text color="gray" dimColor>
                  {resource.description.length > 35
                    ? resource.description.slice(0, 32) + "..."
                    : resource.description}
                </Text>
              </Box>
            </Box>
          ))
        )}
      </Box>

      {/* URI display for selected resource */}
      {resources.length > 0 && resources[selectedIndex] && (
        <Box marginTop={1} flexDirection="column">
          <Text color="gray" dimColor>
            URI:{" "}
          </Text>
          <Text color="white">
            {resources[selectedIndex]!.uri.length > 60
              ? "..." + resources[selectedIndex]!.uri.slice(-60)
              : resources[selectedIndex]!.uri}
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
