export type TuiTransportType = "stdio" | "http" | "sse" | "streamablehttp";

export interface TuiServerConfig {
  name: string;
  transport: TuiTransportType;
  command?: string;
  args?: string[];
  url?: string;
  headers?: Record<string, string>;
  enabled: boolean;
  mode?: "stateful" | "stateless";
}

export interface TuiServer extends TuiServerConfig {
  status: "online" | "offline" | "unknown";
  tools?: number;
}

export type TuiScreen = "dashboard" | "add-server" | "confirm-remove" | "server-details";

export interface AddServerFormData {
  name: string;
  transport: TuiTransportType;
  command?: string;
  args?: string;
  url?: string;
  enabled: boolean;
}

export interface ConfirmDialogData {
  type: "remove";
  server: TuiServer;
}

export interface ServerDetailsData {
  server: TuiServer;
}
