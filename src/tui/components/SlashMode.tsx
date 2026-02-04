/**
 * Slash Mode TUI Component
 * Provides autocomplete for slash commands in the TUI
 */

import { useState, useEffect, useMemo } from "react";
import { Box, Text, useInput } from "ink";
import type { Registry } from "../../gateway/registry.js";

interface SlashCommand {
  id: string;
  name: string;
  serverId: string;
  description: string;
  arguments: Array<{
    name: string;
    required: boolean;
    description: string;
  }>;
}

interface SlashModeProps {
  registry: Registry | null;
  onExecute: (command: string, args?: Record<string, string>) => void;
  onExit: () => void;
}

export function SlashMode({ registry, onExecute, onExit }: SlashModeProps) {
  const [input, setInput] = useState("");
  const [commands, setCommands] = useState<SlashCommand[]>([]);
  const [conflicts, setConflicts] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showAutocomplete, setShowAutocomplete] = useState(false);

  useEffect(() => {
    if (!registry) {
      setCommands([]);
      return;
    }

    const loadCommands = async () => {
      try {
        const response = await fetch("http://localhost:3000/api/v1/slashes");
        if (response.ok) {
          const data = (await response.json()) as { commands: SlashCommand[]; conflicts: Array<{ command: string }> };
          setCommands(data.commands || []);
          setConflicts((data.conflicts || []).map((c) => c.command));
        }
      } catch {
        setCommands([]);
      }
    };

    loadCommands();
  }, [registry]);

  const filteredCommands = useMemo(() => {
    if (!input.startsWith("/")) {
      return [];
    }

    const query = input.slice(1).toLowerCase();

    return commands.filter(
      (cmd) =>
        cmd.name.toLowerCase().includes(query) ||
        cmd.id.toLowerCase().includes(query) ||
        cmd.serverId.toLowerCase().includes(query),
    );
  }, [input, commands]);

  const currentCommand = filteredCommands[selectedIndex];

  useInput((inputChar, key) => {
    if (key.escape) {
      onExit();
      return;
    }

    if (key.return) {
      if (currentCommand) {
        onExecute(currentCommand.id);
      }
      return;
    }

    if (key.upArrow) {
      setSelectedIndex((prev) => Math.max(0, prev - 1));
      return;
    }

    if (key.downArrow) {
      setSelectedIndex((prev) => Math.min(filteredCommands.length - 1, prev + 1));
      return;
    }

    if (inputChar === "/") {
      setShowAutocomplete(true);
      setSelectedIndex(0);
    }

    setInput((prev) => prev + inputChar);
  });

  if (!showAutocomplete && !input.startsWith("/")) {
    return null;
  }

  return (
    <Box flexDirection="column" marginTop={1}>
      <Box>
        <Text color="green">/</Text>
        <Text>{input}</Text>
      </Box>

      {input.startsWith("/") && filteredCommands.length > 0 && (
        <Box flexDirection="column" borderStyle="single" marginTop={1}>
          {filteredCommands.map((cmd, index) => {
            const isSelected = index === selectedIndex;
            const isConflict = conflicts.includes(cmd.name);

            return (
              <Box key={cmd.id}>
                <Text>
                  {isSelected ? "▶ " : "  "}
                  <Text color="cyan">{cmd.id}</Text>
                  {isConflict && <Text color="yellow"> [!]</Text>}
                </Text>
              </Box>
            );
          })}
        </Box>
      )}

      {currentCommand && input.startsWith("/") && (
        <Box marginTop={1} paddingX={1}>
          <Text color="gray">Press Enter to execute, ESC to cancel</Text>
        </Box>
      )}
    </Box>
  );
}

export default SlashMode;
