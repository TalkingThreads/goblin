import { useState, useEffect } from "react";
import { Box, Text, useInput } from "ink";

/**
 * Mock data for prompts panel development
 */
const MOCK_PROMPTS = [
  {
    id: "filesystem_codeReview",
    name: "codeReview",
    description: "Review code for best practices and potential bugs",
    arguments: ["code", "language"],
    serverId: "filesystem",
  },
  {
    id: "github_prReview",
    name: "prReview",
    description: "Review pull request changes and suggest improvements",
    arguments: ["prNumber", "focus"],
    serverId: "github",
  },
  {
    id: "database_schemaAnalysis",
    name: "schemaAnalysis",
    description: "Analyze database schema for optimization opportunities",
    arguments: ["tables"],
    serverId: "database",
  },
  {
    id: "filesystem_documentCode",
    name: "documentCode",
    description: "Generate documentation for code functions",
    arguments: ["functionName", "outputFormat"],
    serverId: "filesystem",
  },
];

const MOCK_SERVERS = [
  { id: "filesystem", name: "FileSystem" },
  { id: "github", name: "GitHub" },
  { id: "database", name: "Database" },
];

/**
 * PromptsPanel Component
 * Displays available prompts with filtering and search capabilities
 */
const PromptsPanel = () => {
  const [prompts, setPrompts] = useState(MOCK_PROMPTS);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [filterServer, setFilterServer] = useState<string | null>(null);
  const [searchQuery] = useState("");

  // Filter prompts based on server and search
  useEffect(() => {
    let filtered = MOCK_PROMPTS;

    if (filterServer) {
      filtered = filtered.filter((p) => p.serverId === filterServer);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query),
      );
    }

    setPrompts(filtered);
  }, [filterServer, searchQuery]);

  // Update search query (simplified for now)
  useEffect(() => {
    if (searchQuery) {
      // Search logic handled in main useEffect
    }
  }, [searchQuery]);

  useInput((input, key) => {
    if (key.upArrow) {
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
    }
    if (key.downArrow) {
      setSelectedIndex((prev) => (prev < prompts.length - 1 ? prev + 1 : prev));
    }
    if (input === "f") {
      // Toggle server filter
      setFilterServer((prev) => {
        const currentIdx = MOCK_SERVERS.findIndex((s) => s.id === prev);
        const nextIdx = currentIdx < MOCK_SERVERS.length - 1 ? currentIdx + 1 : -1;
        return nextIdx >= 0 ? MOCK_SERVERS[nextIdx]?.id ?? null : null;
      });
    }
    if (input === "/") {
      // Enter search mode (simplified - just clears selection)
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
        <Text bold underline color="magenta">
          AVAILABLE PROMPTS
        </Text>
      </Box>

      {/* Filter bar */}
      <Box marginBottom={1}>
        <Text color="gray">Filter: </Text>
        <Text color={filterServer ? "cyan" : "gray"}>
          {filterServer
            ? MOCK_SERVERS.find((s) => s.id === filterServer)?.name || filterServer
            : "All"}
        </Text>
        <Text color="gray"> | </Text>
        <Text color="gray">Search: </Text>
        <Text color={searchQuery ? "green" : "gray"}>
          {searchQuery || "(press / to search)"}
        </Text>
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
        {prompts.length === 0 ? (
          <Text color="gray">No prompts found</Text>
        ) : (
          prompts.map((prompt, index) => (
            <Box
              key={prompt.id}
              backgroundColor={index === selectedIndex ? "gray" : undefined}
            >
              <Box width={20}>
                <Text color={index === selectedIndex ? "cyan" : "white"}>
                  {prompt.name}
                </Text>
              </Box>
              <Box width={12}>
                <Text color="gray">{prompt.serverId}</Text>
              </Box>
              <Box flexGrow={1}>
                <Text color="gray" dimColor>
                  {prompt.description.length > 40
                    ? prompt.description.slice(0, 37) + "..."
                    : prompt.description}
                </Text>
              </Box>
            </Box>
          ))
        )}
      </Box>

      {/* Arguments display for selected prompt */}
      {prompts.length > 0 && (
        <Box marginTop={1} flexDirection="column">
          <Text color="gray" dimColor>
            Args:{" "}
          </Text>
          <Text color="yellow">
            {prompts[selectedIndex]?.arguments?.join(", ") || "none"}
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
