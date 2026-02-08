import { Box, Text, useInput } from "ink";
import { memo, useCallback, useState } from "react";
import type { AddServerFormData, TuiTransportType } from "../types.js";

interface AddServerFormProps {
  onSubmit: (data: AddServerFormData) => void;
  onCancel: () => void;
}

type FormStep = "name" | "transport" | "config" | "confirm";

const TRANSPORTS: { value: TuiTransportType; label: string }[] = [
  { value: "stdio", label: "stdio" },
  { value: "http", label: "http" },
  { value: "sse", label: "sse" },
  { value: "streamablehttp", label: "streamablehttp" },
];

const AddServerForm = memo(function AddServerForm({ onSubmit, onCancel }: AddServerFormProps) {
  const [step, setStep] = useState<FormStep>("name");
  const [formData, setFormData] = useState<AddServerFormData>({
    name: "",
    transport: "stdio",
    command: "",
    args: "",
    url: "",
    enabled: true,
  });
  const [error, setError] = useState<string | null>(null);

  const validateName = useCallback((name: string): string | null => {
    if (!name.trim()) {
      return "Server name is required";
    }
    if (name.length < 3) {
      return "Server name must be at least 3 characters";
    }
    if (name.length > 64) {
      return "Server name must be at most 64 characters";
    }
    if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(name)) {
      return "Name must start with letter and contain only letters, numbers, dashes, and underscores";
    }
    return null;
  }, []);

  const handleNameSubmit = useCallback(() => {
    const validationError = validateName(formData.name);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setStep("transport");
  }, [formData.name, validateName]);

  const handleTransportSelect = useCallback((transport: TuiTransportType) => {
    setFormData((prev) => ({ ...prev, transport, command: "", args: "", url: "" }));
    setStep("config");
  }, []);

  const handleConfigSubmit = useCallback(() => {
    if (formData.transport === "stdio") {
      if (!formData.command?.trim()) {
        setError("Command is required");
        return;
      }
    } else {
      if (!formData.url?.trim()) {
        setError("URL is required");
        return;
      }
      if (!formData.url.startsWith("http://") && !formData.url.startsWith("https://")) {
        setError("URL must start with http:// or https://");
        return;
      }
    }
    setError(null);
    setStep("confirm");
  }, [formData]);

  const handleConfirm = useCallback(() => {
    onSubmit(formData);
  }, [formData, onSubmit]);

  const handleBack = useCallback(() => {
    if (step === "transport") {
      setStep("name");
    } else if (step === "config") {
      setStep("transport");
    } else if (step === "confirm") {
      setStep("config");
    }
  }, [step]);

  const handleEsc = useCallback(() => {
    if (step === "name") {
      onCancel();
    } else {
      handleBack();
    }
  }, [step, onCancel, handleBack]);

  useInput(
    (input) => {
      setError(null);

      if (input === "\u001b") {
        handleEsc();
        return;
      }

      if (step === "name") {
        if (input === "\r" || input === "\n") {
          handleNameSubmit();
        } else if (input === "Backspace") {
          setFormData((prev) => ({ ...prev, name: prev.name.slice(0, -1) }));
        } else if (input.length === 1 && !input.match(/[\x00-\x1F\x7F]/)) {
          setFormData((prev) => ({ ...prev, name: (prev.name + input).slice(0, 64) }));
        }
      } else if (step === "transport") {
        if (input === "1") {
          handleTransportSelect("stdio");
        } else if (input === "2") {
          handleTransportSelect("http");
        } else if (input === "3") {
          handleTransportSelect("sse");
        } else if (input === "4") {
          handleTransportSelect("streamablehttp");
        }
      } else if (step === "config") {
        if (input === "\r" || input === "\n") {
          handleConfigSubmit();
        } else if (input === "Backspace") {
          if (formData.transport === "stdio") {
            setFormData((prev) => ({ ...prev, command: (prev.command ?? "").slice(0, -1) }));
          } else {
            setFormData((prev) => ({ ...prev, url: (prev.url ?? "").slice(0, -1) }));
          }
        } else if (input.length === 1 && !input.match(/[\x00-\x1F\x7F]/)) {
          if (formData.transport === "stdio") {
            setFormData((prev) => ({
              ...prev,
              command: ((prev.command ?? "") + input).slice(0, 256),
            }));
          } else {
            setFormData((prev) => ({ ...prev, url: ((prev.url ?? "") + input).slice(0, 256) }));
          }
        }
      } else if (step === "confirm") {
        if (input === "y" || input === "Y" || input === "\r" || input === "\n") {
          handleConfirm();
        } else if (input === "n" || input === "N") {
          handleBack();
        }
      }
    },
    { isActive: true },
  );

  const renderStepIndicator = () => {
    const steps: { key: FormStep; label: string }[] = [
      { key: "name", label: "Name" },
      { key: "transport", label: "Transport" },
      { key: "config", label: "Config" },
      { key: "confirm", label: "Confirm" },
    ];

    return (
      <Box marginBottom={1}>
        {steps.map((s, i) => {
          const isCurrent = step === s.key;
          const isPast = stepOrder.indexOf(step) > i;
          return (
            <Box key={s.key} marginRight={2}>
              <Text color={isCurrent ? "green" : isPast ? "gray" : "dimColor"}>
                {isCurrent ? "*" : isPast ? "✓" : "○"} {s.label}
              </Text>
            </Box>
          );
        })}
      </Box>
    );
  };

  const stepOrder: FormStep[] = ["name", "transport", "config", "confirm"];

  return (
    <Box flexDirection="column" borderStyle="double" borderColor="cyan" paddingX={2} paddingY={1}>
      <Text bold color="cyan">
        Add Server
      </Text>
      {renderStepIndicator()}

      {error && (
        <Box marginBottom={1}>
          <Text color="red">Error: {error}</Text>
        </Box>
      )}

      {step === "name" && (
        <Box flexDirection="column">
          <Text>Enter server name:</Text>
          <Box marginTop={1} marginBottom={1}>
            <Text color="gray">{"> "}</Text>
            <Text>{formData.name}</Text>
            <Text> _</Text>
          </Box>
          <Text color="gray">3-64 characters, letters, numbers, dashes, underscores</Text>
          <Text color="gray">[Enter: Next] [Esc: Cancel]</Text>
        </Box>
      )}

      {step === "transport" && (
        <Box flexDirection="column">
          <Text>Select transport type:</Text>
          <Box flexDirection="column" marginTop={1}>
            {TRANSPORTS.map((t, i) => (
              <Box key={t.value} marginLeft={2}>
                <Text color={formData.transport === t.value ? "green" : "white"}>
                  [{formData.transport === t.value ? "x" : " "}] {i + 1}. {t.label}
                </Text>
              </Box>
            ))}
          </Box>
          <Box marginTop={1}>
            <Text color="gray">[1-4: Select] [Esc: Back]</Text>
          </Box>
        </Box>
      )}

      {step === "config" && (
        <Box flexDirection="column">
          {formData.transport === "stdio" ? (
            <>
              <Text>Enter command:</Text>
              <Box marginTop={1} marginBottom={1}>
                <Text color="gray">{"> "}</Text>
                <Text>{formData.command}</Text>
                <Text> _</Text>
              </Box>
            </>
          ) : (
            <>
              <Text>Enter URL:</Text>
              <Box marginTop={1} marginBottom={1}>
                <Text color="gray">{"> "}</Text>
                <Text>{formData.url}</Text>
                <Text> _</Text>
              </Box>
            </>
          )}
          <Text color="gray">[Enter: Next] [Esc: Back]</Text>
        </Box>
      )}

      {step === "confirm" && (
        <Box flexDirection="column">
          <Text bold>Review server configuration:</Text>
          <Box flexDirection="column" marginTop={1} marginLeft={2}>
            <Text>Name: {formData.name}</Text>
            <Text>Transport: {formData.transport}</Text>
            {formData.transport === "stdio" ? (
              <Text>Command: {formData.command}</Text>
            ) : (
              <Text>URL: {formData.url}</Text>
            )}
            <Text>Enabled: {formData.enabled ? "Yes" : "No"}</Text>
          </Box>
          <Box marginTop={1}>
            <Text color="green">Add this server? [Y/N]</Text>
          </Box>
          <Text color="gray">[Y: Confirm] [N: Back] [Esc: Back]</Text>
        </Box>
      )}
    </Box>
  );
});

export default AddServerForm;
