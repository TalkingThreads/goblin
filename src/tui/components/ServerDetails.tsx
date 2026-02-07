import { Box, Text, useInput } from "ink";
import { useCallback, memo } from "react";
import type { TuiServer } from "../types.js";

interface ServerDetailsProps {
  server: TuiServer;
  onClose: () => void;
}

const ServerDetails = memo(function ServerDetails({
  server,
  onClose,
}: ServerDetailsProps) {
  const handleKeyDown = useCallback(
    (input: string) => {
      if (input === "\u001b" || input === "q" || input === "Escape") {
        onClose();
      }
    },
    [onClose],
  );

  useInput(handleKeyDown, { isActive: true });

  return (
    <Box
      flexDirection="column"
      borderStyle="double"
      borderColor="blue"
      paddingX={2}
      paddingY={1}
    >
      <Box marginBottom={1}>
        <Text bold color="blue" underline>
          Server Details
        </Text>
      </Box>

      <Box flexDirection="column" marginLeft={1}>
        <DetailRow label="Name" value={server.name} />
        <DetailRow label="Status" value={server.status} valueColor={getStatusColor(server.status)} />
        <DetailRow label="Transport" value={server.transport} />
        <DetailRow label="Enabled" value={server.enabled ? "Yes" : "No"} valueColor={server.enabled ? "green" : "red"} />
        {server.command && <DetailRow label="Command" value={server.command} />}
        {server.url && <DetailRow label="URL" value={server.url} />}
        {server.tools !== undefined && <DetailRow label="Tools" value={server.tools.toString()} />}
        {server.args && server.args.length > 0 && (
          <DetailRow label="Args" value={server.args.join(" ")} />
        )}
        {server.headers && Object.keys(server.headers).length > 0 && (
          <DetailRow label="Headers" value={JSON.stringify(server.headers)} />
        )}
      </Box>

      <Box marginTop={1}>
        <Text color="gray" dimColor>
          [q or Esc: Close]
        </Text>
      </Box>
    </Box>
  );
});

function DetailRow({
  label,
  value,
  valueColor = "white",
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <Box>
      <Text color="gray">{label}: </Text>
      <Text color={valueColor as "gray" | "white" | "green" | "red"}>{value}</Text>
    </Box>
  );
}

function getStatusColor(status: string): string {
  switch (status) {
    case "online":
      return "green";
    case "offline":
      return "red";
    default:
      return "yellow";
  }
}

export default ServerDetails;
