import { Box, Text, useInput } from "ink";
import { useState, memo } from "react";
import type { TuiServer } from "../types.js";

interface ConfirmDialogProps {
  type: "remove";
  server: TuiServer;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog = memo(function ConfirmDialog({
  type,
  server,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [confirmed, setConfirmed] = useState(false);

  useInput(
    (input) => {
      if (input === "y" || input === "Y" || input === "\r" || input === "\n") {
        setConfirmed(true);
        onConfirm();
      } else if (input === "n" || input === "N" || input === "\u001b") {
        onCancel();
      }
    },
    { isActive: true },
  );

  return (
    <Box flexDirection="column" borderStyle="double" borderColor="red" paddingX={2} paddingY={1}>
      <Text bold color="red">
        {type === "remove" ? "Remove Server?" : "Confirm Action?"}
      </Text>
      <Text>{"=".repeat(30)}</Text>

      <Box flexDirection="column" marginTop={1} marginLeft={2}>
        <Text>Name: {server.name}</Text>
        <Text>Transport: {server.transport}</Text>
        {server.command && <Text>Command: {server.command}</Text>}
        {server.url && <Text>URL: {server.url}</Text>}
        <Text>Enabled: {server.enabled ? "Yes" : "No"}</Text>
      </Box>

      {type === "remove" && (
        <Box marginTop={1}>
          <Text color="red">This will remove the server from configuration.</Text>
        </Box>
      )}

      <Box marginTop={1}>
        <Text color={confirmed ? "green" : "yellow"}>
          [{confirmed ? "x" : " "}] Yes, {type === "remove" ? "remove" : "confirm"}
        </Text>
        <Text> </Text>
        <Text color={!confirmed ? "green" : "gray"}>
          [{!confirmed ? "x" : " "}] No, cancel
        </Text>
      </Box>

      <Box marginTop={1}>
        <Text color="gray">[Y: Confirm] [N/Cancel] [Esc: Cancel]</Text>
      </Box>
    </Box>
  );
});

export default ConfirmDialog;
