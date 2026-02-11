import { spawn } from "node:child_process";
import { Box, Text, useInput } from "ink";
import { memo, useCallback, useState } from "react";

interface ValidationError {
  path: string;
  message: string;
}

interface ValidationResult {
  valid: boolean;
  path: string;
  errors: ValidationError[];
}

interface ConfigValidationPanelProps {
  configPath?: string;
}

type ValidationStep = "idle" | "validating" | "result";

const parseZodErrors = (
  errorObj: Record<string, unknown>,
  prefix: string,
  errors: ValidationError[],
) => {
  for (const [key, value] of Object.entries(errorObj)) {
    const path = prefix ? `${prefix}.${key}` : key;

    if (typeof value === "string") {
      errors.push({ path, message: value });
    } else if (Array.isArray(value) && value.length > 0 && typeof value[0] === "string") {
      errors.push({ path, message: value[0] as string });
    } else if (typeof value === "object" && value !== null) {
      const obj = value as Record<string, unknown>;
      if ("_errors" in obj && Array.isArray(obj["_errors"])) {
        for (const err of obj["_errors"] as string[]) {
          errors.push({ path, message: err });
        }
      } else {
        parseZodErrors(obj, path, errors);
      }
    }
  }
};

const ConfigValidationPanel = memo(function ConfigValidationPanel({
  configPath: initialConfigPath,
}: ConfigValidationPanelProps) {
  const [configPath, setConfigPath] = useState(initialConfigPath || "goblin.json");
  const [step, setStep] = useState<ValidationStep>("idle");
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [inputText, setInputText] = useState(configPath);

  const handleValidate = useCallback(async () => {
    setStep("validating");

    await new Promise((resolve) => setTimeout(resolve, 500));

    try {
      const response = await fetch(
        `http://localhost:3000/config/validate?path=${encodeURIComponent(configPath)}`,
      );

      if (response.ok) {
        setResult({ valid: true, path: configPath, errors: [] });
        setStep("result");
      } else {
        const data = (await response.json()) as Record<string, unknown>;
        const errors: ValidationError[] = [];

        if ("errors" in data) {
          parseZodErrors(data["errors"] as Record<string, unknown>, "", errors);
        }

        setResult({ valid: false, path: configPath, errors });
        setStep("result");
      }
    } catch {
      setResult({
        valid: false,
        path: configPath,
        errors: [{ path: "connection", message: "Could not connect to gateway" }],
      });
      setStep("result");
    }
  }, [configPath]);

  const handleOpenEditor = useCallback(() => {
    const editor = process.env["VISUAL"] || process.env["EDITOR"] || "vi";
    const args = editor === "vi" || editor === "vim" ? [configPath] : ["+", configPath];

    try {
      const child = spawn(editor, args, { stdio: "inherit" });

      child.on("close", (code) => {
        if (code === 0) {
          handleValidate();
        }
      });
    } catch {
      setResult({
        valid: false,
        path: configPath,
        errors: [{ path: "editor", message: `Could not open editor: ${editor}` }],
      });
    }
  }, [configPath, handleValidate]);

  const handleKey = useCallback(
    (input: string) => {
      if (step === "idle") {
        if (input === "Backspace") {
          setInputText((prev) => prev.slice(0, -1) || "goblin.json");
        } else if (input === "\r" || input === "\n") {
          setConfigPath(inputText);
          handleValidate();
        } else if (input.length === 1 && !input.match(/[\x00-\x1F\x7F]/)) {
          setInputText((prev) => (prev + input).slice(0, 256));
        }
      }
    },
    [step, inputText, handleValidate],
  );

  useInput(
    (input) => {
      if (input === "v") {
        if (step === "idle") {
          handleValidate();
        }
        return;
      }
      if (input === "r") {
        setStep("idle");
        setResult(null);
        return;
      }
      if (input === "e") {
        if (step === "result" && result && !result.valid) {
          handleOpenEditor();
        }
        return;
      }
      if (input === "\u001b") {
        setStep("idle");
        setResult(null);
        return;
      }

      handleKey(input);
    },
    { isActive: true },
  );

  return (
    <Box flexDirection="column" borderStyle="single" borderColor="yellow" paddingX={1} flexGrow={1}>
      <Box marginBottom={1}>
        <Text bold underline color="yellow">
          CONFIG VALIDATION
        </Text>
        <Box marginLeft={2}>
          <Text color="gray">[V: Validate] [E: Edit] [R: Reset]</Text>
        </Box>
      </Box>

      {step === "idle" && (
        <Box flexDirection="column">
          <Box marginBottom={1}>
            <Text>Config Path:</Text>
          </Box>
          <Box borderStyle="single" borderColor="gray" paddingX={1}>
            <Text color="white">{inputText}</Text>
            <Text> _</Text>
          </Box>
          <Box marginTop={1}>
            <Text color="gray">[Type: Edit path] [Enter: Validate]</Text>
          </Box>
        </Box>
      )}

      {step === "validating" && (
        <Box marginTop={1}>
          <Text color="yellow">Validating config...</Text>
        </Box>
      )}

      {step === "result" && result && (
        <Box flexDirection="column">
          <Box marginBottom={1}>
            <Text bold color={result.valid ? "green" : "red"}>
              {result.valid ? "✓ Config is valid" : "✗ Config is invalid"}
            </Text>
            <Box marginLeft={1}>
              <Text color="gray">({result.path})</Text>
            </Box>
          </Box>

          {result.valid ? (
            <Box marginTop={1}>
              <Text color="green">Your configuration is valid and ready to use.</Text>
            </Box>
          ) : (
            <>
              <Box marginTop={1}>
                <Text bold color="red">
                  Validation Errors:
                </Text>
              </Box>
              <Box flexDirection="column" marginLeft={2} marginTop={1}>
                {result.errors.map((error, index) => (
                  <Box key={index} marginBottom={1}>
                    <Text color="red">• </Text>
                    <Box flexDirection="column">
                      <Text color="red">{error.path}</Text>
                      <Text color="gray" dimColor>
                        {error.message}
                      </Text>
                    </Box>
                  </Box>
                ))}
              </Box>
              <Box marginTop={1}>
                <Text color="gray" dimColor>
                  Press [E] to open in editor, or [R] to re-validate.
                </Text>
              </Box>
            </>
          )}
        </Box>
      )}
    </Box>
  );
});

export default ConfigValidationPanel;
