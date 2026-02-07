import { Box, Text, useInput } from "ink";
import { useState, useCallback, memo } from "react";
import type { ToolCard } from "../../gateway/types.js";
import type { GoblinGateway } from "../../core/gateway.js";

interface ToolInvocationPanelProps {
  tools: ToolCard[];
  gateway: GoblinGateway | null;
}

type InvokeStep = "tool-select" | "args-edit" | "result";

interface ToolInvocationState {
  step: InvokeStep;
  selectedToolIndex: number;
  argsText: string;
  result: string | null;
  error: string | null;
  isLoading: boolean;
}

const ToolInvocationPanel = memo(function ToolInvocationPanel({
  tools,
  gateway,
}: ToolInvocationPanelProps) {
  const [state, setState] = useState<ToolInvocationState>({
    step: "tool-select",
    selectedToolIndex: 0,
    argsText: "{}",
    result: null,
    error: null,
    isLoading: false,
  });

  const handleUp = useCallback(() => {
    setState((prev) => ({
      ...prev,
      selectedToolIndex: prev.selectedToolIndex > 0 ? prev.selectedToolIndex - 1 : tools.length - 1,
    }));
  }, [tools.length]);

  const handleDown = useCallback(() => {
    setState((prev) => ({
      ...prev,
      selectedToolIndex: prev.selectedToolIndex < tools.length - 1 ? prev.selectedToolIndex + 1 : 0,
    }));
  }, [tools.length]);

  const handleTab = useCallback(() => {
    if (state.step === "tool-select") {
      setState((prev) => ({ ...prev, step: "args-edit" }));
    } else if (state.step === "args-edit") {
      setState((prev) => ({ ...prev, step: "result" }));
    } else if (state.step === "result") {
      setState((prev) => ({ ...prev, step: "tool-select" }));
    }
  }, [state.step]);

  const handleBackTab = useCallback(() => {
    if (state.step === "result") {
      setState((prev) => ({ ...prev, step: "args-edit" }));
    } else if (state.step === "args-edit") {
      setState((prev) => ({ ...prev, step: "tool-select" }));
    } else if (state.step === "tool-select") {
      setState((prev) => ({ ...prev, step: "result" }));
    }
  }, [state.step]);

  const handleEnter = useCallback(() => {
    if (state.step === "tool-select") {
      setState((prev) => ({ ...prev, step: "args-edit" }));
    } else if (state.step === "args-edit") {
      handleInvoke();
    } else if (state.step === "result") {
      setState((prev) => ({
        ...prev,
        step: "tool-select",
        result: null,
        error: null,
      }));
    }
  }, [state.step, state.argsText, tools]);

  const handleInvoke = useCallback(async () => {
    const tool = tools[state.selectedToolIndex];
    if (!tool) return;

    try {
      const args = JSON.parse(state.argsText);
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      if (!gateway?.router) {
        setState((prev) => ({
          ...prev,
          step: "result",
          result: JSON.stringify({ error: "Gateway router not available" }, null, 2),
          isLoading: false,
        }));
        return;
      }

      const callResult = await gateway.router.callTool(tool.name, args);

      const resultContent = callResult.content
        .map((c) => (c.type === "text" ? c.text : JSON.stringify(c)))
        .join("\n");

      setState((prev) => ({
        ...prev,
        step: "result",
        result: callResult.isError
          ? JSON.stringify({ error: resultContent }, null, 2)
          : JSON.stringify({ success: true, content: resultContent }, null, 2),
        isLoading: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        step: "result",
        result: JSON.stringify(
          { error: error instanceof Error ? error.message : "Unknown error" },
          null,
          2,
        ),
        isLoading: false,
      }));
    }
  }, [tools, state.selectedToolIndex, state.argsText, gateway]);

  const handleKey = useCallback(
    (input: string) => {
      if (state.step === "args-edit") {
        if (input === "Backspace") {
          setState((prev) => ({
            ...prev,
            argsText: prev.argsText.slice(0, -1) || "{}",
          }));
        } else if (input.length === 1 && !input.match(/[\x00-\x1F\x7F]/)) {
          setState((prev) => ({
            ...prev,
            argsText: (prev.argsText === "{}" ? "" : prev.argsText + input).slice(0, 1000),
          }));
        }
      }
    },
    [state.step],
  );

  useInput(
    (input) => {
      if (input === "\t") {
        handleTab();
        return;
      }
      if (input === "\u001b[Z") {
        handleBackTab();
        return;
      }
      if (input === "\r" || input === "\n") {
        handleEnter();
        return;
      }
      if (input === "k" || input === "↑") {
        handleUp();
        return;
      }
      if (input === "j" || input === "↓") {
        handleDown();
        return;
      }
      if (input === "Escape") {
        setState((prev) => ({
          ...prev,
          step: "tool-select",
          result: null,
          error: null,
        }));
        return;
      }

      handleKey(input);
    },
    { isActive: true },
  );

  const selectedTool = tools[state.selectedToolIndex];

  return (
    <Box flexDirection="column" borderStyle="single" borderColor="magenta" paddingX={1} flexGrow={1}>
      <Box marginBottom={1}>
        <Text bold underline color="magenta">
          TOOL INVOCATION
        </Text>
        <Box marginLeft={2}>
          <Text color="gray">[Tab: Next] [↑/↓: Navigate] [Enter: Select/Invoke]</Text>
        </Box>
      </Box>

      {tools.length === 0 ? (
        <Box marginTop={1}>
          <Text color="gray">No tools available. Start the gateway to load tools.</Text>
        </Box>
      ) : (
        <>
          <Box flexDirection="column">
            <Box marginBottom={1}>
              <Text bold color="gray">
                Available Tools:
              </Text>
            </Box>
            {tools.map((tool, index) => (
              <Box key={tool.name}>
                <Box width={2}>
                  <Text color={state.step === "tool-select" && index === state.selectedToolIndex ? "magenta" : "gray"}>
                    {state.step === "tool-select" && index === state.selectedToolIndex ? "▶" : " "}
                  </Text>
                </Box>
                <Box width={25}>
                  <Text
                    color={state.step === "tool-select" && index === state.selectedToolIndex ? "magenta" : undefined}
                  >
                    {tool.name}
                  </Text>
                </Box>
                <Box width={15}>
                  <Text color="gray">({tool.serverId})</Text>
                </Box>
              </Box>
            ))}
          </Box>

          {selectedTool && selectedTool.description && (
            <Box marginTop={1} flexDirection="column">
              <Text bold color="gray">
                Description:
              </Text>
              <Text>{selectedTool.description}</Text>
            </Box>
          )}

          <Box marginTop={1} flexDirection="column">
            <Box marginBottom={1}>
              <Text bold color={state.step === "args-edit" ? "magenta" : "gray"}>
                Arguments (JSON):
              </Text>
            </Box>
            <Box
              borderStyle="single"
              borderColor={state.step === "args-edit" ? "magenta" : "gray"}
              paddingX={1}
            >
              <Text color="white">{state.argsText}</Text>
            </Box>
          </Box>

          <Box marginTop={1}>
            <Text
              bold
              color={state.step === "result" ? "magenta" : state.isLoading ? "yellow" : "gray"}
            >
              {state.isLoading
                ? "⏳ Invoking..."
                : state.result
                  ? "Result:"
                  : "[Enter] Invoke"}
            </Text>
          </Box>

          {state.result && (
            <Box
              marginTop={1}
              flexDirection="column"
              borderStyle="single"
              borderColor="green"
              paddingX={1}
            >
              <Text color="green">{state.result}</Text>
            </Box>
          )}

          <Box marginTop={1}>
            <Text color="gray" dimColor>
              [Tab: Select] [↑/↓: Tools] [Type: Args] [Enter: Invoke] [Esc: Reset]
            </Text>
          </Box>
        </>
      )}
    </Box>
  );
});

export default ToolInvocationPanel;
